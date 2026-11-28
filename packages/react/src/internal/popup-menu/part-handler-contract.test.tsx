import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Combobox } from '../../combobox/index.js'
import { CommandMenu } from '../../command-menu/index.js'
import { ContextMenu } from '../../context-menu/index.js'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { Select } from '../../select/index.js'
import { ListboxStore, useListboxKeyboard } from '../listbox/index.js'
import { useFocusOwner } from './index.js'

/**
 * The part handler contract ("Event handlers" in packages/react/AGENTS.md)
 * for every handler a part composes with its consumer's. Each case runs the
 * event three times: as it is, which shows the part's effect; with the
 * consumer calling `event.preventBaseUIHandler()`, which skips it (rule 2);
 * and with the consumer calling `event.preventDefault()`, which skips it only
 * where it always has (rule 3).
 */

type Handler = (event: React.SyntheticEvent) => void
const skip: Handler = (event) =>
  (
    event as unknown as { preventBaseUIHandler: () => void }
  ).preventBaseUIHandler()
const keep: Handler = () => {}
const prevent: Handler = (event) => event.preventDefault()

/**
 * Runs `scenario` with a consumer handler that does nothing, one that calls
 * `preventBaseUIHandler()`, and one that calls `preventDefault()`.
 */
async function each(
  scenario: (consumer: Handler) => Promise<void> | void,
): Promise<void> {
  for (const consumer of [keep, skip, prevent]) {
    await scenario(consumer)
    cleanup()
  }
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function Menu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List data-testid="list">
                {children}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const move = (element: HTMLElement) =>
  fireEvent.pointerMove(element, {
    pointerType: 'mouse',
    clientX: 5,
    clientY: 5,
  })

/** Whether a pointer move on a row highlights it, for each way. */
async function highlightOnMove(
  renderRow: (onPointerMove: Handler) => React.ReactElement,
) {
  const results: boolean[] = []
  await each(async (consumer) => {
    render(
      <Menu>
        {/* The menu highlights its first row as it opens. */}
        <DropdownMenu.Item>First</DropdownMenu.Item>
        {renderRow(consumer)}
      </Menu>,
    )
    await act(async () => {})
    move(screen.getByTestId('row'))
    results.push(screen.getByTestId('row').hasAttribute('data-highlighted'))
  })
  expect(results).toEqual([true, false, false])
}

describe('a DropdownMenu row composes its own handlers with the consumer’s', () => {
  it('Item: click selects, pointer move highlights', async () => {
    const onSelect = vi.fn()
    await each(async (consumer) => {
      render(
        <Menu>
          <DropdownMenu.Item
            data-testid="row"
            onClick={consumer}
            onSelect={onSelect}
          >
            A
          </DropdownMenu.Item>
        </Menu>,
      )
      fireEvent.click(screen.getByTestId('row'))
    })
    expect(onSelect).toHaveBeenCalledOnce()
    await highlightOnMove((onPointerMove) => (
      <DropdownMenu.Item data-testid="row" onPointerMove={onPointerMove}>
        A
      </DropdownMenu.Item>
    ))
  })

  it('RadioItem: click selects, pointer move highlights', async () => {
    const onValueChange = vi.fn()
    await each(async (consumer) => {
      render(
        <Menu>
          <DropdownMenu.RadioGroup onValueChange={onValueChange}>
            <DropdownMenu.RadioItem
              value="a"
              data-testid="row"
              onClick={consumer}
            >
              A
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </Menu>,
      )
      fireEvent.click(screen.getByTestId('row'))
    })
    expect(onValueChange).toHaveBeenCalledOnce()
    await highlightOnMove((onPointerMove) => (
      <DropdownMenu.RadioGroup>
        <DropdownMenu.RadioItem
          value="a"
          data-testid="row"
          onPointerMove={onPointerMove}
        >
          A
        </DropdownMenu.RadioItem>
      </DropdownMenu.RadioGroup>
    ))
  })

  it('CheckboxItem: click checks, pointer move highlights', async () => {
    const onCheckedChange = vi.fn()
    await each(async (consumer) => {
      render(
        <Menu>
          <DropdownMenu.CheckboxItem
            data-testid="row"
            onClick={consumer}
            onCheckedChange={onCheckedChange}
          >
            A
          </DropdownMenu.CheckboxItem>
        </Menu>,
      )
      fireEvent.click(screen.getByTestId('row'))
    })
    expect(onCheckedChange).toHaveBeenCalledOnce()
    await highlightOnMove((onPointerMove) => (
      <DropdownMenu.CheckboxItem
        data-testid="row"
        onPointerMove={onPointerMove}
      >
        A
      </DropdownMenu.CheckboxItem>
    ))
  })

  it('LinkItem: click selects, pointer move highlights', async () => {
    const onSelect = vi.fn()
    await each(async (consumer) => {
      render(
        <Menu>
          <DropdownMenu.LinkItem
            href="#a"
            data-testid="row"
            onClick={consumer}
            onSelect={onSelect}
          >
            A
          </DropdownMenu.LinkItem>
        </Menu>,
      )
      fireEvent.click(screen.getByTestId('row'))
    })
    expect(onSelect).toHaveBeenCalledOnce()
    await highlightOnMove((onPointerMove) => (
      <DropdownMenu.LinkItem
        href="#a"
        data-testid="row"
        onPointerMove={onPointerMove}
      >
        A
      </DropdownMenu.LinkItem>
    ))
  })

  function SubpageMenu({
    trigger = {},
    backItem = {},
    back = {},
  }: {
    trigger?: Record<string, Handler>
    backItem?: Record<string, Handler>
    back?: Record<string, Handler>
  }) {
    return (
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  <DropdownMenu.Item>First</DropdownMenu.Item>
                  <DropdownMenu.SubpageTrigger
                    targetPageId="page"
                    data-testid="trigger"
                    {...trigger}
                  >
                    Page
                  </DropdownMenu.SubpageTrigger>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
              <DropdownMenu.Subpage pageId="page">
                <DropdownMenu.Surface>
                  <DropdownMenu.SubpageBack data-testid="back" {...back}>
                    Back
                  </DropdownMenu.SubpageBack>
                  <DropdownMenu.List>
                    <DropdownMenu.Item>First</DropdownMenu.Item>
                    <DropdownMenu.SubpageBackItem
                      data-testid="back-item"
                      {...backItem}
                    >
                      Back
                    </DropdownMenu.SubpageBackItem>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Subpage>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  const onSubpage = () => screen.queryByTestId('back-item') !== null

  it('SubpageTrigger: click opens its subpage, pointer move highlights', async () => {
    const opened: boolean[] = []
    await each(async (consumer) => {
      render(<SubpageMenu trigger={{ onClick: consumer }} />)
      fireEvent.click(screen.getByTestId('trigger'))
      await act(async () => {})
      opened.push(onSubpage())
    })
    expect(opened).toEqual([true, false, false])
    const highlighted: boolean[] = []
    await each(async (consumer) => {
      render(<SubpageMenu trigger={{ onPointerMove: consumer }} />)
      await act(async () => {})
      move(screen.getByTestId('trigger'))
      highlighted.push(
        screen.getByTestId('trigger').hasAttribute('data-highlighted'),
      )
    })
    expect(highlighted).toEqual([true, false, false])
  })

  it('SubpageBackItem and SubpageBack: click goes back, pointer move highlights', async () => {
    for (const [testId, part] of [
      ['back-item', 'backItem'],
      ['back', 'back'],
    ] as const) {
      const stayed: boolean[] = []
      await each(async (consumer) => {
        render(<SubpageMenu {...{ [part]: { onClick: consumer } }} />)
        fireEvent.click(screen.getByTestId('trigger'))
        await act(async () => {})
        fireEvent.click(screen.getByTestId(testId))
        await act(async () => {})
        stayed.push(onSubpage())
      })
      expect(stayed, testId).toEqual([false, true, true])
    }
    const highlighted: boolean[] = []
    await each(async (consumer) => {
      render(<SubpageMenu backItem={{ onPointerMove: consumer }} />)
      fireEvent.click(screen.getByTestId('trigger'))
      await act(async () => {})
      move(screen.getByTestId('back-item'))
      highlighted.push(
        screen.getByTestId('back-item').hasAttribute('data-highlighted'),
      )
    })
    expect(highlighted).toEqual([true, false, false])
  })

  it('SubmenuTrigger: pointer enter and move open its submenu', async () => {
    const opened: boolean[] = []
    await each(async (consumer) => {
      render(
        <Menu>
          <DropdownMenu.Submenu>
            <DropdownMenu.SubmenuTrigger
              data-testid="trigger"
              onPointerEnter={consumer}
              onPointerMove={consumer}
            >
              More
            </DropdownMenu.SubmenuTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup data-testid="submenu">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List>
                      <DropdownMenu.Item>Sub</DropdownMenu.Item>
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Submenu>
        </Menu>,
      )
      await act(async () => {})
      const trigger = screen.getByTestId('trigger')
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      move(trigger)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
      opened.push(screen.queryByTestId('submenu') !== null)
    })
    expect(opened).toEqual([true, false, false])
  })
})

describe('a SubmenuTrigger composes its own pointer leave with the consumer’s', () => {
  it('leaving away from the open submenu closes it', async () => {
    const stayed: boolean[] = []
    await each(async (consumer) => {
      render(
        <Menu>
          <DropdownMenu.Submenu>
            <DropdownMenu.SubmenuTrigger
              data-testid="trigger"
              onPointerLeave={consumer}
            >
              More
            </DropdownMenu.SubmenuTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Positioner>
                <DropdownMenu.Popup data-testid="submenu">
                  <DropdownMenu.Surface>
                    <DropdownMenu.List>
                      <DropdownMenu.Item>Sub</DropdownMenu.Item>
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Popup>
              </DropdownMenu.Positioner>
            </DropdownMenu.Portal>
          </DropdownMenu.Submenu>
        </Menu>,
      )
      await act(async () => {})
      const trigger = screen.getByTestId('trigger')
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      move(trigger)
      await waitFor(() =>
        expect(screen.getByTestId('submenu')).toBeInTheDocument(),
      )
      fireEvent.pointerLeave(trigger, {
        pointerType: 'mouse',
        clientX: -200,
        clientY: -200,
      })
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400))
      })
      stayed.push(screen.queryByTestId('submenu') !== null)
    })
    expect(stayed).toEqual([false, true, true])
  })
})

