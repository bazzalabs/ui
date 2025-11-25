import { describe, expect, it } from 'vitest'
import {
  flatten,
  instantiateMenuFromDef,
  normalizeMenuDef,
  textToId,
} from '../primitives/menu-model.js'
import type { GroupDef, ItemDef, MenuDef, SubmenuDef } from '../types.js'

describe('menu-model', () => {
  describe('textToId', () => {
    it('converts text to lowercase', () => {
      expect(textToId('Hello World')).toBe('hello-world')
    })

    it('replaces spaces with hyphens', () => {
      expect(textToId('My Item Name')).toBe('my-item-name')
    })

    it('removes special characters', () => {
      expect(textToId('My Item #1!')).toBe('my-item-1')
    })

    it('trims leading and trailing hyphens', () => {
      expect(textToId('  Spaced  ')).toBe('spaced')
    })

    it('handles multiple consecutive spaces', () => {
      expect(textToId('Multiple   Spaces')).toBe('multiple-spaces')
    })
  })

  describe('normalizeMenuDef', () => {
    it('injects IDs into items based on label', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [
          { kind: 'item', label: 'File' },
          { kind: 'item', label: 'Edit' },
        ],
      }

      const normalized = normalizeMenuDef(menuDef)

      expect(normalized.nodes?.[0]).toHaveProperty('id', 'file')
      expect(normalized.nodes?.[1]).toHaveProperty('id', 'edit')
    })

    it('preserves explicit IDs', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [{ kind: 'item', id: 'custom-id', label: 'File' }],
      }

      const normalized = normalizeMenuDef(menuDef)

      expect(normalized.nodes?.[0]).toHaveProperty('id', 'custom-id')
    })

    it('recursively normalizes nested groups', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [
          {
            id: 'group-a',
            kind: 'group',
            nodes: [
              { kind: 'item', label: 'New File' },
              { kind: 'item', label: 'Open File' },
            ],
          },
        ],
      }

      const normalized = normalizeMenuDef(menuDef)
      const group = normalized.nodes?.[0] as GroupDef<unknown>

      expect(group.nodes?.[0]).toHaveProperty('id', 'new-file')
      expect(group.nodes?.[1]).toHaveProperty('id', 'open-file')
    })

    it('normalizes submenu IDs from label or title', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'File Menu',
            nodes: [{ kind: 'item', label: 'Save' }],
          },
        ],
      }

      const normalized = normalizeMenuDef(menuDef)
      const submenu = normalized.nodes?.[0] as SubmenuDef<unknown, unknown>

      expect(submenu).toHaveProperty('id', 'file-menu')
      expect(submenu.nodes?.[0]).toHaveProperty('id', 'save')
    })

    it('throws error for items without id or label', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [{ kind: 'item' } as ItemDef<unknown>],
      }

      expect(() => normalizeMenuDef(menuDef)).toThrow(
        'Item must have either an "id" or "label" property to generate an ID',
      )
    })
  })

  describe('instantiateMenuFromDef', () => {
    it('creates a basic menu with items', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        title: 'Test Menu',
        nodes: [
          { kind: 'item', id: 'file', label: 'File' },
          { kind: 'item', id: 'edit', label: 'Edit' },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      expect(menu.id).toBe('test-menu')
      expect(menu.title).toBe('Test Menu')
      expect(menu.surfaceId).toBe('root')
      expect(menu.depth).toBe(0)
      expect(menu.nodes).toHaveLength(2)
      expect(menu.nodes![0]?.kind).toBe('item')
      expect(menu.nodes![0]?.id).toBe('file')
    })

    it('generates IDs from labels when not provided', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [{ kind: 'item', label: 'New File' }],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      expect(menu.nodes![0]?.id).toBe('new-file')
    })

    it('creates groups with children', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [
          {
            id: 'group-a',
            kind: 'group',
            heading: 'File Operations',
            nodes: [
              { kind: 'item', label: 'New' },
              { kind: 'item', label: 'Open' },
            ],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      expect(menu.nodes).toHaveLength(1)
      expect(menu.nodes![0]?.kind).toBe('group')

      const group = menu.nodes![0] as any
      expect(group.heading).toBe('File Operations')
      expect(group.nodes).toHaveLength(2)
      expect(group.nodes[0].id).toBe('new')
    })

    it('creates nested submenus with correct depth and surfaceId', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'root-menu',
        nodes: [
          {
            kind: 'submenu',
            label: 'File',
            title: 'File Operations',
            nodes: [{ kind: 'item', label: 'Save' }],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)

      expect(menu.nodes).toHaveLength(1)
      expect(menu.nodes![0]?.kind).toBe('submenu')

      const submenu = menu.nodes![0] as any
      expect(submenu.id).toBe('file')
      expect(submenu.id).toBe('file')
      expect(submenu.title).toBe('File Operations')
      expect(submenu.depth).toBe(1)
      expect(submenu.surfaceId).toBe('root::file')
      expect(submenu.nodes).toHaveLength(1)
    })

    it('applies defaults to item nodes', () => {
      const onSelect = () => {}
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        defaults: {
          item: {
            onSelect,
            closeOnSelect: true,
          },
        },
        nodes: [{ kind: 'item', label: 'Test' }],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const item = menu.nodes![0] as any

      expect(item.onSelect).toBe(onSelect)
      expect(item.closeOnSelect).toBe(true)
    })
  })

  describe('flatten', () => {
    it('flattens a menu with shallow option (default)', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [
          { kind: 'item', label: 'Item 1' },
          {
            id: 'group-a',
            kind: 'group',
            nodes: [
              { kind: 'item', label: 'Group Item 1' },
              { kind: 'item', label: 'Group Item 2' },
            ],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const flattened = flatten(menu)

      // Should include: Item 1, Group, Group Item 1, Group Item 2
      expect(flattened).toHaveLength(4)
      expect(flattened[0]?.kind).toBe('item')
      expect(flattened[1]?.kind).toBe('group')
      expect(flattened[2]?.kind).toBe('item')
      expect(flattened[3]?.kind).toBe('item')
    })

    it('flattens a menu with deep option', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [
          { kind: 'item', label: 'Item 1' },
          {
            kind: 'submenu',
            label: 'Submenu',
            nodes: [
              { kind: 'item', label: 'Submenu Item 1' },
              { kind: 'item', label: 'Submenu Item 2' },
            ],
          },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const flattened = flatten(menu, { deep: true })

      // Should include: Item 1, Submenu, Submenu Item 1, Submenu Item 2
      expect(flattened).toHaveLength(4)
      expect(flattened[0]?.kind).toBe('item')
      expect(flattened[1]?.kind).toBe('submenu')
      expect(flattened[2]?.kind).toBe('item')
      expect(flattened[3]?.kind).toBe('item')
    })

    it('flattens MenuDef (not runtime Menu)', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [
          { kind: 'item', label: 'Item 1' },
          {
            id: 'group-a',
            kind: 'group',
            nodes: [{ kind: 'item', label: 'Group Item 1' }],
          },
        ],
      }

      const flattened = flatten(menuDef)

      expect(flattened).toHaveLength(3)
      expect(flattened[0]?.kind).toBe('item')
      expect(flattened[1]?.kind).toBe('group')
      expect(flattened[2]?.kind).toBe('item')
    })

    it('flattens an array of nodes', () => {
      const menuDef: MenuDef<unknown> = {
        id: 'test-menu',
        nodes: [
          { kind: 'item', label: 'Item 1' },
          { kind: 'item', label: 'Item 2' },
        ],
      }

      const menu = instantiateMenuFromDef(menuDef, 'root', 0)
      const flattened = flatten(menu.nodes!)

      expect(flattened).toHaveLength(2)
      expect(flattened[0]?.id).toBe('item-1')
      expect(flattened[1]?.id).toBe('item-2')
    })

    it('handles empty arrays', () => {
      const flattened = flatten([])
      expect(flattened).toHaveLength(0)
    })
  })
})
