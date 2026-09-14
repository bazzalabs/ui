import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../dropdown-menu/index.js'
import { isLinkItemDef } from './data-first/type-guards.js'
import type { ItemDef, LinkItemDef, NodeDef } from './data-first/types.js'

function Menu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger data-testid="trigger">Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
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

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('trigger'))
  screen.getByTestId('list').focus()
}

describe('PopupMenu.LinkItem', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('renders an anchor option', async () => {
    render(
      <Menu>
        <DropdownMenu.LinkItem value="projects" href="#projects">
          Projects
        </DropdownMenu.LinkItem>
      </Menu>,
    )
    await openMenu(userEvent.setup())
    const link = screen.getByRole('option')
    expect(link).toHaveAttribute('href', '#projects')
    expect(link).toHaveAttribute('tabindex', '-1')
  })

  it('selects on click and keeps the menu open by default', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.LinkItem
          value="projects"
          href="#projects"
          onSelect={onSelect}
        >
          Projects
        </DropdownMenu.LinkItem>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByRole('option'))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(window.location.hash).toBe('#projects')
    expect(screen.getByTestId('surface')).toBeInTheDocument()
  })

  it('closes when closeOnClick is true', async () => {
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.LinkItem value="projects" href="#projects" closeOnClick>
          Projects
        </DropdownMenu.LinkItem>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByRole('option'))
    await waitFor(() =>
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument(),
    )
  })

  it('keeps the menu open for modifier clicks', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.LinkItem
          value="projects"
          href="#projects"
          closeOnClick
          onSelect={onSelect}
        >
          Projects
        </DropdownMenu.LinkItem>
      </Menu>,
    )
    await openMenu(user)
    await user.keyboard('{Meta>}')
    await user.click(screen.getByRole('option'))
    await user.keyboard('{/Meta}')
    expect(onSelect).toHaveBeenCalledOnce()
    expect(screen.getByTestId('surface')).toBeInTheDocument()
  })

  it('does not activate when disabled', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.LinkItem
          value="projects"
          href="#projects"
          disabled
          onSelect={onSelect}
        >
          Projects
        </DropdownMenu.LinkItem>
      </Menu>,
    )
    await openMenu(user)
    await user.click(screen.getByRole('option'))
    expect(window.location.hash).toBe('')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('activates from Enter and shortcut', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <Menu>
        <DropdownMenu.LinkItem
          value="projects"
          href="#projects"
          shortcut="g"
          closeOnClick
          onSelect={onSelect}
        >
          Projects
        </DropdownMenu.LinkItem>
      </Menu>,
    )
    await openMenu(user)
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledOnce()
    expect(window.location.hash).toBe('#projects')

    cleanup()
    window.location.hash = ''
    render(
      <Menu>
        <DropdownMenu.LinkItem
          value="projects"
          href="#projects"
          shortcut="g"
          onSelect={onSelect}
        >
          Projects
        </DropdownMenu.LinkItem>
      </Menu>,
    )
    await openMenu(user)
    await user.keyboard('g')
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(window.location.hash).toBe('#projects')
  })

  it('renders and selects a LinkItemDef', async () => {
    const onSelect = vi.fn()
    const def: LinkItemDef = {
      kind: 'link-item',
      value: 'Projects',
      href: '#projects',
      onSelect,
      render: ({ props }) => (
        <DropdownMenu.LinkItem {...props}>Projects</DropdownMenu.LinkItem>
      ),
    }
    const item: ItemDef = {
      kind: 'item',
      value: 'Other',
      render: ({ props }) => (
        <DropdownMenu.Item {...props}>Other</DropdownMenu.Item>
      ),
    }
    expect(isLinkItemDef(def)).toBe(true)
    expect(isLinkItemDef(item)).toBe(false)
    function DataMenu({ nodes }: { nodes: NodeDef[] }) {
      const { nodes: resolved, renderNode } = DropdownMenu.useDataList()
      return <>{resolved.map(renderNode)}</>
    }
    render(
      <DropdownMenu.Root defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface content={[def]}>
                <DropdownMenu.List>
                  <DataMenu nodes={[def]} />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>,
    )
    const link = await screen.findByRole('option')
    expect(link).toHaveAttribute('href', '#projects')
    await userEvent.setup().click(link)
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
