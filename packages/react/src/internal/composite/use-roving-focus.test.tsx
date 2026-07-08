import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { useRovingFocus } from './use-roving-focus.js'

interface RovingFocusExampleProps {
  orientation?: 'horizontal' | 'vertical' | 'both'
  loop?: boolean
  includeSkippedContent?: boolean
  showFourth?: boolean
  onParentKeyDown?: React.KeyboardEventHandler<HTMLFieldSetElement>
}

function RovingFocusExample(props: RovingFocusExampleProps) {
  const {
    orientation,
    loop,
    includeSkippedContent = false,
    showFourth = false,
    onParentKeyDown,
  } = props
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const rovingFocus = useRovingFocus({ containerRef, orientation, loop })

  return (
    <fieldset data-testid="parent" onKeyDown={onParentKeyDown}>
      <div data-testid="container" ref={containerRef} {...rovingFocus}>
        <button type="button" data-testid="button-1">
          One
        </button>
        {includeSkippedContent ? (
          <>
            <button type="button" data-testid="button-disabled" disabled>
              Disabled
            </button>
            <span data-testid="not-candidate">Not a candidate</span>
          </>
        ) : null}
        <button type="button" data-testid="button-2">
          Two
        </button>
        <button type="button" data-testid="button-3">
          Three
        </button>
        {showFourth ? (
          <button type="button" data-testid="button-4">
            Four
          </button>
        ) : null}
      </div>
    </fieldset>
  )
}

function DynamicRovingFocusExample() {
  const [showFourth, setShowFourth] = React.useState(false)

  return (
    <>
      <button
        type="button"
        data-testid="add-button"
        onClick={() => setShowFourth(true)}
      >
        Add button
      </button>
      <RovingFocusExample showFourth={showFourth} />
    </>
  )
}

function getButton(testId: string): HTMLButtonElement {
  return screen.getByTestId(testId) as HTMLButtonElement
}

function expectTabStops(active: HTMLElement, inactive: HTMLElement[]): void {
  expect(active).toHaveAttribute('tabindex', '0')

  for (const element of inactive) {
    expect(element).toHaveAttribute('tabindex', '-1')
  }
}

function expectOnlyTabStop(container: HTMLElement, active: HTMLElement): void {
  const tabStops = Array.from(container.querySelectorAll('[tabindex="0"]'))

  expect(tabStops).toHaveLength(1)
  expect(tabStops[0]).toBe(active)
}

describe('useRovingFocus', () => {
  it('initializes exactly one tab stop on the first button', () => {
    render(<RovingFocusExample />)

    const container = screen.getByTestId('container')
    const first = getButton('button-1')
    const second = getButton('button-2')
    const third = getButton('button-3')

    expectOnlyTabStop(container, first)
    expectTabStops(first, [second, third])
  })

  it('moves focus and the tab stop with horizontal arrow keys by default', async () => {
    const user = userEvent.setup()
    render(<RovingFocusExample />)

    const first = getButton('button-1')
    const second = getButton('button-2')
    const third = getButton('button-3')

    await user.click(first)
    await user.keyboard('{ArrowRight}')

    expect(second).toHaveFocus()
    expectTabStops(second, [first, third])

    await user.keyboard('{ArrowLeft}')

    expect(first).toHaveFocus()
    expectTabStops(first, [second, third])
  })

  it('skips disabled buttons and non-candidates when moving focus', async () => {
    const user = userEvent.setup()
    render(<RovingFocusExample includeSkippedContent />)

    const first = getButton('button-1')
    const disabled = getButton('button-disabled')
    const second = getButton('button-2')
    const third = getButton('button-3')
    const span = screen.getByTestId('not-candidate')

    await user.click(first)
    await user.keyboard('{ArrowRight}')

    expect(second).toHaveFocus()
    expectTabStops(second, [first, third])
    expect(disabled).not.toHaveAttribute('tabindex')
    expect(span).not.toHaveAttribute('tabindex')
  })

  it('moves focus to the first and last candidates with Home and End', async () => {
    const user = userEvent.setup()
    render(<RovingFocusExample />)

    const first = getButton('button-1')
    const second = getButton('button-2')
    const third = getButton('button-3')

    await user.click(second)
    await user.keyboard('{End}')

    expect(third).toHaveFocus()
    expectTabStops(third, [first, second])

    await user.keyboard('{Home}')

    expect(first).toHaveFocus()
    expectTabStops(first, [second, third])
  })

  it('does not prevent default or move focus at a non-looping edge', async () => {
    const user = userEvent.setup()
    const defaultPreventedValues: boolean[] = []
    render(
      <RovingFocusExample
        onParentKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            defaultPreventedValues.push(event.defaultPrevented)
          }
        }}
      />,
    )

    const first = getButton('button-1')
    const second = getButton('button-2')
    const third = getButton('button-3')

    await user.click(third)
    await user.keyboard('{ArrowRight}')

    expect(third).toHaveFocus()
    expectTabStops(third, [first, second])
    expect(defaultPreventedValues).toEqual([false])
  })

  it('wraps from the last candidate to the first when loop is true', async () => {
    const user = userEvent.setup()
    render(<RovingFocusExample loop />)

    const first = getButton('button-1')
    const second = getButton('button-2')
    const third = getButton('button-3')

    await user.click(third)
    await user.keyboard('{ArrowRight}')

    expect(first).toHaveFocus()
    expectTabStops(first, [second, third])
  })

  it('remembers the last focused child when focus leaves the container', async () => {
    const user = userEvent.setup()
    render(
      <>
        <RovingFocusExample />
        <button type="button" data-testid="outside-button">
          Outside
        </button>
      </>,
    )

    const first = getButton('button-1')
    const second = getButton('button-2')
    const third = getButton('button-3')
    const outside = getButton('outside-button')

    await user.click(second)
    await user.click(outside)

    expect(outside).toHaveFocus()
    expectTabStops(second, [first, third])
  })

  it('moves focus with vertical arrows only when orientation is vertical', async () => {
    const user = userEvent.setup()
    render(<RovingFocusExample orientation="vertical" />)

    const first = getButton('button-1')
    const second = getButton('button-2')
    const third = getButton('button-3')

    await user.click(first)
    await user.keyboard('{ArrowDown}')

    expect(second).toHaveFocus()
    expectTabStops(second, [first, third])

    await user.keyboard('{ArrowUp}')

    expect(first).toHaveFocus()
    expectTabStops(first, [second, third])

    await user.keyboard('{ArrowRight}')

    expect(first).toHaveFocus()
    expectTabStops(first, [second, third])
  })

  it('normalizes dynamically appended candidates to tabindex -1', async () => {
    const user = userEvent.setup()
    render(<DynamicRovingFocusExample />)

    const container = screen.getByTestId('container')
    const first = getButton('button-1')
    const second = getButton('button-2')
    const third = getButton('button-3')

    expectTabStops(first, [second, third])

    await user.click(screen.getByTestId('add-button'))

    const fourth = getButton('button-4')

    await waitFor(() => {
      expect(fourth).toHaveAttribute('tabindex', '-1')
    })

    expectOnlyTabStop(container, first)
    expectTabStops(first, [second, third, fourth])
  })
})
