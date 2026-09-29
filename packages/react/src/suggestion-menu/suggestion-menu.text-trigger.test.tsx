import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ItemDef } from '../internal/popup-menu/index.js'
import { SuggestionMenu } from './index.js'
import { matchTextTrigger } from './text-trigger/match.js'

const at = { char: '@' }

describe('matchTextTrigger', () => {
  it.each([
    ['@', 1, ''],
    ['hi @al', 6, 'al'],
    ['@al', 3, 'al'],
    ['line\n@al', 8, 'al'],
  ])('matches %j at %i with query %j', (text, caret, query) => {
    expect(matchTextTrigger(text, caret, [at])?.query).toBe(query)
  })

  it.each([
    ['email me@example', 16, 'no whitespace before the trigger'],
    ['@al ice', 7, 'a space in the query'],
    ['@al\nice', 7, 'a line break in the query'],
    ['hi', 2, 'no trigger'],
    ['@al', 0, 'the caret before the trigger'],
  ])('ignores %j at %i (%s)', (text, caret) => {
    expect(matchTextTrigger(text, caret, [at])).toBeNull()
  })

  it('allows spaces, but not line breaks, with allowSpaces', () => {
    const trigger = { char: '@', allowSpaces: true }
    expect(matchTextTrigger('@Alice Sm', 9, [trigger])?.query).toBe('Alice Sm')
    expect(matchTextTrigger('@Alice\nSm', 9, [trigger])).toBeNull()
  })

  it('only matches at the start of a line with startOfLine', () => {
    const slash = { char: '/', startOfLine: true }
    expect(matchTextTrigger('/he', 3, [slash])?.query).toBe('he')
    expect(matchTextTrigger('a\n/he', 5, [slash])?.query).toBe('he')
    expect(matchTextTrigger('a /he', 5, [slash])).toBeNull()
  })

  it('waits for minLength characters', () => {
    const trigger = { char: ':', minLength: 2 }
    expect(matchTextTrigger(':s', 2, [trigger])).toBeNull()
    expect(matchTextTrigger(':sm', 3, [trigger])?.query).toBe('sm')
  })

  it('picks the trigger closest to the caret, with its range', () => {
    // Both match: '/' allows spaces, so its query would be "cmd @al".
    const match = matchTextTrigger('/cmd @al', 8, [
      at,
      { char: '/', allowSpaces: true },
    ])
    expect(match).toMatchObject({ query: 'al', from: 5, to: 8 })
    expect(match?.trigger.char).toBe('@')
  })
})

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

type Handle = ReturnType<
  typeof SuggestionMenu.createHandle<SuggestionMenu.TextTriggerMatch>
>

function People(props: {
  menu: Handle
  field: 'textarea' | 'input'
  allowSpaces?: boolean
  refuseEscape?: boolean
  deferEscape?: boolean
  noResults?: 'empty' | 'close'
  closeRef?: React.MutableRefObject<(() => void) | null>
  onFieldKeyDown?: (event: React.KeyboardEvent) => void
}) {
  const { menu } = props
  const ref = SuggestionMenu.useTextTrigger(menu, {
    triggers: [{ char: '@', allowSpaces: props.allowSpaces }],
  })
  const [open, setOpen] = React.useState(false)
  if (props.closeRef) props.closeRef.current = () => setOpen(false)
  const person = (name: string): ItemDef => ({
    kind: 'item',
    value: name,
    onSelect: () => {
      const field = menu.host as HTMLTextAreaElement | null
      const match = menu.payload
      if (!field || !match) return
      field.setRangeText(`@${name} `, match.from, match.to, 'end')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    },
    render: ({ props: itemProps }) => (
      <SuggestionMenu.Item {...itemProps} data-testid={name}>
        {name}
      </SuggestionMenu.Item>
    ),
  })
  return (
    <>
      {props.field === 'textarea' ? (
        <textarea
          data-testid="field"
          ref={ref}
          onKeyDown={props.onFieldKeyDown}
        />
      ) : (
        <input data-testid="field" ref={ref} />
      )}
      <SuggestionMenu.Root
        handle={menu}
        noResults={props.noResults}
        {...(props.refuseEscape || props.deferEscape
          ? {
              open,
              onOpenChange: (
                next: boolean,
                details: SuggestionMenu.Root.ChangeEventDetails,
              ) => {
                if (details.reason !== 'escape-key') return setOpen(next)
                // Refusing cancels; deferring commits in a later task.
                if (props.refuseEscape) details.cancel()
                else setTimeout(() => setOpen(next), 10)
              },
            }
          : {})}
      >
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface
                content={[person('Alice'), person('Alan'), person('Bob')]}
              >
                <SuggestionMenu.List>
                  <Rows />
                  <SuggestionMenu.Empty data-testid="empty">
                    Nobody
                  </SuggestionMenu.Empty>
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </>
  )
}

