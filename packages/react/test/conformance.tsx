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

/**
 * Checks that each part forwards extra props and its ref to its element, and
 * resolves function `className` and `style` props against its state.
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
