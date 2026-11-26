import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ItemDef } from '../internal/popup-menu/index.js'
import { SuggestionMenu } from './index.js'

// The attached host input is exempt from the menu's dismissal: pressing it, or
// focus moving to it, never closes the menu. Anything else outside does.

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

const item = (value: string): ItemDef => ({
  kind: 'item',
  value,
  render: ({ props }) => (
    <SuggestionMenu.Item {...props} data-testid={value}>
      {value}
    </SuggestionMenu.Item>
  ),
})

function setup() {
  const menu = SuggestionMenu.createHandle()
  const onOpenChange = vi.fn()
  render(
    <>
      <textarea data-testid="host" />
      <button type="button" data-testid="elsewhere">
        Elsewhere
      </button>
      <SuggestionMenu.Root handle={menu} onOpenChange={onOpenChange}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup data-testid="popup">
              <SuggestionMenu.Surface content={[item('Apple')]}>
                <SuggestionMenu.List>
                  <Rows />
                </SuggestionMenu.List>
                <input data-testid="popup-field" />
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </>,
  )
  const host = screen.getByTestId('host')
  const detach = menu.attach(host)
  return { menu, host, detach, onOpenChange }
}

async function open(menu: ReturnType<typeof SuggestionMenu.createHandle>) {
  act(() => menu.update({ query: '' }))
  await screen.findByTestId('Apple')
}

const closes = (onOpenChange: ReturnType<typeof vi.fn>) =>
  onOpenChange.mock.calls.filter(([open]) => open === false)

describe('SuggestionMenu outside press', () => {
  it('stays open when the host input is pressed', async () => {
    const user = userEvent.setup()
    const { menu, host, onOpenChange } = setup()
    await open(menu)

    await user.click(host)
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(closes(onOpenChange)).toEqual([])
  })

  it('still closes when something else outside is pressed', async () => {
    const user = userEvent.setup()
    const { menu, onOpenChange } = setup()
    await open(menu)

    await user.click(screen.getByTestId('elsewhere'))

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' }),
    )
  })

  it('closes on a press on the input once it is detached', async () => {
    const { menu, host, detach, onOpenChange } = setup()
    act(() => detach())
    await open(menu)

    fireEvent.pointerDown(host)

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' }),
    )
  })
})

describe('SuggestionMenu focus-out', () => {
  it('stays open when focus moves from the popup back to the host input', async () => {
    const user = userEvent.setup()
    const { menu, host, onOpenChange } = setup()
    await open(menu)
    await user.click(screen.getByTestId('popup-field'))
    expect(screen.getByTestId('popup-field')).toHaveFocus()

    await user.click(host)
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(host).toHaveFocus()
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(closes(onOpenChange)).toEqual([])
  })

  it('closes when focus leaves the host input for somewhere else', async () => {
    const { menu, host, onOpenChange } = setup()
    act(() => host.focus())
    await open(menu)

    act(() => screen.getByTestId('elsewhere').focus())

    await waitFor(() =>
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument(),
    )
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'focus-out' }),
    )
  })
})
