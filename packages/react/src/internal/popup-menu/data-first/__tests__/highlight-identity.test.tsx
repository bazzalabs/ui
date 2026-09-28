import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import { createVanillaStaticLoader } from '../../../../loaders/vanilla.js'
import type { ItemDef, NodeDef } from '../types.js'

function item(value: string): ItemDef {
  return {
    kind: 'item',
    value,
    render: ({ props }) => (
      <DropdownMenu.Item {...props} data-testid={`item-${value.toLowerCase()}`}>
        {value}
      </DropdownMenu.Item>
    ),
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function Rows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function AsyncMenu(props: {
  content: NodeDef[]
  fetcher: () => Promise<NodeDef[]>
}) {
  const loader = React.useMemo(
    () => createVanillaStaticLoader({ fetcher: props.fetcher }),
    [props.fetcher],
  )
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={props.content} asyncContent={loader}>
              <DropdownMenu.Input data-testid="input" />
              <DropdownMenu.List>
                <Rows />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const highlighted = () =>
  document.querySelector('[data-highlighted]')?.getAttribute('data-testid')

describe('data-first highlight identity', () => {
  it('keeps the highlighted row when async results arrive for the same search', async () => {
    const user = userEvent.setup()
    const deferred = createDeferred<NodeDef[]>()
    const fetcher = () => deferred.promise
    render(
      <AsyncMenu content={[item('Apple'), item('Banana')]} fetcher={fetcher} />,
    )

    await screen.findByTestId('item-banana')
    await waitFor(() => expect(highlighted()).toBe('item-apple'))

    await user.click(screen.getByTestId('input'))
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('item-banana')

    await act(async () => {
      deferred.resolve([item('Cherry'), item('Apple'), item('Banana')])
      await deferred.promise
    })

    await screen.findByTestId('item-cherry')
    expect(highlighted()).toBe('item-banana')
  })

  it('moves the highlight to the first row when the search changes', async () => {
    const user = userEvent.setup()
    render(
      <AsyncMenu
        content={[item('Apple'), item('Apricot'), item('Banana')]}
        fetcher={() => new Promise(() => {})}
      />,
    )

    await screen.findByTestId('item-banana')
    await user.click(screen.getByTestId('input'))
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(highlighted()).toBe('item-banana')

    await user.type(screen.getByTestId('input'), 'ap')

    await waitFor(() => expect(highlighted()).toBe('item-apple'))
  })

  it('keeps the highlight when results land after a keystroke that did not change the rows', async () => {
    const user = userEvent.setup()
    const deferred = createDeferred<NodeDef[]>()
    const fetcher = () => deferred.promise
    render(
      <AsyncMenu
        content={[item('Alpha'), item('Beta'), item('Gamma')]}
        fetcher={fetcher}
      />,
    )

    await screen.findByTestId('item-gamma')
    await user.click(screen.getByTestId('input'))
    // Every row contains "a", so typing it leaves the rows unchanged.
    await user.type(screen.getByTestId('input'), 'a')
    await user.keyboard('{ArrowDown}')
    expect(highlighted()).toBe('item-beta')

    await act(async () => {
      deferred.resolve([
        item('Delta'),
        item('Alpha'),
        item('Beta'),
        item('Gamma'),
      ])
      await deferred.promise
    })

    await screen.findByTestId('item-delta')
    expect(highlighted()).toBe('item-beta')
  })

  it('moves the highlight to the first row when the search changes but the rows do not', async () => {
    const user = userEvent.setup()
    render(
      <AsyncMenu
        content={[item('Alpha'), item('Beta'), item('Gamma')]}
        fetcher={() => new Promise(() => {})}
      />,
    )

    await screen.findByTestId('item-gamma')
    await user.click(screen.getByTestId('input'))
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(highlighted()).toBe('item-gamma')

    await user.type(screen.getByTestId('input'), 'a')

    await waitFor(() => expect(highlighted()).toBe('item-alpha'))
  })
})
