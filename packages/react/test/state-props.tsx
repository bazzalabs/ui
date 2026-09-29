import { cleanup, render, screen } from '@testing-library/react'
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
