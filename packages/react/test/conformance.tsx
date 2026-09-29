import { cleanup, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

/**
 * Props the helper passes to the part under test.
 */
export interface ConformanceTargetProps {
  'data-testid': string
  className?: any
  style?: any
  lang?: string
  'data-conformance'?: string
  ref?: React.Ref<any>
  render?: any
}

export interface ConformanceCase {
  /** The public part name, e.g. `Select.Trigger`. */
  name: string
  /** Renders the part inside whatever tree it needs, spreading `props` on it. */
  render: (props: ConformanceTargetProps) => React.ReactElement
  /** A subset of the state the part should pass to the functions. */
  state?: Record<string, unknown>
  /** Runs after render, for parts that only mount after interaction. */
  interact?: () => Promise<void>
  /** The part's `style` prop only accepts an object, not a function. */
  objectStyleOnly?: boolean
  /** The part's `render` prop only accepts a function, not an element. */
  functionRenderOnly?: boolean
  /**
   * The full state the `render` function receives, for parts whose `render`
   * state differs from their `className` state.
   */
  renderState?: Record<string, unknown>
}

const TEST_ID = 'conformance-target'

async function mount(
  testCase: ConformanceCase,
  props: Omit<ConformanceTargetProps, 'data-testid'>,
) {
  render(testCase.render({ 'data-testid': TEST_ID, ...props }))
  await testCase.interact?.()
  return screen.findByTestId(TEST_ID)
}
const STYLE_COLOR = 'rgb(1, 2, 3)'

/** Attributes the helper itself adds, left out of the attribute check. */
const HELPER_ATTRIBUTES = new Set([
  'data-testid',
  'data-rendered',
  'data-render-target',
])

/** Attributes holding generated ids, which change between mounts. */
const ID_ATTRIBUTES = new Set([
  'id',
  'for',
  'aria-activedescendant',
  'aria-controls',
  'aria-describedby',
  'aria-labelledby',
  'aria-owns',
])

/**
 * The element's attributes, with generated id values replaced by a
 * placeholder so two mounts can be compared.
 */
function partAttributes(element: HTMLElement) {
  return Object.fromEntries(
    element
      .getAttributeNames()
      .filter((name) => !HELPER_ATTRIBUTES.has(name))
      .map((name) => [
        name,
        ID_ATTRIBUTES.has(name) ? '<id>' : element.getAttribute(name),
      ]),
  )
}

/**
 * A consumer component used as the `render` target. It renders the part's own
 * tag and marks the element, so a check can tell it was rendered.
 */
function RenderTarget({
  tag,
  ...props
}: { tag: string } & Record<string, unknown>) {
  return React.createElement(tag, { ...props, 'data-render-target': '' })
}

/**
 * Mounts the part plainly, then again with the `render` prop that
 * `getRender` builds for the part's tag. Checks the consumer's component
 * rendered the element, with the plain element's attributes and the ref.
 */
async function mountThroughRender(
  testCase: ConformanceCase,
  props: Omit<ConformanceTargetProps, 'data-testid' | 'ref' | 'render'>,
  getRender: (tag: string) => unknown,
) {
  const plain = await mount(testCase, props)
  const tag = plain.localName
  const attributes = partAttributes(plain)
  cleanup()

  const ref = React.createRef<HTMLElement>()
  const rendered = await mount(testCase, {
    ...props,
    ref,
    render: getRender(tag),
  })
  expect(rendered).toHaveAttribute('data-render-target')
  expect(partAttributes(rendered)).toMatchObject(attributes)
  expect(ref.current).toBe(rendered)
  return rendered
}

/**
 * Checks that each part forwards extra props and its ref to its element,
 * resolves function `className` and `style` props against its state, and
 * keeps its attributes, ref and state when rendered through `render`.
 */
export function describeConformance(family: string, cases: ConformanceCase[]) {
  describe(`${family}: conformance`, () => {
    for (const testCase of cases) {
      describe(testCase.name, () => {
        it('forwards extra props to its element', async () => {
          const element = await mount(testCase, {
            lang: 'fr',
            'data-conformance': 'forwarded',
          })
          expect(element).toHaveAttribute('lang', 'fr')
          expect(element).toHaveAttribute('data-conformance', 'forwarded')
        })

        it('forwards its ref to its element', async () => {
          const ref = React.createRef<HTMLElement>()
          const element = await mount(testCase, { ref })
          expect(ref.current).toBe(element)
        })

        it('applies className as a string or a function of the part state', async () => {
          const withString = await mount(testCase, { className: 'from-string' })
          expect(withString).toHaveClass('from-string')
          cleanup()

          const className = vi.fn((_state: unknown) => 'from-fn')
          const withFn = await mount(testCase, { className })
          expect(withFn).toHaveClass('from-fn')
          expectCalledWithState(className, testCase.state)
        })

        it('applies style as an object or a function of the part state', async () => {
          const withObject = await mount(testCase, {
            style: { color: STYLE_COLOR },
          })
          expect(withObject.style.color).toBe(STYLE_COLOR)
          if (testCase.objectStyleOnly) return
          cleanup()

          const style = vi.fn((_state: unknown) => ({ color: STYLE_COLOR }))
          const withFn = await mount(testCase, { style })
          expect(withFn.style.color).toBe(STYLE_COLOR)
          expectCalledWithState(style, testCase.state)
        })

        it.skipIf(testCase.functionRenderOnly)(
          'renders through a render element, keeping its attributes and ref',
          async () => {
            const rendered = await mountThroughRender(testCase, {}, (tag) => (
              <RenderTarget tag={tag} data-rendered="element" />
            ))
            expect(rendered).toHaveAttribute('data-rendered', 'element')
          },
        )

        it('renders through a render function, keeping its attributes and ref', async () => {
          const className = vi.fn((_state: unknown) => 'from-fn')
          const renderFn = vi.fn()
          await mountThroughRender(testCase, { className }, (tag) =>
            renderFn.mockImplementation((props: object) => (
              <RenderTarget tag={tag} {...props} />
            )),
          )

          // The render function gets the same state as the className function.
          const state = renderFn.mock.lastCall?.[1]
          if (testCase.renderState) {
            expect(state).toEqual(testCase.renderState)
          } else {
            expect(state).toEqual(className.mock.lastCall?.[0])
          }
        })
      })
    }
  })
}

function expectCalledWithState(
  fn: ReturnType<typeof vi.fn>,
  state: Record<string, unknown> | undefined,
) {
  expect(fn).toHaveBeenCalled()
  const received = fn.mock.lastCall?.[0]
  expect(received).toBeTypeOf('object')
  if (state) {
    expect(received).toMatchObject(state)
  }
}
