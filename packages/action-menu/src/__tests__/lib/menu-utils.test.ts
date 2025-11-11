import { describe, expect, it } from 'vitest'
import {
  flatten,
  instantiateMenuFromDef,
  instantiateSingleNode,
} from '../../lib/menu-utils.js'
import type {
  GroupDef,
  ItemDef,
  Menu,
  MenuDef,
  NodeDef,
  SubmenuDef,
} from '../../types.js'

describe('menu-utils', () => {
  describe('instantiateSingleNode', () => {
    it('should instantiate a button item', () => {
      const def: ItemDef = {
        id: 'test-item',
        label: 'Test Item',
        kind: 'item',
        variant: 'button',
      }

      const parent: Menu<any> = {
        id: 'menu',
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any

      const node = instantiateSingleNode(def, parent)

      expect(node.kind).toBe('item')
      expect(node.id).toBe('test-item')
      expect(node.parent).toBe(parent)
      if (node.kind === 'item') {
        expect(node.variant).toBe('button')
      }
    })

    it('should default item variant to button', () => {
      const def: ItemDef = {
        id: 'test',
        label: 'Test',
        kind: 'item',
      }

      const parent: Menu<any> = {
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any
      const node = instantiateSingleNode(def, parent)

      if (node.kind === 'item') {
        expect(node.variant).toBe('button')
      }
    })

    it('should instantiate a checkbox item', () => {
      const def: ItemDef = {
        id: 'checkbox',
        label: 'Checkbox',
        kind: 'item',
        variant: 'checkbox',
        checked: false,
        onCheckedChange: () => {},
      }

      const parent: Menu<any> = {
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any
      const node = instantiateSingleNode(def, parent)

      if (node.kind === 'item') {
        expect(node.variant).toBe('checkbox')
      }
    })

    it('should instantiate a radio item with value', () => {
      const def: ItemDef = {
        id: 'radio1',
        label: 'Radio 1',
        kind: 'item',
        variant: 'radio',
        value: 'option1',
      }

      const parent: Menu<any> = {
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any
      const node = instantiateSingleNode(def, parent)

      if (node.kind === 'item' && node.variant === 'radio') {
        expect(node.value).toBe('option1')
      }
    })

    it('should use id as radio value if not provided', () => {
      const def: ItemDef = {
        id: 'radio2',
        label: 'Radio 2',
        kind: 'item',
        variant: 'radio',
      }

      const parent: Menu<any> = {
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any
      const node = instantiateSingleNode(def, parent)

      if (node.kind === 'item' && node.variant === 'radio') {
        expect(node.value).toBe('radio2')
      }
    })

    it('should instantiate a group with children', () => {
      const def: GroupDef = {
        id: 'group1',
        kind: 'group',
        heading: 'Group Heading',
        nodes: [
          { id: 'item1', label: 'Item 1', kind: 'item' },
          { id: 'item2', label: 'Item 2', kind: 'item' },
        ],
      }

      const parent: Menu<any> = {
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any
      const node = instantiateSingleNode(def, parent)

      expect(node.kind).toBe('group')
      if (node.kind === 'group') {
        expect(node.heading).toBe('Group Heading')
        expect(node.nodes).toHaveLength(2)
        expect(node.nodes[0]?.id).toBe('item1')
        expect(node.nodes[1]?.id).toBe('item2')

        // Check that children have group reference
        expect(node.nodes[0]?.group).toBe(node)
        expect(node.nodes[1]?.group).toBe(node)
      }
    })

    it('should default group variant to default', () => {
      const def: GroupDef = {
        id: 'group',
        kind: 'group',
        nodes: [],
      }

      const parent: Menu<any> = {
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any
      const node = instantiateSingleNode(def, parent)

      if (node.kind === 'group') {
        expect(node.variant).toBe('default')
      }
    })

    it('should instantiate a radio group', () => {
      const onValueChange = () => {}
      const def: GroupDef = {
        id: 'radiogroup',
        kind: 'group',
        variant: 'radio',
        value: 'option1',
        onValueChange,
        nodes: [
          { id: 'r1', label: 'Option 1', kind: 'item', variant: 'radio' },
          { id: 'r2', label: 'Option 2', kind: 'item', variant: 'radio' },
        ],
      }

      const parent: Menu<any> = {
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any
      const node = instantiateSingleNode(def, parent)

      if (node.kind === 'group' && node.variant === 'radio') {
        expect(node.value).toBe('option1')
        expect(node.onValueChange).toBe(onValueChange)
      }
    })

    it('should instantiate a submenu', () => {
      const def: SubmenuDef = {
        id: 'submenu',
        label: 'Submenu',
        kind: 'submenu',
        nodes: [{ id: 'sub-item', label: 'Sub Item', kind: 'item' }],
      }

      const parent: Menu<any> = {
        id: 'parent',
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any
      const node = instantiateSingleNode(def, parent)

      expect(node.kind).toBe('submenu')
      if (node.kind === 'submenu') {
        expect(node.child).toBeDefined()
        expect(node.child.surfaceId).toBe('root::submenu')
        expect(node.child.depth).toBe(1)
        expect(node.nodes).toHaveLength(1)
      }
    })

    it('should default deepSearch to true for submenus', () => {
      const def: SubmenuDef = {
        id: 'submenu',
        label: 'Submenu',
        kind: 'submenu',
        nodes: [],
      }

      const parent: Menu<any> = {
        nodes: [],
        surfaceId: 'root',
        depth: 0,
      } as any
      const node = instantiateSingleNode(def, parent)

      if (node.kind === 'submenu') {
        expect(node.deepSearch).toBe(true)
      }
    })
  })

  describe('instantiateMenuFromDef', () => {
    it('should instantiate a simple menu', () => {
      const def: MenuDef = {
        id: 'test-menu',
        title: 'Test Menu',
        nodes: [
          { id: 'item1', label: 'Item 1', kind: 'item' },
          { id: 'item2', label: 'Item 2', kind: 'item' },
        ],
      }

      const menu = instantiateMenuFromDef(def, 'root', 0)

      expect(menu.id).toBe('test-menu')
      expect(menu.title).toBe('Test Menu')
      expect(menu.surfaceId).toBe('root')
      expect(menu.depth).toBe(0)
      expect(menu.nodes).toHaveLength(2)
    })

    it('should handle empty nodes array', () => {
      const def: MenuDef = {
        id: 'empty',
        nodes: [],
      }

      const menu = instantiateMenuFromDef(def, 'root', 0)

      expect(menu.nodes).toHaveLength(0)
    })

    it('should handle menu with groups', () => {
      const def: MenuDef = {
        id: 'menu',
        nodes: [
          {
            id: 'group1',
            kind: 'group',
            heading: 'Group 1',
            nodes: [
              { id: 'item1', label: 'Item 1', kind: 'item' },
              { id: 'item2', label: 'Item 2', kind: 'item' },
            ],
          },
        ],
      }

      const menu = instantiateMenuFromDef(def, 'root', 0)

      expect(menu.nodes).toHaveLength(1)
      expect(menu.nodes[0]?.kind).toBe('group')
      if (menu.nodes[0]?.kind === 'group') {
        expect(menu.nodes[0].nodes).toHaveLength(2)
      }
    })

    it('should handle nested submenus', () => {
      const def: MenuDef = {
        id: 'menu',
        nodes: [
          {
            id: 'sub1',
            label: 'Submenu 1',
            kind: 'submenu',
            nodes: [
              {
                id: 'sub2',
                label: 'Submenu 2',
                kind: 'submenu',
                nodes: [{ id: 'deep-item', label: 'Deep Item', kind: 'item' }],
              },
            ],
          },
        ],
      }

      const menu = instantiateMenuFromDef(def, 'root', 0)

      expect(menu.nodes).toHaveLength(1)
      const sub1 = menu.nodes[0]
      if (sub1?.kind === 'submenu') {
        expect(sub1.child.depth).toBe(1)
        expect(sub1.child.surfaceId).toBe('root::sub1')

        const sub2 = sub1.child.nodes[0]
        if (sub2?.kind === 'submenu') {
          expect(sub2.child.depth).toBe(2)
          expect(sub2.child.surfaceId).toBe('root::sub1::sub2')
        }
      }
    })

    it('should preserve menu options', () => {
      const def: MenuDef = {
        id: 'menu',
        title: 'My Menu',
        inputPlaceholder: 'Search...',
        hideSearchUntilActive: true,
        nodes: [],
      }

      const menu = instantiateMenuFromDef(def, 'root', 0)

      expect(menu.title).toBe('My Menu')
      expect(menu.inputPlaceholder).toBe('Search...')
      expect(menu.hideSearchUntilActive).toBe(true)
    })

    it('should handle loader result', () => {
      const def: MenuDef = {
        id: 'menu',
        nodes: [],
        loader: {
          data: [{ id: 'loaded', label: 'Loaded Item', kind: 'item' }],
          isLoading: false,
          isError: false,
          isFetching: false,
        },
      }

      const menu = instantiateMenuFromDef(def, 'root', 0)

      expect(menu.nodes).toHaveLength(1)
      expect(menu.nodes[0]?.id).toBe('loaded')
      expect(menu.loadingState?.isLoading).toBe(false)
    })

    it('should skip function loaders', () => {
      const def: MenuDef = {
        id: 'menu',
        nodes: [{ id: 'static', label: 'Static', kind: 'item' }],
        loader: async () => [],
      }

      const menu = instantiateMenuFromDef(def, 'root', 0)

      // Should use static nodes, not loader
      expect(menu.nodes).toHaveLength(1)
      expect(menu.nodes[0]?.id).toBe('static')
    })
  })

  describe('flatten', () => {
    describe('runtime nodes', () => {
      it('should flatten a menu shallowly', () => {
        const def: MenuDef = {
          id: 'menu',
          nodes: [
            { id: 'item1', label: 'Item 1', kind: 'item' },
            {
              id: 'group1',
              kind: 'group',
              nodes: [
                { id: 'item2', label: 'Item 2', kind: 'item' },
                { id: 'item3', label: 'Item 3', kind: 'item' },
              ],
            },
          ],
        }

        const menu = instantiateMenuFromDef(def, 'root', 0)
        const flattened = flatten(menu)

        // Shallow includes: item1, group1, item2, item3
        expect(flattened).toHaveLength(4)
        expect(flattened[0]?.id).toBe('item1')
        expect(flattened[1]?.id).toBe('group1')
        expect(flattened[2]?.id).toBe('item2')
        expect(flattened[3]?.id).toBe('item3')
      })

      it('should flatten a menu deeply', () => {
        const def: MenuDef = {
          id: 'menu',
          nodes: [
            { id: 'item1', label: 'Item 1', kind: 'item' },
            {
              id: 'sub1',
              label: 'Submenu',
              kind: 'submenu',
              nodes: [
                { id: 'sub-item1', label: 'Sub Item 1', kind: 'item' },
                { id: 'sub-item2', label: 'Sub Item 2', kind: 'item' },
              ],
            },
          ],
        }

        const menu = instantiateMenuFromDef(def, 'root', 0)
        const flattened = flatten(menu, { deep: true })

        // Deep includes: item1, sub1, sub-item1, sub-item2
        expect(flattened.length).toBeGreaterThanOrEqual(4)
        expect(flattened.some((n) => n.id === 'item1')).toBe(true)
        expect(flattened.some((n) => n.id === 'sub1')).toBe(true)
        expect(flattened.some((n) => n.id === 'sub-item1')).toBe(true)
        expect(flattened.some((n) => n.id === 'sub-item2')).toBe(true)
      })

      it('should flatten a single node', () => {
        const def: MenuDef = {
          id: 'menu',
          nodes: [
            {
              id: 'group1',
              kind: 'group',
              nodes: [
                { id: 'item1', label: 'Item 1', kind: 'item' },
                { id: 'item2', label: 'Item 2', kind: 'item' },
              ],
            },
          ],
        }

        const menu = instantiateMenuFromDef(def, 'root', 0)
        const groupNode = menu.nodes[0]!
        const flattened = flatten(groupNode)

        // Should include group itself + children
        expect(flattened).toHaveLength(3)
        expect(flattened[0]?.id).toBe('group1')
        expect(flattened[1]?.id).toBe('item1')
        expect(flattened[2]?.id).toBe('item2')
      })

      it('should flatten an array of nodes', () => {
        const def: MenuDef = {
          id: 'menu',
          nodes: [
            { id: 'item1', label: 'Item 1', kind: 'item' },
            { id: 'item2', label: 'Item 2', kind: 'item' },
          ],
        }

        const menu = instantiateMenuFromDef(def, 'root', 0)
        const flattened = flatten(menu.nodes)

        expect(flattened).toHaveLength(2)
      })

      it('should handle empty array', () => {
        const flattened = flatten([])
        expect(flattened).toHaveLength(0)
      })

      it('should not include submenu children in shallow flatten', () => {
        const def: MenuDef = {
          id: 'menu',
          nodes: [
            {
              id: 'sub1',
              label: 'Submenu',
              kind: 'submenu',
              nodes: [{ id: 'hidden', label: 'Hidden', kind: 'item' }],
            },
          ],
        }

        const menu = instantiateMenuFromDef(def, 'root', 0)
        const flattened = flatten(menu)

        // Shallow should only include sub1, not hidden
        expect(flattened).toHaveLength(1)
        expect(flattened[0]?.id).toBe('sub1')
      })
    })

    describe('definition nodes', () => {
      it('should flatten a MenuDef shallowly', () => {
        const def: MenuDef = {
          id: 'menu',
          nodes: [
            { id: 'item1', label: 'Item 1', kind: 'item' },
            {
              id: 'group1',
              kind: 'group',
              nodes: [
                { id: 'item2', label: 'Item 2', kind: 'item' },
                { id: 'item3', label: 'Item 3', kind: 'item' },
              ],
            },
          ],
        }

        const flattened = flatten(def)

        expect(flattened).toHaveLength(4)
        expect(flattened[0]?.id).toBe('item1')
        expect(flattened[1]?.id).toBe('group1')
        expect(flattened[2]?.id).toBe('item2')
        expect(flattened[3]?.id).toBe('item3')
      })

      it('should flatten a MenuDef deeply', () => {
        const def: MenuDef = {
          id: 'menu',
          nodes: [
            {
              id: 'sub1',
              label: 'Submenu',
              kind: 'submenu',
              nodes: [
                { id: 'sub-item', label: 'Sub Item', kind: 'item' },
                {
                  id: 'sub2',
                  label: 'Nested Submenu',
                  kind: 'submenu',
                  nodes: [
                    { id: 'deep-item', label: 'Deep Item', kind: 'item' },
                  ],
                },
              ],
            },
          ],
        }

        const flattened = flatten(def, { deep: true })

        expect(flattened.some((n) => n.id === 'sub1')).toBe(true)
        expect(flattened.some((n) => n.id === 'sub-item')).toBe(true)
        expect(flattened.some((n) => n.id === 'sub2')).toBe(true)
        expect(flattened.some((n) => n.id === 'deep-item')).toBe(true)
      })

      it('should flatten a single NodeDef', () => {
        const def: GroupDef = {
          id: 'group',
          kind: 'group',
          nodes: [
            { id: 'item1', label: 'Item 1', kind: 'item' },
            { id: 'item2', label: 'Item 2', kind: 'item' },
          ],
        }

        const flattened = flatten(def)

        expect(flattened).toHaveLength(3)
        expect(flattened[0]?.id).toBe('group')
      })

      it('should flatten an array of NodeDef', () => {
        const defs: NodeDef[] = [
          { id: 'item1', label: 'Item 1', kind: 'item' },
          { id: 'item2', label: 'Item 2', kind: 'item' },
        ]

        const flattened = flatten(defs)

        expect(flattened).toHaveLength(2)
      })

      it('should handle undefined nodes in groups', () => {
        const def: GroupDef = {
          id: 'group',
          kind: 'group',
          nodes: [],
        }

        const flattened = flatten(def)

        expect(flattened).toHaveLength(1)
        expect(flattened[0]?.id).toBe('group')
      })
    })
  })
})
