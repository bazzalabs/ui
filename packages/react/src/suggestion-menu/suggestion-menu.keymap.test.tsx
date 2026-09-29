import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ItemDef } from '../internal/popup-menu/index.js'
import { SuggestionMenu } from './index.js'

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function setup(
  options: {
    onSelect?: (value: string) => void
    footer?: React.ReactNode
  } = {},
) {
  const menu = SuggestionMenu.createHandle()
  const onOpenChange = vi.fn()
  const handled: Array<[string, boolean]> = []
  const item = (value: string): ItemDef => ({
    kind: 'item',
    value,
    onSelect: () => options.onSelect?.(value),
    render: ({ props }) => (
      <SuggestionMenu.Item {...props} data-testid={value}>
        {value}
      </SuggestionMenu.Item>
    ),
  })
  const onDialogKeyDown = vi.fn()
  render(
    // biome-ignore lint/a11y/noStaticElementInteractions: stands in for an enclosing dialog's Escape listener
    <div onKeyDown={onDialogKeyDown}>
      <textarea
        data-testid="host"
        ref={(el) => {
          if (el) menu.attach(el)
        }}
        onKeyDown={(event) =>
          handled.push([event.key, menu.handleKeyDown(event)])
        }
      />
      <button type="button" data-testid="next">
        Next
      </button>
      <SuggestionMenu.Root handle={menu} onOpenChange={onOpenChange}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup" tabIndex={-1}>
              <SuggestionMenu.Surface
                content={[item('Alice'), item('Bob'), item('Carol')]}
              >
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
                {options.footer}
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </div>,
  )
  const host = screen.getByTestId('host')
  const press = (key: string, init: Partial<KeyboardEventInit> = {}) => {
    act(() => {
      fireEvent.keyDown(host, { key, ...init })
    })
    return handled.at(-1)?.[1]
  }
  return { menu, host, press, onOpenChange, onDialogKeyDown }
}

async function open(menu: ReturnType<typeof SuggestionMenu.createHandle>) {
  act(() => menu.update({ query: '' }))
  await screen.findByTestId('Carol')
  await waitFor(() =>
    expect(document.querySelector('[data-highlighted]')).not.toBeNull(),
  )
}

const highlighted = () =>
  document.querySelector('[data-highlighted]')?.getAttribute('data-testid')

describe('SuggestionMenu keymap', () => {
  it('moves the highlight with arrows, Ctrl+N/P and Home/End', async () => {
    const { menu, press } = setup()
    await open(menu)
    expect(highlighted()).toBe('Alice')

    expect(press('ArrowDown')).toBe(true)
    expect(highlighted()).toBe('Bob')
    expect(press('n', { ctrlKey: true })).toBe(true)
    expect(highlighted()).toBe('Carol')
    expect(press('p', { ctrlKey: true })).toBe(true)
    expect(highlighted()).toBe('Bob')
    expect(press('End')).toBe(true)
    expect(highlighted()).toBe('Carol')
    expect(press('ArrowDown')).toBe(true)
    expect(highlighted()).toBe('Alice')
    expect(press('Home')).toBe(true)
    expect(highlighted()).toBe('Alice')
    expect(press('ArrowUp')).toBe(true)
    expect(highlighted()).toBe('Carol')
  })

  it('chooses the highlighted row with Enter and closes', async () => {
    const selected: string[] = []
    const { menu, press, onOpenChange } = setup({
      onSelect: (value) => selected.push(value),
    })
    await open(menu)
    press('ArrowDown')

    expect(press('Enter')).toBe(true)

    expect(selected).toEqual(['Bob'])
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'item-press' }),
    )
  })

  it('closes on Escape without letting it reach an enclosing dialog', async () => {
    const { menu, press, onOpenChange, onDialogKeyDown } = setup()
    await open(menu)

    expect(press('Escape')).toBe(true)

    expect(onDialogKeyDown).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape-key' }),
    )
  })

  it('leaves Tab, caret keys, printable keys and modified keys to the host', async () => {
    const { menu, press } = setup()
    await open(menu)

    for (const [key, init] of [
      ['Tab', {}],
      ['Tab', { shiftKey: true }],
      ['ArrowLeft', {}],
      ['ArrowRight', {}],
      ['PageDown', {}],
      ['a', {}],
      [' ', {}],
      ['Backspace', {}],
      ['Enter', { shiftKey: true }],
      ['Enter', { metaKey: true }],
      ['ArrowDown', { shiftKey: true }],
      ['Home', { shiftKey: true }],
      ['k', { ctrlKey: true }],
      ['Home', { ctrlKey: true }],
      ['ArrowDown', { ctrlKey: true }],
      ['Enter', { ctrlKey: true }],
    ] as const) {
      expect(press(key, init)).toBe(false)
    }
    expect(highlighted()).toBe('Alice')
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('handles nothing while closed or composing', async () => {
    const { menu, host, press } = setup()
    expect(press('ArrowDown')).toBe(false)
    expect(press('Enter')).toBe(false)
    expect(press('Escape')).toBe(false)

    await open(menu)
    // Browsers fire compositionstart before the composing key presses.
    act(() => {
      fireEvent.compositionStart(host)
    })
    expect(press('ArrowDown', { isComposing: true })).toBe(false)
    expect(press('Enter', { isComposing: true })).toBe(false)
    expect(press('Escape', { keyCode: 229 })).toBe(false)
    act(() => {
      fireEvent.compositionEnd(host)
    })

    expect(highlighted()).toBe('Alice')
    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })
})

