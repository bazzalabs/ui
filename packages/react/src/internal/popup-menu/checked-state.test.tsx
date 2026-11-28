import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { flushSync } from 'react-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

/**
 * Checked state: a standalone item's own state (`useState` or its `checked`
 * prop), a group's value in its group's store. Each part keeps the contract
 * it had before the group's value moved into a store.
 */

function Menu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>{children}</DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function Checkbox(props: DropdownMenu.CheckboxItem.Props & { value: string }) {
  return (
    <DropdownMenu.CheckboxItem data-testid={props.value} {...props}>
      <DropdownMenu.CheckboxItemIndicator
        keepMounted
        data-testid={`${props.value}-indicator`}
      />
      {props.value}
    </DropdownMenu.CheckboxItem>
  )
}

const checkedOf = (id: string) =>
  screen.getByTestId(id).getAttribute('aria-checked')
const press = (id: string) =>
  act(() => {
    fireEvent.click(screen.getByTestId(id))
  })

// Through the indicator's `toggle`, called directly: a click on such an
// item would select through the listbox, which registers it under its
// value or label (none, or the same for both).
const toggles = new Map<string, () => void>()
function ToggleIndicator({ testId }: { testId: string }) {
  return (
    <DropdownMenu.CheckboxItemIndicator
      keepMounted
      render={(props, state) => {
        toggles.set(testId, state.toggle)
        return <span {...props} />
      }}
    />
  )
}
const toggle = (testId: string) =>
  act(() => {
    toggles.get(testId)?.()
  })

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('standalone checkbox item', () => {
  it('toggles uncontrolled, and its indicator with it', async () => {
    render(
      <Menu>
        <Checkbox value="a" defaultChecked />
      </Menu>,
    )
    await act(async () => {})
    expect(checkedOf('a')).toBe('true')
    press('a')
    expect(checkedOf('a')).toBe('false')
    expect(screen.getByTestId('a-indicator')).toHaveAttribute('data-unchecked')
    press('a')
    expect(checkedOf('a')).toBe('true')
    expect(screen.getByTestId('a-indicator')).toHaveAttribute('data-checked')
  })

  it('ignores a later defaultChecked, in every render', async () => {
    const rendered: boolean[] = []
    const className = (state: DropdownMenu.CheckboxItem.State) => {
      rendered.push(state.checked)
      return ''
    }
    const { rerender } = render(
      <Menu>
        <Checkbox value="a" defaultChecked={false} className={className} />
      </Menu>,
    )
    await act(async () => {})
    rerender(
      <Menu>
        <Checkbox value="a" defaultChecked className={className} />
      </Menu>,
    )
    await act(async () => {})
    expect(checkedOf('a')).toBe('false')
    expect(rendered).not.toContain(true)
  })

  it('tells a controlled consumer of every press, and renders only its prop', async () => {
    const onCheckedChange = vi.fn()
    const { rerender } = render(
      <Menu>
        <Checkbox value="a" checked={false} onCheckedChange={onCheckedChange} />
      </Menu>,
    )
    await act(async () => {})
    press('a')
    press('a')
    expect(onCheckedChange.mock.calls.map(([next]) => next)).toEqual([
      true,
      true,
    ])
    expect(checkedOf('a')).toBe('false')
    rerender(
      <Menu>
        <Checkbox value="a" checked onCheckedChange={onCheckedChange} />
      </Menu>,
    )
    expect(checkedOf('a')).toBe('true')
    press('a')
    expect(onCheckedChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'item-press' }),
    )
  })

  it('keeps a value the consumer sets from inside its callback with flushSync', async () => {
    function Controlled() {
      const [checked, setChecked] = React.useState(false)
      return (
        <Checkbox
          value="a"
          checked={checked}
          onCheckedChange={(next) => flushSync(() => setChecked(next))}
        />
      )
    }
    render(
      <Menu>
        <Controlled />
      </Menu>,
    )
    await act(async () => {})
    press('a')
    expect(checkedOf('a')).toBe('true')
    press('a')
    expect(checkedOf('a')).toBe('false')
  })

  it('stays as it was when the consumer cancels', async () => {
    render(
      <Menu>
        <Checkbox
          value="a"
          onCheckedChange={(_next, details) => details.cancel()}
        />
      </Menu>,
    )
    await act(async () => {})
    press('a')
    expect(checkedOf('a')).toBe('false')
  })

  it('keeps its own value under a prop, and goes back to it, in every render, when the prop is dropped', async () => {
    const rendered: boolean[] = []
    const className = (state: DropdownMenu.CheckboxItem.State) => {
      rendered.push(state.checked)
      return ''
    }
    const { rerender } = render(
      <Menu>
        <Checkbox value="a" className={className} />
      </Menu>,
    )
    await act(async () => {})
    press('a')
    expect(checkedOf('a')).toBe('true')
    rerender(
      <Menu>
        <Checkbox value="a" checked={false} className={className} />
      </Menu>,
    )
    expect(checkedOf('a')).toBe('false')
    rendered.length = 0
    rerender(
      <Menu>
        <Checkbox value="a" className={className} />
      </Menu>,
    )
    await act(async () => {})
    // The value the item had before the prop, not its default.
    expect(rendered).toEqual([true])
    press('a')
    expect(checkedOf('a')).toBe('false')
  })

  it('keeps its value hidden and shown again by <Activity>, from its first render, and starts over when it remounts', async () => {
    const renderedA: boolean[] = []
    const renderedB: boolean[] = []
    const record =
      (into: boolean[]) => (state: DropdownMenu.CheckboxItem.State) => {
        into.push(state.checked)
        return ''
      }
    function Rows({
      mode,
      show,
    }: {
      mode: 'visible' | 'hidden'
      show: boolean
    }) {
      return (
        <Menu>
          <React.Activity mode={mode}>
            <DropdownMenu.CheckboxItem
              value="a"
              data-testid="a"
              className={record(renderedA)}
            >
              <DropdownMenu.CheckboxItemIndicator data-testid="a-indicator" />a
            </DropdownMenu.CheckboxItem>
          </React.Activity>
          {show && <Checkbox value="b" className={record(renderedB)} />}
        </Menu>
      )
    }
    const { rerender } = render(<Rows mode="visible" show />)
    await act(async () => {})
    press('a')
    press('b')
    expect(checkedOf('a')).toBe('true')
    expect(checkedOf('b')).toBe('true')
    const indicator = screen.getByTestId('a-indicator')
    rerender(<Rows mode="hidden" show={false} />)
    await act(async () => {})
    renderedA.length = 0
    renderedB.length = 0
    rerender(<Rows mode="visible" show />)
    await act(async () => {})
    expect(checkedOf('a')).toBe('true')
    expect(renderedA.length).toBeGreaterThan(0)
    expect(renderedA).not.toContain(false)
    // Never unchecked in between, so its indicator stayed mounted.
    expect(screen.getByTestId('a-indicator')).toBe(indicator)
    // A new item, as a virtualized row that mounts again is, from its first
    // render.
    expect(checkedOf('b')).toBe('false')
    expect(renderedB).toContain(false)
    expect(renderedB).not.toContain(true)
  })

  it('toggles and notifies with no value or label (an icon-only item)', async () => {
    const onCheckedChange = vi.fn()
    render(
      <Menu>
        <DropdownMenu.CheckboxItem
          data-testid="icon"
          aria-label="Bold"
          onCheckedChange={onCheckedChange}
        >
          <ToggleIndicator testId="icon-toggle" />
        </DropdownMenu.CheckboxItem>
      </Menu>,
    )
    await act(async () => {})
    toggle('icon-toggle')
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'item-press' }),
    )
    expect(checkedOf('icon')).toBe('true')
  })

  it('keeps two items with the same label apart, and one working when the other unmounts', async () => {
    function Rows({ first }: { first: boolean }) {
      return (
        <Menu>
          {first && (
            <DropdownMenu.CheckboxItem data-testid="first">
              <ToggleIndicator testId="first-toggle" />
              Same
            </DropdownMenu.CheckboxItem>
          )}
          <DropdownMenu.CheckboxItem data-testid="second">
            <ToggleIndicator testId="second-toggle" />
            Same
          </DropdownMenu.CheckboxItem>
        </Menu>
      )
    }
    const { rerender } = render(<Rows first />)
    await act(async () => {})
    toggle('first-toggle')
    expect(checkedOf('first')).toBe('true')
    expect(checkedOf('second')).toBe('false')
    toggle('second-toggle')
    expect(checkedOf('first')).toBe('true')
    expect(checkedOf('second')).toBe('true')
    rerender(<Rows first={false} />)
    await act(async () => {})
    expect(checkedOf('second')).toBe('true')
    toggle('second-toggle')
    expect(checkedOf('second')).toBe('false')
  })
})