describe('a DropdownMenu Surface, List and Input compose their own handlers with the consumer’s', () => {
  function Probe({
    seen,
  }: {
    seen: { owner: ReturnType<typeof useFocusOwner> | null }
  }) {
    seen.owner = useFocusOwner()
    return null
  }

  function SurfaceMenu({
    surface = {},
    list = {},
    input = {},
    onOpenChange,
  }: {
    surface?: Record<string, Handler>
    list?: Record<string, Handler>
    input?: Record<string, Handler>
    onOpenChange?: (open: boolean) => void
  }) {
    return (
      <DropdownMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="popup">
              <DropdownMenu.Surface data-testid="surface" {...surface}>
                <DropdownMenu.Input data-testid="input" {...input} />
                <DropdownMenu.List data-testid="list" {...list}>
                  <Probe seen={seen} />
                  <DropdownMenu.Item data-testid="a">A</DropdownMenu.Item>
                  <DropdownMenu.Item data-testid="b">B</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }
  const seen: { owner: ReturnType<typeof useFocusOwner> | null } = {
    owner: null,
  }

  it('List: a key on it navigates', async () => {
    const highlighted: (string | null)[] = []
    await each(async (consumer) => {
      render(
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface>
                  <DropdownMenu.List data-testid="list" onKeyDown={consumer}>
                    <DropdownMenu.Item data-testid="a">A</DropdownMenu.Item>
                    <DropdownMenu.Item data-testid="b">B</DropdownMenu.Item>
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>,
      )
      await act(async () => {})
      fireEvent.keyDown(screen.getByTestId('list'), { key: 'ArrowDown' })
      highlighted.push(
        ['a', 'b'].find((id) =>
          screen.getByTestId(id).hasAttribute('data-highlighted'),
        ) ?? null,
      )
    })
    expect(highlighted).toEqual(['b', 'a', 'a'])
  })

  it('useListboxKeyboard, used on its own: Escape in a submenu closes the tree', async () => {
    function Listbox({
      onKeyDown,
      closeAll,
    }: {
      onKeyDown: Handler
      closeAll: () => void
    }) {
      const [store] = React.useState(() => new ListboxStore())
      const { handleKeyDown } = useListboxKeyboard({
        store,
        surfaceId: 'listbox',
        enabled: true,
        depth: 1,
        onKeyDown,
        closeAll,
      })
      return (
        <div
          role="listbox"
          tabIndex={-1}
          data-testid="listbox"
          onKeyDown={handleKeyDown}
        />
      )
    }
    // The element takes the hook's handler as it is, with no Base UI merge
    // around it: the composed handler makes the call available itself.
    const closed: boolean[] = []
    const errors: unknown[] = []
    await each(async (consumer) => {
      const closeAll = vi.fn()
      render(
        <Listbox
          onKeyDown={(event) => {
            try {
              consumer(event)
            } catch (error) {
              errors.push(error)
            }
          }}
          closeAll={closeAll}
        />,
      )
      fireEvent.keyDown(screen.getByTestId('listbox'), { key: 'Escape' })
      closed.push(closeAll.mock.calls.length > 0)
    })
    expect(errors).toEqual([])
    expect(closed).toEqual([true, false, false])
  })

  it('Input: a key on it navigates', async () => {
    const highlighted: (string | null)[] = []
    await each(async (consumer) => {
      render(<SurfaceMenu input={{ onKeyDown: consumer }} />)
      await act(async () => {})
      fireEvent.keyDown(screen.getByTestId('input'), { key: 'ArrowDown' })
      highlighted.push(
        ['a', 'b'].find((id) =>
          screen.getByTestId(id).hasAttribute('data-highlighted'),
        ) ?? null,
      )
    })
    expect(highlighted).toEqual(['b', 'a', 'a'])
  })

  it('Surface: Tab with no focus zones closes the menu', async () => {
    const closed: boolean[] = []
    await each(async (consumer) => {
      const onOpenChange = vi.fn()
      render(
        <SurfaceMenu
          surface={{ onKeyDown: consumer }}
          onOpenChange={onOpenChange}
        />,
      )
      await act(async () => {})
      fireEvent.keyDown(screen.getByTestId('input'), { key: 'Tab' })
      closed.push(onOpenChange.mock.calls.some(([open]) => open === false))
    })
    expect(closed).toEqual([true, false, false])
  })

  /** Whether the surface takes focus ownership back from no one on `act`. */
  async function claims(
    props: Parameters<typeof SurfaceMenu>[0],
    claim: () => void,
  ): Promise<boolean> {
    render(<SurfaceMenu {...props} />)
    await act(async () => {
      // Past the Surface's pointer debounce after it opens
      await new Promise((resolve) => setTimeout(resolve, 120))
    })
    act(() => seen.owner?.setOwnerId(null))
    expect(screen.getByTestId('popup')).not.toHaveAttribute('data-focused')
    act(claim)
    return screen.getByTestId('popup').hasAttribute('data-focused')
  }

  it('Surface: pointer move and focus inside claim focus ownership', async () => {
    const onMove: boolean[] = []
    await each(async (consumer) => {
      onMove.push(
        await claims({ surface: { onPointerMove: consumer } }, () => {
          fireEvent.pointerMove(screen.getByTestId('list'), {
            pointerType: 'mouse',
          })
        }),
      )
    })
    expect(onMove, 'onPointerMove').toEqual([true, false, true])
    const onFocus: boolean[] = []
    await each(async (consumer) => {
      onFocus.push(
        await claims({ surface: { onFocus: consumer } }, () => {
          fireEvent.focus(screen.getByTestId('list'))
        }),
      )
    })
    expect(onFocus, 'onFocus').toEqual([true, false, true])
  })

  it('Input: a press claims focus ownership', async () => {
    const results: boolean[] = []
    await each(async (consumer) => {
      results.push(
        await claims({ input: { onPointerDown: consumer } }, () => {
          fireEvent.pointerDown(screen.getByTestId('input'))
        }),
      )
    })
    expect(results).toEqual([true, false, true])
  })
})

describe('Select and Combobox parts compose their own handlers with the consumer’s', () => {
  it('Select.Item: click picks, pointer move highlights', async () => {
    const onValueChange = vi.fn()
    const highlighted: boolean[] = []
    await each(async (consumer) => {
      render(
        <Select.Root defaultOpen onValueChange={onValueChange}>
          <Select.Trigger>Pick</Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Surface>
                  <Select.List>
                    <Select.Item value="a" data-testid="row" onClick={consumer}>
                      A
                    </Select.Item>
                    <Select.Item
                      value="b"
                      data-testid="other"
                      onPointerMove={consumer}
                    >
                      B
                    </Select.Item>
                  </Select.List>
                </Select.Surface>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      )
      await act(async () => {})
      move(screen.getByTestId('other'))
      highlighted.push(
        screen.getByTestId('other').hasAttribute('data-highlighted'),
      )
      fireEvent.click(screen.getByTestId('row'))
    })
    expect(onValueChange).toHaveBeenCalledOnce()
    expect(highlighted).toEqual([true, false, false])
  })

  function Combo({
    item = {},
    other = {},
    clear = {},
    icon = {},
    surface = {},
    input = {},
    defaultOpen,
    onOpenChange,
    onValueChange,
  }: {
    item?: Record<string, Handler>
    other?: Record<string, Handler>
    clear?: Record<string, Handler>
    icon?: Record<string, Handler>
    surface?: Record<string, Handler>
    input?: Record<string, Handler>
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    onValueChange?: (value: string) => void
  }) {
    return (
      <Combobox.Root
        defaultOpen={defaultOpen}
        defaultValue="b"
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
      >
        <Combobox.Input data-testid="input" {...input} />
        <Combobox.Icon data-testid="icon" {...icon} />
        <Combobox.Clear data-testid="clear" {...clear} />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Surface data-testid="surface" {...surface}>
                <Combobox.List>
                  <Combobox.Item value="a" data-testid="row" {...item}>
                    A
                  </Combobox.Item>
                  <Combobox.Item value="b" data-testid="other" {...other}>
                    B
                  </Combobox.Item>
                </Combobox.List>
              </Combobox.Surface>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
        <button type="button" data-testid="outside">
          Outside
        </button>
      </Combobox.Root>
    )
  }

  it('Combobox.Item: click picks, pointer move highlights', async () => {
    const onValueChange = vi.fn()
    const highlighted: boolean[] = []
    await each(async (consumer) => {
      render(
        <Combo
          defaultOpen
          item={{ onClick: consumer }}
          other={{ onPointerMove: consumer }}
          onValueChange={onValueChange}
        />,
      )
      await act(async () => {})
      move(screen.getByTestId('other'))
      highlighted.push(
        screen.getByTestId('other').hasAttribute('data-highlighted'),
      )
      fireEvent.click(screen.getByTestId('row'))
    })
    expect(onValueChange).toHaveBeenCalledOnce()
    expect(highlighted).toEqual([true, false, false])
  })

  it('Combobox.Clear: click clears', async () => {
    const onValueChange = vi.fn()
    await each(async (consumer) => {
      render(
        <Combo clear={{ onClick: consumer }} onValueChange={onValueChange} />,
      )
      fireEvent.click(screen.getByTestId('clear'))
    })
    expect(onValueChange).toHaveBeenCalledOnce()
  })

  it('Combobox.Icon: click opens', async () => {
    const opened: boolean[] = []
    await each(async (consumer) => {
      const onOpenChange = vi.fn()
      render(<Combo icon={{ onClick: consumer }} onOpenChange={onOpenChange} />)
      fireEvent.click(screen.getByTestId('icon'))
      await act(async () => {})
      opened.push(onOpenChange.mock.calls.some(([open]) => open === true))
    })
    expect(opened).toEqual([true, false, false])
  })

  it('Combobox.Surface: pointer move focuses the input', async () => {
    const focused: boolean[] = []
    await each(async (consumer) => {
      render(<Combo defaultOpen surface={{ onPointerMove: consumer }} />)
      await act(async () => {})
      screen.getByTestId('outside').focus()
      fireEvent.pointerMove(screen.getByTestId('surface'), {
        pointerType: 'mouse',
      })
      focused.push(document.activeElement === screen.getByTestId('input'))
    })
    expect(focused).toEqual([true, false, true])
  })

  it('Combobox.Input: focus, click and ArrowDown open; blur to outside closes', async () => {
    for (const [name, fire] of [
      ['onFocus', (input: HTMLElement) => fireEvent.focus(input)],
      ['onClick', (input: HTMLElement) => fireEvent.click(input)],
      [
        'onKeyDown',
        (input: HTMLElement) => fireEvent.keyDown(input, { key: 'ArrowDown' }),
      ],
    ] as const) {
      const opened: boolean[] = []
      await each(async (consumer) => {
        const onOpenChange = vi.fn()
        render(
          <Combo input={{ [name]: consumer }} onOpenChange={onOpenChange} />,
        )
        fire(screen.getByTestId('input'))
        await act(async () => {})
        opened.push(onOpenChange.mock.calls.some(([open]) => open === true))
      })
      expect(opened, name).toEqual([true, false, false])
    }

    const closed: boolean[] = []
    await each(async (consumer) => {
      const onOpenChange = vi.fn()
      render(
        <Combo
          defaultOpen
          input={{ onBlur: consumer }}
          onOpenChange={onOpenChange}
        />,
      )
      await act(async () => {})
      const outside = screen.getByTestId('outside')
      outside.focus()
      fireEvent.blur(screen.getByTestId('input'), { relatedTarget: outside })
      await act(async () => {
        await new Promise((resolve) =>
          requestAnimationFrame(() => resolve(null)),
        )
      })
      closed.push(onOpenChange.mock.calls.some(([open]) => open === false))
    })
    expect(closed).toEqual([true, false, false])
  })
})

describe('a ContextMenu.Trigger composes its own handlers with the consumer’s', () => {
  function Context({ trigger }: { trigger: Record<string, Handler> }) {
    return (
      <ContextMenu.Root>
        <ContextMenu.Trigger data-testid="trigger" {...trigger}>
          Area
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup>
              <ContextMenu.Surface data-testid="surface">
                <ContextMenu.List>
                  <ContextMenu.Item>A</ContextMenu.Item>
                </ContextMenu.List>
              </ContextMenu.Surface>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    )
  }
  const isOpen = () => screen.queryByTestId('surface') !== null

  it('a context menu press opens it', async () => {
    const opened: boolean[] = []
    await each(async (consumer) => {
      render(<Context trigger={{ onContextMenu: consumer }} />)
      fireEvent.contextMenu(screen.getByTestId('trigger'), {
        clientX: 10,
        clientY: 10,
      })
      await act(async () => {})
      opened.push(isOpen())
    })
    expect(opened).toEqual([true, false, false])
  })

  /** Touch start, then `then` at 250ms, then past the 500ms long press. */
  async function longPress(
    trigger: Record<string, Handler>,
    then?: (el: HTMLElement) => void,
  ) {
    vi.useFakeTimers()
    render(<Context trigger={trigger} />)
    const element = screen.getByTestId('trigger')
    await act(async () => {
      fireEvent.touchStart(element, {
        touches: [{ clientX: 100, clientY: 100 }],
      })
    })
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    if (then) await act(async () => then(element))
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    const open = isOpen()
    vi.useRealTimers()
    return open
  }

  it('a long press opens it; a move, an end or a cancel stops it', async () => {
    const started: boolean[] = []
    await each(async (consumer) => {
      started.push(await longPress({ onTouchStart: consumer }))
    })
    expect(started, 'onTouchStart').toEqual([true, false, false])
    // Skipping a move, an end or a cancel skips the stop, so the long press
    // still opens the menu.
    for (const [name, fire] of [
      [
        'onTouchMove',
        (el: HTMLElement) =>
          fireEvent.touchMove(el, {
            touches: [{ clientX: 130, clientY: 100 }],
          }),
      ],
      [
        'onTouchEnd',
        (el: HTMLElement) =>
          fireEvent.touchEnd(el, {
            changedTouches: [{ clientX: 100, clientY: 100 }],
          }),
      ],
      ['onTouchCancel', (el: HTMLElement) => fireEvent.touchCancel(el)],
    ] as const) {
      const opened: boolean[] = []
      await each(async (consumer) => {
        opened.push(await longPress({ [name]: consumer }, fire))
      })
      expect(opened, name).toEqual([false, true, false])
    }
  })
})

describe('a CommandMenu.Backdrop composes its own handlers with the consumer’s', () => {
  it('a press on it closes the menu', async () => {
    const closed: boolean[] = []
    await each(async (consumer) => {
      const onOpenChange = vi.fn()
      render(
        <CommandMenu.Root defaultOpen onOpenChange={onOpenChange}>
          <CommandMenu.Portal>
            <CommandMenu.Backdrop
              data-testid="backdrop"
              onPointerDown={consumer}
            />
            <CommandMenu.Popup>
              <CommandMenu.Surface>
                <CommandMenu.Input />
                <CommandMenu.List>
                  <CommandMenu.Item>One</CommandMenu.Item>
                </CommandMenu.List>
              </CommandMenu.Surface>
            </CommandMenu.Popup>
          </CommandMenu.Portal>
        </CommandMenu.Root>,
      )
      await waitFor(() =>
        expect(screen.getByTestId('backdrop')).toBeInTheDocument(),
      )
      fireEvent.pointerDown(screen.getByTestId('backdrop'))
      closed.push(onOpenChange.mock.calls.some(([open]) => open === false))
    })
    expect(closed).toEqual([true, false, false])
  })
})

describe('a disabled LinkItem never follows its link', () => {
  it('whatever the consumer’s click handler does', async () => {
    const blocked: boolean[] = []
    await each(async (consumer) => {
      render(
        <Menu>
          <DropdownMenu.LinkItem
            href="https://example.com"
            disabled
            data-testid="link"
            onClick={consumer}
          >
            Go
          </DropdownMenu.LinkItem>
        </Menu>,
      )
      await act(async () => {})
      // false once something canceled the click: the link doesn't navigate
      blocked.push(!fireEvent.click(screen.getByTestId('link')))
    })
    expect(blocked).toEqual([true, true, true])
  })
})

describe('preventBaseUIHandler() stays on the element it was called on', () => {
  /** A render element with handlers of its own, which Base UI merges. */
  const Box = (props: React.ComponentProps<'div'>) => <div {...props} />

  function OwnerProbe({
    seen,
  }: {
    seen: { owner: ReturnType<typeof useFocusOwner> | null }
  }) {
    seen.owner = useFocusOwner()
    return null
  }

  it('a skip on an Item doesn’t skip the Surface around it, whose render element has a handler too', async () => {
    const seen: { owner: ReturnType<typeof useFocusOwner> | null } = {
      owner: null,
    }
    const fromRender = vi.fn()
    const fromProp = vi.fn()
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup data-testid="popup">
              <DropdownMenu.Surface
                render={<Box onPointerMove={fromRender} />}
                onPointerMove={fromProp}
              >
                <DropdownMenu.List>
                  <OwnerProbe seen={seen} />
                  <DropdownMenu.Item data-testid="a" onPointerMove={skip}>
                    A
                  </DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await act(async () => {
      // Past the Surface's pointer debounce after it opens
      await new Promise((resolve) => setTimeout(resolve, 120))
    })
    act(() => seen.owner?.setOwnerId(null))
    act(() => {
      fireEvent.pointerMove(screen.getByTestId('a'), { pointerType: 'mouse' })
    })
    expect(fromRender).toHaveBeenCalledOnce()
    // The Surface's consumer handler and its own focus reclaim both run.
    expect(fromProp).toHaveBeenCalledOnce()
    expect(screen.getByTestId('popup')).toHaveAttribute('data-focused')
  })

  it('a skip on an Input’s key doesn’t skip the Surface’s Tab handling, whose render element has a key handler too', async () => {
    const onOpenChange = vi.fn()
    render(
      <DropdownMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface render={<Box onKeyDown={() => {}} />}>
                <DropdownMenu.Input data-testid="input" onKeyDown={skip} />
                <DropdownMenu.List>
                  <DropdownMenu.Item>A</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    await act(async () => {})
    fireEvent.keyDown(screen.getByTestId('input'), { key: 'Tab' })
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it('a skip on a CommandMenu.Input’s key doesn’t skip Dialog.Popup’s, which keeps ArrowDown in the dialog', async () => {
    const outside = vi.fn()
    render(
      <Box onKeyDown={(event) => outside(event.key)}>
        <CommandMenu.Root defaultOpen>
          <CommandMenu.Portal>
            <CommandMenu.Popup onKeyDown={() => {}}>
              <CommandMenu.Surface>
                <CommandMenu.Input data-testid="input" onKeyDown={skip} />
                <CommandMenu.List>
                  <CommandMenu.Item>One</CommandMenu.Item>
                </CommandMenu.List>
              </CommandMenu.Surface>
            </CommandMenu.Popup>
          </CommandMenu.Portal>
        </CommandMenu.Root>
      </Box>,
    )
    await waitFor(() => expect(screen.getByTestId('input')).toBeInTheDocument())
    fireEvent.keyDown(screen.getByTestId('input'), { key: 'ArrowDown' })
    expect(outside).not.toHaveBeenCalledWith('ArrowDown')
  })

  it('a skip still reaches what is composed over the handler on the same element', async () => {
    // Combobox.Surface's handler is the engine Surface's consumer handler:
    // the consumer's skip on Combobox.Surface skips both parts' own handlers.
    const focused: boolean[] = []
    for (const consumer of [keep, skip]) {
      const seen: { owner: ReturnType<typeof useFocusOwner> | null } = {
        owner: null,
      }
      render(
        <Combobox.Root defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup data-testid="popup">
                <Combobox.Surface
                  data-testid="surface"
                  onPointerMove={consumer}
                >
                  <Combobox.List>
                    <OwnerProbe seen={seen} />
                    <Combobox.Item value="a">A</Combobox.Item>
                  </Combobox.List>
                </Combobox.Surface>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
          <button type="button" data-testid="outside">
            Outside
          </button>
        </Combobox.Root>,
      )
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 120))
      })
      act(() => seen.owner?.setOwnerId(null))
      screen.getByTestId('outside').focus()
      act(() => {
        fireEvent.pointerMove(screen.getByTestId('surface'), {
          pointerType: 'mouse',
        })
      })
      focused.push(
        document.activeElement === screen.getByTestId('input') ||
          seen.owner?.state.ownerId != null,
      )
      cleanup()
    }
    expect(focused).toEqual([true, false])
  })
})