function setup(
  field: 'textarea' | 'input' = 'textarea',
  options: Omit<React.ComponentProps<typeof People>, 'menu' | 'field'> = {},
) {
  const user = userEvent.setup()
  const menu = SuggestionMenu.createHandle<SuggestionMenu.TextTriggerMatch>()
  const view = render(<People menu={menu} field={field} {...options} />)
  const input = screen.getByTestId('field') as HTMLTextAreaElement
  const rows = () =>
    [...document.querySelectorAll('[role="option"]')].map((el) =>
      el.getAttribute('data-testid'),
    )
  const popup = () => screen.queryByTestId('popup')
  return { user, menu, view, input, rows, popup }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 20))

describe('attachTextTrigger', () => {
  it('opens on the trigger and filters by what follows it', async () => {
    const { user, input, rows, popup } = setup()
    await user.click(input)
    await user.type(input, 'hi ')
    expect(popup()).not.toBeInTheDocument()

    await user.type(input, '@al')

    await waitFor(() => expect(rows()).toEqual(['Alice', 'Alan']))
  })

  it('passes the match as the payload', async () => {
    const { user, menu, input } = setup()
    await user.click(input)
    await user.type(input, 'hi @b')

    await waitFor(() => expect(menu.query).toBe('b'))
    await waitFor(() =>
      expect(menu.payload).toMatchObject({
        query: 'b',
        from: 3,
        to: 5,
      }),
    )
  })

  it('chooses with Enter, without a line break in the textarea', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, '@bo')
    await screen.findByTestId('Bob')

    await user.keyboard('{Enter}')

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    expect(input.value).toBe('@Bob ')
  })

  it('closes when the caret leaves the trigger', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, '@al')
    await screen.findByTestId('Alice')

    await user.type(input, ' ')

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
  })

  it('stays closed after Escape until the trigger is typed again', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, '@al')
    await screen.findByTestId('Alice')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    await user.type(input, 'i')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(popup()).not.toBeInTheDocument()

    await user.type(input, ' @b')

    expect(await screen.findByTestId('Bob')).toBeInTheDocument()
  })

  it('opens again after Escape once the trigger is deleted and retyped', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, '@a')
    await screen.findByTestId('Alice')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(popup()).not.toBeInTheDocument())

    await user.keyboard('{Backspace}{Backspace}@a')

    expect(await screen.findByTestId('Alice')).toBeInTheDocument()
  })

  it('works in an <input>', async () => {
    const { user, input, rows } = setup('input')
    await user.click(input)
    await user.type(input, 'to @bo')

    await waitFor(() => expect(rows()).toEqual(['Bob']))
    expect(input).toHaveAttribute('role', 'combobox')
  })

  it('detaches when the field unmounts', async () => {
    const { user, menu, input, view } = setup()
    await user.click(input)
    await user.type(input, '@a')
    await screen.findByTestId('Alice')

    view.unmount()

    expect(menu.host).toBeNull()
  })

  it('ignores a selection that spans text', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, '@al')
    await screen.findByTestId('Alice')

    // From just after the trigger: collapsed, that would match "@".
    act(() => {
      input.setSelectionRange(1, 3)
      fireEvent.input(input)
    })

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
  })

  it('stays closed after choosing a row, even with spaces allowed', async () => {
    const { user, input, popup } = setup('textarea', { allowSpaces: true })
    await user.click(input)
    await user.type(input, '@ali')
    await screen.findByTestId('Alice')

    await user.keyboard('{Enter}')
    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    await user.type(input, 'said hi')
    await tick()

    expect(input.value).toBe('@Alice said hi')
    expect(popup()).not.toBeInTheDocument()

    await user.type(input, ' @b')
    expect(await screen.findByTestId('Bob')).toBeInTheDocument()
  })

  it('stays closed after Escape when the caret moves away and back', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, 'x @al')
    await screen.findByTestId('Alice')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(popup()).not.toBeInTheDocument())

    // Caret moves report through selectionchange.
    const select = (start: number, end = start) =>
      act(() => {
        input.setSelectionRange(start, end)
        document.dispatchEvent(new Event('selectionchange'))
      })
    select(1)
    select(5)
    select(4, 5)
    select(5)
    await tick()

    expect(popup()).not.toBeInTheDocument()
  })

  it('keeps following the query when the app refuses the Escape close', async () => {
    const { user, menu, input, popup } = setup('textarea', {
      refuseEscape: true,
    })
    await user.click(input)
    await user.type(input, '@a')
    await screen.findByTestId('Alice')

    await user.keyboard('{Escape}')
    await user.type(input, 'li')

    await waitFor(() => expect(menu.query).toBe('ali'))
    expect(popup()).toBeInTheDocument()
  })

  it('replaces the whole word when the caret was moved back into it', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, '@alice')
    await screen.findByTestId('Alice')
    act(() => {
      input.setSelectionRange(3, 3)
      document.dispatchEvent(new Event('selectionchange'))
    })

    await user.keyboard('{Enter}')

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    expect(input.value).toBe('@Alice ')
  })

  it("doesn't pass a key the menu used on to the app", async () => {
    const keys: string[] = []
    const { user, input } = setup('textarea', {
      onFieldKeyDown: (event) => keys.push(event.key),
    })
    await user.click(input)
    await user.type(input, '@b')
    await screen.findByTestId('Bob')

    await user.keyboard('{Enter}')

    expect(keys).not.toContain('Enter')
    expect(keys).toContain('@')
  })

  it('measures again when the field scrolls', async () => {
    const { user, menu, input } = setup()
    await user.click(input)
    await user.type(input, '@a')
    await screen.findByTestId('Alice')
    const before = menu.getState()

    fireEvent.scroll(input)

    expect(menu.getState()).not.toBe(before)
  })

  it('closes when the caret moves out of the trigger without typing', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, 'x @al')
    await screen.findByTestId('Alice')

    act(() => {
      input.setSelectionRange(1, 1)
      document.dispatchEvent(new Event('selectionchange'))
    })

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
  })

  it('follows the focused field when two share a handle', async () => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle<SuggestionMenu.TextTriggerMatch>()
    function Two() {
      const first = SuggestionMenu.useTextTrigger(menu, { triggers: [at] })
      const second = SuggestionMenu.useTextTrigger(menu, { triggers: [at] })
      return (
        <>
          <textarea data-testid="first" ref={first} />
          <textarea data-testid="second" ref={second} />
          <SuggestionMenu.Root handle={menu}>
            <SuggestionMenu.Portal>
              <SuggestionMenu.Positioner>
                <SuggestionMenu.Popup data-testid="popup">
                  <SuggestionMenu.Surface
                    content={[
                      {
                        kind: 'item',
                        value: 'Alice',
                        render: ({ props }) => (
                          <SuggestionMenu.Item {...props}>
                            Alice
                          </SuggestionMenu.Item>
                        ),
                      },
                    ]}
                  >
                    <SuggestionMenu.List>
                      <Rows />
                    </SuggestionMenu.List>
                  </SuggestionMenu.Surface>
                </SuggestionMenu.Popup>
              </SuggestionMenu.Positioner>
            </SuggestionMenu.Portal>
          </SuggestionMenu.Root>
        </>
      )
    }
    render(<Two />)
    const first = screen.getByTestId('first')

    await user.click(first)
    await user.type(first, '@a')
    await screen.findByTestId('popup')

    expect(menu.host).toBe(first)
    await waitFor(() => expect(first).toHaveAttribute('aria-controls'))
    expect(screen.getByTestId('second')).not.toHaveAttribute('aria-controls')
  })

  const moveCaret = (input: HTMLTextAreaElement, position: number) =>
    act(() => {
      input.setSelectionRange(position, position)
      document.dispatchEvent(new Event('selectionchange'))
    })

  it("doesn't replace text that was there before the trigger was typed", async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, 'hello world')
    moveCaret(input, 6)
    await user.type(input, '@al', {
      initialSelectionStart: 6,
      initialSelectionEnd: 6,
    })
    await screen.findByTestId('Alice')

    await user.keyboard('{Enter}')

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    expect(input.value).toBe('hello @Alice world')
  })

  it('replaces a multi-word query after the caret moved back into it', async () => {
    const { user, input, popup } = setup('textarea', { allowSpaces: true })
    await user.click(input)
    await user.type(input, '@Ali Sm')
    moveCaret(input, 4)
    await screen.findByTestId('Alice')

    await user.keyboard('{Enter}')

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    expect(input.value).toBe('@Alice ')
  })

  it('keeps every chosen mention closed, wherever the caret goes', async () => {
    const { user, input, popup } = setup('textarea', { allowSpaces: true })
    await user.click(input)
    await user.type(input, '@ali')
    await screen.findByTestId('Alice')
    await user.keyboard('{Enter}')
    await user.type(input, 'and @b')
    await screen.findByTestId('Bob')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(popup()).not.toBeInTheDocument())

    // Inside "@Alice an|d …", and after text added before the first mention.
    moveCaret(input, 9)
    await tick()
    expect(popup()).not.toBeInTheDocument()
    act(() => {
      input.setRangeText('Hey ', 0, 0, 'end')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    moveCaret(input, input.value.length)
    await tick()

    expect(popup()).not.toBeInTheDocument()
  })

  it('keeps a chosen trigger closed without allowSpaces, too', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, '@ali')
    await screen.findByTestId('Alice')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(popup()).not.toBeInTheDocument())

    moveCaret(input, 4)
    await tick()

    expect(popup()).not.toBeInTheDocument()
  })

  it('opens for a trigger typed over the one that ended', async () => {
    const { user, input } = setup()
    await user.click(input)
    await user.type(input, '@al')
    await screen.findByTestId('Alice')
    await user.keyboard('{Escape}')

    await user.type(input, '@b', {
      initialSelectionStart: 0,
      initialSelectionEnd: 3,
    })

    expect(await screen.findByTestId('Bob')).toBeInTheDocument()
  })

  it('opens again after the app clears the field without an input event', async () => {
    const { user, input } = setup()
    await user.click(input)
    await user.type(input, '@al')
    await screen.findByTestId('Alice')
    await user.keyboard('{Escape}')

    act(() => {
      input.value = ''
    })
    await user.type(input, '@b')

    expect(await screen.findByTestId('Bob')).toBeInTheDocument()
  })

  it('still closes when a trigger the menu closed by itself ends', async () => {
    const { user, menu, input, popup } = setup('textarea', {
      noResults: 'close',
    })
    await user.click(input)
    await user.type(input, '@zz')
    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    const close = vi.spyOn(menu, 'close')

    moveCaret(input, 0)

    // Resets what the Root remembers about the empty query.
    expect(close).toHaveBeenCalled()
  })

  it('reopens after the app closes a menu whose Escape it refused', async () => {
    const closeRef: React.MutableRefObject<(() => void) | null> = {
      current: null,
    }
    const { user, input, popup } = setup('textarea', {
      refuseEscape: true,
      closeRef,
    })
    await user.click(input)
    await user.type(input, '@a')
    await screen.findByTestId('Alice')
    await user.keyboard('{Escape}')
    await tick()

    act(() => closeRef.current?.())
    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    await user.type(input, 'l')

    expect(await screen.findByTestId('Alice')).toBeInTheDocument()
  })

  it("doesn't take the handle from a focused field when another mounts", async () => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle<SuggestionMenu.TextTriggerMatch>()
    function Field(props: { id: string }) {
      const ref = SuggestionMenu.useTextTrigger(menu, { triggers: [at] })
      return <textarea data-testid={props.id} ref={ref} />
    }
    function Two(props: { second: boolean }) {
      return (
        <>
          <Field id="first" />
          {props.second && <Field id="second" />}
          <SuggestionMenu.Root handle={menu}>
            <SuggestionMenu.Portal>
              <SuggestionMenu.Positioner>
                <SuggestionMenu.Popup data-testid="popup">
                  <SuggestionMenu.Surface content={[]}>
                    <SuggestionMenu.List>
                      <Rows />
                    </SuggestionMenu.List>
                  </SuggestionMenu.Surface>
                </SuggestionMenu.Popup>
              </SuggestionMenu.Positioner>
            </SuggestionMenu.Portal>
          </SuggestionMenu.Root>
        </>
      )
    }
    const view = render(<Two second={false} />)
    const first = screen.getByTestId('first')
    await user.click(first)

    view.rerender(<Two second />)
    await user.type(first, '@a')

    expect(menu.host).toBe(first)
    expect(await screen.findByTestId('popup')).toBeInTheDocument()
  })

  it("doesn't close another field's menu when it unmounts", async () => {
    const user = userEvent.setup()
    const menu = SuggestionMenu.createHandle<SuggestionMenu.TextTriggerMatch>()
    function Field(props: { id: string }) {
      const ref = SuggestionMenu.useTextTrigger(menu, { triggers: [at] })
      return <textarea data-testid={props.id} ref={ref} />
    }
    function Two(props: { first: boolean }) {
      return (
        <>
          {props.first && <Field id="first" />}
          <Field id="second" />
          <SuggestionMenu.Root handle={menu}>
            <SuggestionMenu.Portal>
              <SuggestionMenu.Positioner>
                <SuggestionMenu.Popup data-testid="popup">
                  <SuggestionMenu.Surface content={[]}>
                    <SuggestionMenu.List>
                      <Rows />
                    </SuggestionMenu.List>
                  </SuggestionMenu.Surface>
                </SuggestionMenu.Popup>
              </SuggestionMenu.Positioner>
            </SuggestionMenu.Portal>
          </SuggestionMenu.Root>
        </>
      )
    }
    const view = render(<Two first />)
    await user.click(screen.getByTestId('first'))
    await user.type(screen.getByTestId('first'), '@a')
    await screen.findByTestId('popup')
    await user.click(screen.getByTestId('second'))
    await user.type(screen.getByTestId('second'), '@b')
    await screen.findByTestId('popup')

    view.rerender(<Two first={false} />)
    await tick()

    expect(screen.getByTestId('popup')).toBeInTheDocument()
  })

  it('closes when the trigger is deleted while the menu is open', async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, '@al')
    await screen.findByTestId('Alice')

    await user.keyboard('{Backspace}{Backspace}{Backspace}')

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
  })

  it("doesn't replace text the caret only moved over", async () => {
    const { user, input, popup } = setup()
    await user.click(input)
    await user.type(input, 'hello world')
    moveCaret(input, 6)
    await user.type(input, '@al', {
      initialSelectionStart: 6,
      initialSelectionEnd: 6,
    })
    await screen.findByTestId('Alice')
    moveCaret(input, 11)
    moveCaret(input, 9)

    await user.keyboard('{Enter}')

    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    expect(input.value).toBe('hello @Alice world')
  })

  it("maps an undo by the text, not by the selection it didn't replace", async () => {
    const { user, input, popup } = setup('textarea', { allowSpaces: true })
    await user.click(input)
    await user.type(input, 'Hey @ali')
    await screen.findByTestId('Alice')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    await user.type(input, 'hi')

    // Undo removes "Hey " while "hi" happens to be selected.
    act(() => {
      input.setSelectionRange(input.value.length - 2, input.value.length)
      input.dispatchEvent(
        new InputEvent('beforeinput', { inputType: 'historyUndo' }),
      )
      input.value = input.value.slice(4)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    moveCaret(input, 4)
    await tick()

    expect(popup()).not.toBeInTheDocument()
  })

  it('ends the trigger when the app accepts Escape in a later task', async () => {
    const { user, input, popup } = setup('textarea', { deferEscape: true })
    await user.click(input)
    await user.type(input, '@a')
    await screen.findByTestId('Alice')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(popup()).not.toBeInTheDocument())
    await user.type(input, 'l')
    await tick()

    expect(popup()).not.toBeInTheDocument()
  })
})