describe('checkbox group', () => {
  it('tells a controlled consumer of every press, and renders only its value', async () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <Menu>
        <DropdownMenu.CheckboxGroup value={[]} onValueChange={onValueChange}>
          <Checkbox value="a" />
          <Checkbox value="b" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await act(async () => {})
    press('a')
    press('a')
    expect(onValueChange.mock.calls.map(([next]) => next)).toEqual([
      ['a'],
      ['a'],
    ])
    expect(checkedOf('a')).toBe('false')
    rerender(
      <Menu>
        <DropdownMenu.CheckboxGroup value={['b']} onValueChange={onValueChange}>
          <Checkbox value="a" />
          <Checkbox value="b" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    expect(checkedOf('a')).toBe('false')
    expect(checkedOf('b')).toBe('true')
    expect(screen.getByTestId('b-indicator')).toHaveAttribute('data-checked')
  })

  it('keeps a value the consumer sets from inside its callback with flushSync', async () => {
    function Controlled() {
      const [value, setValue] = React.useState<string[]>([])
      return (
        <DropdownMenu.CheckboxGroup
          value={value}
          onValueChange={(next) => flushSync(() => setValue(next))}
        >
          <Checkbox value="a" />
          <Checkbox value="b" />
        </DropdownMenu.CheckboxGroup>
      )
    }
    render(
      <Menu>
        <Controlled />
      </Menu>,
    )
    await act(async () => {})
    press('a')
    press('b')
    expect(checkedOf('a')).toBe('true')
    expect(checkedOf('b')).toBe('true')
    press('a')
    expect(checkedOf('a')).toBe('false')
  })

  it('unchecks the checked rows a range spans', async () => {
    const onValueChange = vi.fn()
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup
          defaultValue={['a', 'b', 'c']}
          onValueChange={onValueChange}
        >
          <Checkbox value="a" />
          <Checkbox value="b" />
          <Checkbox value="c" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await act(async () => {})
    press('a')
    act(() => {
      fireEvent.click(screen.getByTestId('c'), { shiftKey: true })
    })
    expect(onValueChange).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ reason: 'range-selection' }),
    )
    expect(['a', 'b', 'c'].map(checkedOf)).toEqual(['false', 'false', 'false'])
  })

  it('unchecks the checked rows a range spans in a controlled group', async () => {
    function Controlled() {
      const [value, setValue] = React.useState(['a', 'b', 'c'])
      return (
        <DropdownMenu.CheckboxGroup value={value} onValueChange={setValue}>
          <Checkbox value="a" />
          <Checkbox value="b" />
          <Checkbox value="c" />
        </DropdownMenu.CheckboxGroup>
      )
    }
    render(
      <Menu>
        <Controlled />
      </Menu>,
    )
    await act(async () => {})
    press('a')
    act(() => {
      fireEvent.click(screen.getByTestId('c'), { shiftKey: true })
    })
    expect(['a', 'b', 'c'].map(checkedOf)).toEqual(['false', 'false', 'false'])
  })

  it('keeps a prop the consumer starts controlling with from inside its callback', async () => {
    function TakesControl() {
      const [value, setValue] = React.useState<string[] | undefined>()
      return (
        <DropdownMenu.CheckboxGroup
          value={value}
          onValueChange={() => flushSync(() => setValue(['b']))}
        >
          <Checkbox value="a" />
          <Checkbox value="b" />
        </DropdownMenu.CheckboxGroup>
      )
    }
    render(
      <Menu>
        <TakesControl />
      </Menu>,
    )
    await act(async () => {})
    press('a')
    expect(checkedOf('a')).toBe('false')
    expect(checkedOf('b')).toBe('true')
  })

  it('keeps a change the consumer makes from inside its callback', async () => {
    const onValueChange = vi.fn((next: string[]) => {
      // The first change toggles b too, before it returns.
      if (onValueChange.mock.calls.length === 1) toggles.get('b-toggle')?.()
      return next
    })
    render(
      <Menu>
        <DropdownMenu.CheckboxGroup onValueChange={onValueChange}>
          <Checkbox value="a" />
          <DropdownMenu.CheckboxItem value="b" data-testid="b">
            <ToggleIndicator testId="b-toggle" />b
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await act(async () => {})
    press('a')
    expect(onValueChange.mock.calls.map(([next]) => next)).toEqual([
      ['a'],
      ['b'],
    ])
    // The later change, made while the first was being decided, stands.
    expect(checkedOf('a')).toBe('false')
    expect(checkedOf('b')).toBe('true')
  })

  it('keeps its own value under a prop, and goes back to it, in every render, when the prop is dropped', async () => {
    const rendered: boolean[] = []
    const className = (state: DropdownMenu.CheckboxItem.State) => {
      rendered.push(state.checked)
      return ''
    }
    const tree = (value?: string[]) => (
      <Menu>
        <DropdownMenu.CheckboxGroup value={value} defaultValue={[]}>
          <Checkbox value="a" className={className} />
          <Checkbox value="b" />
        </DropdownMenu.CheckboxGroup>
      </Menu>
    )
    const { rerender } = render(tree())
    await act(async () => {})
    press('a')
    rerender(tree(['b']))
    expect(checkedOf('a')).toBe('false')
    rendered.length = 0
    rerender(tree())
    await act(async () => {})
    // The value the group had before the prop, not its default, in every
    // render from the first.
    expect(checkedOf('a')).toBe('true')
    expect(checkedOf('b')).toBe('false')
    expect(rendered.length).toBeGreaterThan(0)
    expect([...new Set(rendered)]).toEqual([true])
  })

  it('ignores a later defaultValue', async () => {
    const { rerender } = render(
      <Menu>
        <DropdownMenu.CheckboxGroup defaultValue={['a']}>
          <Checkbox value="a" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    await act(async () => {})
    rerender(
      <Menu>
        <DropdownMenu.CheckboxGroup defaultValue={[]}>
          <Checkbox value="a" />
        </DropdownMenu.CheckboxGroup>
      </Menu>,
    )
    expect(checkedOf('a')).toBe('true')
  })

  it('takes a headless provider value from outside the surface', async () => {
    const onValueChange = vi.fn()
    function Tree({ value }: { value: string[] }) {
      return (
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.CheckboxGroupValue
                  value={value}
                  onValueChange={onValueChange}
                >
                  <DropdownMenu.Surface>
                    <DropdownMenu.List>
                      <Checkbox value="a" />
                      <Checkbox value="b" />
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.CheckboxGroupValue>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
    const { rerender } = render(<Tree value={['a']} />)
    await act(async () => {})
    expect(checkedOf('a')).toBe('true')
    press('b')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
      ['a', 'b'],
      expect.objectContaining({ reason: 'item-press' }),
    )
    expect(checkedOf('b')).toBe('false')
    rerender(<Tree value={['b']} />)
    expect(checkedOf('a')).toBe('false')
    expect(checkedOf('b')).toBe('true')
  })
})