describe('SuggestionMenu dismissal', () => {
  it('closes when the host input loses focus', async () => {
    const { menu, host, onOpenChange } = setup()
    act(() => host.focus())
    await open(menu)

    act(() => screen.getByTestId('next').focus())

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'focus-out' }),
    )
  })

  it('stays open when focus moves into the popup', async () => {
    const { menu, host } = setup()
    act(() => host.focus())
    await open(menu)

    act(() => screen.getByTestId('popup').focus())
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('keeps focus in the host when a row is pressed', async () => {
    const { menu, host } = setup()
    act(() => host.focus())
    await open(menu)

    // fireEvent returns false when the default action was prevented.
    expect(fireEvent.mouseDown(screen.getByTestId('Bob'))).toBe(false)
    expect(fireEvent.mouseDown(screen.getByTestId('popup'))).toBe(false)
    expect(fireEvent.mouseDown(screen.getByTestId('next'))).toBe(true)
  })

  it('lets a field inside the popup take focus when pressed', async () => {
    const { menu } = setup({ footer: <input data-testid="popup-field" /> })
    await open(menu)

    expect(fireEvent.mouseDown(screen.getByTestId('popup-field'))).toBe(true)
  })

  it('stays open when the whole window loses focus', async () => {
    const { menu, host } = setup()
    act(() => host.focus())
    await open(menu)
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(false)

    act(() => host.blur())
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(screen.getByTestId('popup')).toBeInTheDocument()
    hasFocus.mockRestore()
  })
})

