import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { flushSync } from 'react-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'

/**
 * A radio group's selected value in its group's store. `RadioGroup` and
 * `RadioGroupValue` keep the contract they had with their own React state.
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

function Radio({
  value,
  className,
}: {
  value: string
  className?: DropdownMenu.RadioItem.Props['className']
}) {
  return (
    <DropdownMenu.RadioItem
      value={value}
      data-testid={value}
      className={className}
    >
      <DropdownMenu.RadioItemIndicator data-testid={`${value}-indicator`} />
      {value}
    </DropdownMenu.RadioItem>
  )
}

const VALUES = ['a', 'b', 'c']
const rows = () => VALUES.map((value) => <Radio key={value} value={value} />)

const selected = () =>
  VALUES.filter(
    (value) =>
      screen.getByTestId(value).getAttribute('aria-checked') === 'true',
  )
const press = (id: string) =>
  act(() => {
    fireEvent.click(screen.getByTestId(id))
  })

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('radio group', () => {
  it('selects uncontrolled, and its indicators follow', async () => {
    render(
      <Menu>
        <DropdownMenu.RadioGroup defaultValue="a">
          {rows()}
        </DropdownMenu.RadioGroup>
      </Menu>,
    )
    await act(async () => {})
    expect(selected()).toEqual(['a'])
    press('b')
    expect(selected()).toEqual(['b'])
    expect(screen.queryByTestId('a-indicator')).toBeNull()
    expect(screen.getByTestId('b-indicator')).toHaveAttribute('data-checked')
  })

  it('ignores a later defaultValue, in every render', async () => {
    const rendered: boolean[] = []
    const className = (state: DropdownMenu.RadioItem.State) => {
      rendered.push(state.checked)
      return ''
    }
    const tree = (defaultValue: string) => (
      <Menu>
        <DropdownMenu.RadioGroup defaultValue={defaultValue}>
          <Radio value="a" />
          <Radio value="b" className={className} />
        </DropdownMenu.RadioGroup>
      </Menu>
    )
    const { rerender } = render(tree('a'))
    await act(async () => {})
    rerender(tree('b'))
    await act(async () => {})
    expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'false')
    expect(rendered).not.toContain(true)
  })

  it('tells a controlled consumer of every press, and renders only its value', async () => {
    const onValueChange = vi.fn()
    const tree = (value: string) => (
      <Menu>
        <DropdownMenu.RadioGroup value={value} onValueChange={onValueChange}>
          {rows()}
        </DropdownMenu.RadioGroup>
      </Menu>
    )
    const { rerender } = render(tree('a'))
    await act(async () => {})
    press('b')
    press('b')
    // Pressing the selected item tells the consumer too.
    press('a')
    expect(onValueChange.mock.calls.map(([next]) => next)).toEqual([
      'b',
      'b',
      'a',
    ])
    expect(onValueChange).toHaveBeenLastCalledWith(
      'a',
      expect.objectContaining({ reason: 'item-press' }),
    )
    expect(selected()).toEqual(['a'])
    rerender(tree('c'))
    expect(selected()).toEqual(['c'])
    expect(screen.getByTestId('c-indicator')).toHaveAttribute('data-checked')
  })

  it('stays as it was when the consumer cancels', async () => {
    render(
      <Menu>
        <DropdownMenu.RadioGroup
          defaultValue="a"
          onValueChange={(_next, details) => details.cancel()}
        >
          {rows()}
        </DropdownMenu.RadioGroup>
      </Menu>,
    )
    await act(async () => {})
    press('b')
    expect(selected()).toEqual(['a'])
  })

  it('keeps a value the consumer sets from inside its callback with flushSync', async () => {
    function Controlled() {
      const [value, setValue] = React.useState('a')
      return (
        <DropdownMenu.RadioGroup
          value={value}
          onValueChange={(next) => flushSync(() => setValue(next))}
        >
          {rows()}
        </DropdownMenu.RadioGroup>
      )
    }
    render(
      <Menu>
        <Controlled />
      </Menu>,
    )
    await act(async () => {})
    press('b')
    expect(selected()).toEqual(['b'])
    press('c')
    expect(selected()).toEqual(['c'])
  })

  it('keeps a prop the consumer starts controlling with from inside its callback', async () => {
    function TakesControl() {
      const [value, setValue] = React.useState<string | undefined>()
      return (
        <DropdownMenu.RadioGroup
          value={value}
          onValueChange={() => flushSync(() => setValue('c'))}
        >
          {rows()}
        </DropdownMenu.RadioGroup>
      )
    }
    render(
      <Menu>
        <TakesControl />
      </Menu>,
    )
    await act(async () => {})
    press('a')
    expect(selected()).toEqual(['c'])
  })

  it('keeps a change the consumer makes from inside its callback', async () => {
    const onValueChange = vi.fn((next: string) => {
      // The first change selects c too, before it returns.
      if (next === 'a') fireEvent.click(screen.getByTestId('c'))
    })
    render(
      <Menu>
        <DropdownMenu.RadioGroup onValueChange={onValueChange}>
          {rows()}
        </DropdownMenu.RadioGroup>
      </Menu>,
    )
    await act(async () => {})
    press('a')
    expect(onValueChange.mock.calls.map(([next]) => next)).toEqual(['a', 'c'])
    // The later change, made while the first was being decided, stands.
    expect(selected()).toEqual(['c'])
  })

  it('keeps its own value under a prop, and goes back to it, in every render, when the prop is dropped', async () => {
    const rendered: boolean[] = []
    const className = (state: DropdownMenu.RadioItem.State) => {
      rendered.push(state.checked)
      return ''
    }
    const tree = (value?: string) => (
      <Menu>
        <DropdownMenu.RadioGroup value={value} defaultValue="a">
          <Radio value="a" />
          <Radio value="b" className={className} />
          <Radio value="c" />
        </DropdownMenu.RadioGroup>
      </Menu>
    )
    const { rerender } = render(tree())
    await act(async () => {})
    press('b')
    rerender(tree('c'))
    expect(selected()).toEqual(['c'])
    rendered.length = 0
    rerender(tree())
    await act(async () => {})
    // The value the group had before the prop, not its default, in every
    // render from the first. (The item renders twice here, as it did before
    // the group had a store: its label is inferred from its children again.)
    expect(selected()).toEqual(['b'])
    expect([...new Set(rendered)]).toEqual([true])
  })

  it('shows its defaultValue, in every render, when a prop it started with is dropped', async () => {
    const rendered: boolean[] = []
    const className = (state: DropdownMenu.RadioItem.State) => {
      rendered.push(state.checked)
      return ''
    }
    const tree = (value?: string) => (
      <Menu>
        <DropdownMenu.RadioGroup value={value} defaultValue="a">
          <Radio value="a" className={className} />
          <Radio value="b" />
        </DropdownMenu.RadioGroup>
      </Menu>
    )
    const { rerender } = render(tree('b'))
    await act(async () => {})
    expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'true')
    rendered.length = 0
    rerender(tree())
    await act(async () => {})
    expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'false')
    expect([...new Set(rendered)]).toEqual([true])
  })

  it('keeps its value hidden and shown again by <Activity>, from its first render, and starts over when it remounts', async () => {
    const rendered: boolean[] = []
    const className = (state: DropdownMenu.RadioItem.State) => {
      rendered.push(state.checked)
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
            <DropdownMenu.RadioGroup defaultValue="a">
              <Radio value="a" />
              <Radio value="b" className={className} />
            </DropdownMenu.RadioGroup>
          </React.Activity>
          {show && (
            <DropdownMenu.RadioGroup defaultValue="x">
              <Radio value="x" />
              <Radio value="y" />
            </DropdownMenu.RadioGroup>
          )}
        </Menu>
      )
    }
    const isSelected = (id: string) =>
      screen.getByTestId(id).getAttribute('aria-checked')
    const { rerender } = render(<Rows mode="visible" show />)
    await act(async () => {})
    press('b')
    press('y')
    const indicator = screen.getByTestId('b-indicator')
    rerender(<Rows mode="hidden" show={false} />)
    await act(async () => {})
    rendered.length = 0
    rerender(<Rows mode="visible" show />)
    await act(async () => {})
    expect(isSelected('b')).toBe('true')
    expect(rendered.length).toBeGreaterThan(0)
    expect(rendered).not.toContain(false)
    expect(screen.getByTestId('b-indicator')).toBe(indicator)
    // A new group starts from its default.
    expect(isSelected('x')).toBe('true')
    expect(isSelected('y')).toBe('false')
  })
})

describe('headless radio group value', () => {
  function Tree({
    value,
    onValueChange,
  }: {
    value: string | undefined
    onValueChange: (value: string) => void
  }) {
    return (
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.RadioGroupValue
                value={value}
                onValueChange={onValueChange}
              >
                <DropdownMenu.Surface>
                  <DropdownMenu.List>{rows()}</DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.RadioGroupValue>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  it('takes its value from outside the surface, and only reports presses', async () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <Tree value="a" onValueChange={onValueChange} />,
    )
    await act(async () => {})
    expect(selected()).toEqual(['a'])
    press('b')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
      'b',
      expect.objectContaining({ reason: 'item-press' }),
    )
    expect(selected()).toEqual(['a'])
    rerender(<Tree value="b" onValueChange={onValueChange} />)
    expect(selected()).toEqual(['b'])
  })

  it('keeps no value of its own while its value is undefined', async () => {
    const onValueChange = vi.fn()
    render(<Tree value={undefined} onValueChange={onValueChange} />)
    await act(async () => {})
    press('b')
    expect(onValueChange).toHaveBeenCalledOnce()
    expect(selected()).toEqual([])
  })
})

describe('data-first radio group', () => {
  it('selects through the def, its rows wrapped in a value provider', async () => {
    const onValueChange = vi.fn()
    function ListItems() {
      const { nodes, renderNode } = DropdownMenu.useDataList()
      return <>{nodes.map(renderNode)}</>
    }
    function DataMenu() {
      const [value, setValue] = React.useState('a')
      const content = React.useMemo(
        () => [
          {
            kind: 'radio-group' as const,
            id: 'size',
            value,
            nodes: VALUES.map((item) => ({
              kind: 'radio-item' as const,
              value: item,
              render: ({ props }: { props: DropdownMenu.RadioItem.Props }) => (
                <DropdownMenu.RadioGroupValue
                  value={value}
                  onValueChange={(next, details) => {
                    onValueChange(next, details)
                    setValue(next)
                  }}
                >
                  <DropdownMenu.RadioItem {...props} data-testid={item}>
                    {item}
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroupValue>
              ),
            })),
          },
        ],
        [value],
      )
      return (
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface content={content}>
                  <DropdownMenu.List>
                    <ListItems />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }
    render(<DataMenu />)
    await act(async () => {})
    expect(selected()).toEqual(['a'])
    press('c')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
      'c',
      expect.objectContaining({ reason: 'item-press' }),
    )
    expect(selected()).toEqual(['c'])
  })
})
