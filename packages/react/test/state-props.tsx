import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

/**
 * Props the helper passes to the part under test.
 */
export interface StatePropsTargetProps {
  'data-testid': string
  className?: any
  style?: any
}

export interface StatePropsCase {
  /** The public part name, e.g. `Select.Trigger`. */
  name: string
  /** Renders the part inside whatever tree it needs, spreading `props` on it. */
  render: (props: StatePropsTargetProps) => React.ReactElement
  /** A subset of the state the part should pass to the functions. */
  state?: Record<string, unknown>
  /** Skip the `className` assertions (the part has no function `className`). */
  skipClassName?: boolean
  /** Runs after render, for parts that only mount after interaction. */
  interact?: () => Promise<void>
}

const TEST_ID = 'state-props-target'

async function mount(
  testCase: StatePropsCase,
  props: Omit<StatePropsTargetProps, 'data-testid'>,
) {
  render(testCase.render({ 'data-testid': TEST_ID, ...props }))
  await testCase.interact?.()
  return screen.findByTestId(TEST_ID)
}
const STYLE_COLOR = 'rgb(1, 2, 3)'

/**
 * Asserts that each part resolves function `className` and `style` props
 * against its state and applies the result to its element.
 */
export function describeStateProps(family: string, cases: StatePropsCase[]) {
  describe(`${family}: state-function className and style`, () => {
    for (const testCase of cases) {
      describe(testCase.name, () => {
        if (!testCase.skipClassName) {
          it('applies a className function called with the part state', async () => {
            const className = vi.fn((_state: unknown) => 'from-fn')
            const element = await mount(testCase, { className })
            expect(element).toHaveClass('from-fn')
            expectCalledWithState(className, testCase.state)
          })

          it('applies a string className', async () => {
            const element = await mount(testCase, { className: 'from-string' })
            expect(element).toHaveClass('from-string')
          })
        }

        it('applies a style function called with the part state', async () => {
          const style = vi.fn((_state: unknown) => ({ color: STYLE_COLOR }))
          const element = await mount(testCase, { style })
          expect(element.style.color).toBe(STYLE_COLOR)
          expectCalledWithState(style, testCase.state)
        })

        it('applies a style object', async () => {
          const element = await mount(testCase, {
            style: { color: STYLE_COLOR },
          })
          expect(element.style.color).toBe(STYLE_COLOR)
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