describe('SuggestionMenu in editor wiring', () => {
  function EditorMenu(props: {
    menu: ReturnType<typeof SuggestionMenu.createHandle>
    onOpenChange: (open: boolean, details: { reason: string }) => void
    container?: HTMLElement
  }) {
    const choose = (value: string): ItemDef => ({
      kind: 'item',
      value,
      // Choosing edits the text; the trigger code then closes the menu.
      onSelect: () => props.menu.close(),
      render: ({ props: itemProps }) => (
        <SuggestionMenu.Item {...itemProps} data-testid={value}>
          {value}
        </SuggestionMenu.Item>
      ),
    })
    return (
      <SuggestionMenu.Root
        handle={props.menu}
        onOpenChange={props.onOpenChange}
      >
        <SuggestionMenu.Portal container={props.container}>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface
                content={[choose('Alice'), choose('Bob')]}
              >
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    )
  }

  // jsdom treats a bare blur() as the window losing focus.
  function elsewhere() {
    const button = document.createElement('button')
    document.body.append(button)
    return button
  }

  function nativeHost(menu: ReturnType<typeof SuggestionMenu.createHandle>) {
    const host = document.createElement('div')
    host.contentEditable = 'true'
    host.tabIndex = 0
    document.body.append(host)
    // Editors forward keys from their own native listeners.
    host.addEventListener('keydown', (event) => {
      if (menu.handleKeyDown(event)) event.preventDefault()
    })
    menu.attach(host)
    return host
  }

  it.each([
    'Enter',
    'click',
  ])('reports item-press once when a row chosen by %s closes the menu itself', async (how) => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle()
    const host = nativeHost(menu)
    const onOpenChange = vi.fn()
    render(<EditorMenu menu={menu} onOpenChange={onOpenChange} />)
    act(() => host.focus())
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('Bob')

    if (how === 'Enter') {
      act(() => {
        fireEvent.keyDown(host, { key: 'Enter' })
      })
    } else {
      await user.click(screen.getByTestId('Bob'))
    }

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    const closes = onOpenChange.mock.calls.filter(([open]) => !open)
    expect(closes.map(([, details]) => details.reason)).toEqual(['item-press'])
    host.remove()
  })

  it("applies the row's close when the row keeps the menu open", async () => {
    const menu = SuggestionMenu.createHandle()
    const host = nativeHost(menu)
    const onOpenChange = vi.fn()
    const keepOpen: ItemDef = {
      kind: 'item',
      value: 'Alice',
      closeOnClick: false,
      onSelect: () => menu.close(),
      render: ({ props }) => (
        <SuggestionMenu.Item {...props} data-testid="Alice">
          Alice
        </SuggestionMenu.Item>
      ),
    }
    render(
      <SuggestionMenu.Root handle={menu} onOpenChange={onOpenChange}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface content={[keepOpen]}>
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>,
    )
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('Alice')

    act(() => {
      fireEvent.keyDown(host, { key: 'Enter' })
    })

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'imperative-action' }),
    )
    host.remove()
  })

  it("doesn't hold closes after a click that stopped propagating", async () => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle()
    const host = nativeHost(menu)
    const onOpenChange = vi.fn()
    render(<EditorMenu menu={menu} onOpenChange={onOpenChange} />)
    act(() => menu.update({ query: '' }))
    const row = await screen.findByTestId('Bob')
    row.addEventListener('click', (event) => event.stopPropagation())

    await user.click(row)
    await new Promise((resolve) => setTimeout(resolve, 20))
    act(() => menu.close())

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'imperative-action' }),
    )
    host.remove()
  })

  it("keeps the selection open through a click the row's handler fires", async () => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle()
    const host = nativeHost(menu)
    const onOpenChange = vi.fn()
    const upload: ItemDef = {
      kind: 'item',
      value: 'Upload',
      onSelect: () => {
        menu.close()
        // e.g. a hidden file input or menu control inside the popup.
        screen.getByTestId('inner').click()
      },
      render: ({ props }) => (
        <SuggestionMenu.Item {...props} data-testid="Upload">
          Upload
        </SuggestionMenu.Item>
      ),
    }
    render(
      <SuggestionMenu.Root handle={menu} onOpenChange={onOpenChange}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface content={[upload]}>
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
                <button type="button" data-testid="inner" hidden />
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>,
    )
    act(() => menu.update({ query: '' }))

    await user.click(await screen.findByTestId('Upload'))

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    const closes = onOpenChange.mock.calls.filter(([open]) => !open)
    expect(closes.map(([, details]) => details.reason)).toEqual(['item-press'])
    host.remove()
  })

  it('handles a host attached before it was in the page', async () => {
    const menu = SuggestionMenu.createHandle()
    render(<EditorMenu menu={menu} onOpenChange={() => {}} />)
    // An editor extension attaches its element before the editor is mounted.
    const host = document.createElement('textarea')
    act(() => {
      menu.attach(host)
    })
    document.body.append(host)
    act(() => host.focus())
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')

    act(() => {
      elsewhere().focus()
      host.focus()
    })
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(screen.getByTestId('popup')).toBeInTheDocument()
    host.remove()
  })

  it('stops the replaced Root watching the host', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const menu = SuggestionMenu.createHandle()
    const host = nativeHost(menu)
    const removed = vi.spyOn(host, 'removeEventListener')
    render(<EditorMenu menu={menu} onOpenChange={() => {}} />)
    expect(removed).not.toHaveBeenCalledWith('focusout', expect.anything())

    render(<EditorMenu menu={menu} onOpenChange={() => {}} />)

    expect(removed).toHaveBeenCalledWith('focusout', expect.any(Function))
    warn.mockRestore()
    host.remove()
  })

  it("stops Escape before a dialog's document listener sees it", async () => {
    const menu = SuggestionMenu.createHandle()
    const host = nativeHost(menu)
    const onDocumentKeyDown = vi.fn()
    document.addEventListener('keydown', onDocumentKeyDown)
    render(<EditorMenu menu={menu} onOpenChange={() => {}} />)
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')

    act(() => {
      fireEvent.keyDown(host, { key: 'Escape' })
    })

    expect(onDocumentKeyDown).not.toHaveBeenCalled()
    document.removeEventListener('keydown', onDocumentKeyDown)
    host.remove()
  })

  it('closes when focus leaves the editor host (control)', async () => {
    const menu = SuggestionMenu.createHandle()
    const host = nativeHost(menu)
    const onOpenChange = vi.fn()
    render(<EditorMenu menu={menu} onOpenChange={onOpenChange} />)
    act(() => host.focus())
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')

    act(() => elsewhere().focus())

    await waitFor(() =>
      expect(onOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: 'focus-out' }),
      ),
    )
    host.remove()
  })

  it('does not close after unmounting when focus left just before', async () => {
    const menu = SuggestionMenu.createHandle()
    const host = nativeHost(menu)
    const onOpenChange = vi.fn()
    const view = render(<EditorMenu menu={menu} onOpenChange={onOpenChange} />)
    act(() => host.focus())
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')
    const calls = onOpenChange.mock.calls.length

    act(() => elsewhere().focus())
    view.unmount()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(onOpenChange.mock.calls).toHaveLength(calls)
    host.remove()
  })

  it('stays open when a host in a shadow root gets focus back at once', async () => {
    const menu = SuggestionMenu.createHandle()
    const shadowHost = document.createElement('div')
    document.body.append(shadowHost)
    const shadow = shadowHost.attachShadow({ mode: 'open' })
    const host = document.createElement('textarea')
    shadow.append(host)
    menu.attach(host)
    render(<EditorMenu menu={menu} onOpenChange={() => {}} />)
    act(() => host.focus())
    act(() => menu.update({ query: '' }))
    await screen.findByTestId('popup')

    act(() => {
      host.blur()
      host.focus()
    })
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(screen.getByTestId('popup')).toBeInTheDocument()
    shadowHost.remove()
  })

  it('keeps focus in the host for a press on a row inside a shadow root', async () => {
    const menu = SuggestionMenu.createHandle()
    const shadowHost = document.createElement('div')
    document.body.append(shadowHost)
    const shadow = shadowHost.attachShadow({ mode: 'open' })
    const host = document.createElement('textarea')
    const portal = document.createElement('div')
    shadow.append(host, portal)
    menu.attach(host)
    render(
      <EditorMenu menu={menu} onOpenChange={() => {}} container={portal} />,
    )
    act(() => menu.update({ query: '' }))
    await waitFor(() =>
      expect(portal.querySelector('[data-testid="Bob"]')).not.toBeNull(),
    )

    const row = portal.querySelector('[data-testid="Bob"]') as HTMLElement
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      composed: true,
    })
    row.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    shadowHost.remove()
  })
})
