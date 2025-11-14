import React from 'react'
import { createActionMenu } from '../src/index.js'
import type { MenuDef } from '../src/types.js'

const ActionMenu = createActionMenu()

export interface ControlledTestAppProps {
  menuDef: MenuDef
  initialOpen?: boolean
}

/**
 * Test app component for E2E tests
 * Provides controlled state and test IDs for all elements
 */
export function ControlledTestApp({
  menuDef,
  initialOpen = false,
}: ControlledTestAppProps) {
  const [open, setOpen] = React.useState(initialOpen)
  const [selectedId, setSelectedId] = React.useState<string>('')

  // Memoize the onSelect handler
  const handleSelect = React.useCallback(({ node }: any) => {
    setSelectedId(node.id)
  }, [])

  // Memoize the enhanced menu def
  const enhancedMenuDef = React.useMemo(
    () => ({
      ...menuDef,
      defaults: {
        ...menuDef.defaults,
        item: {
          ...menuDef.defaults?.item,
          onSelect: handleSelect,
        },
      },
    }),
    [], // Empty deps array since menuDef is constant and handleSelect is stable
  )

  return (
    <div style={{ padding: '20px' }}>
      <ActionMenu
        trigger={
          <button type="button" data-testid="menu-trigger">
            Open Menu
          </button>
        }
        menu={enhancedMenuDef}
        open={open}
        onOpenChange={setOpen}
        responsive={{
          mode: 'dropdown', // Force dropdown mode for tests
        }}
        slotProps={{
          list: {
            'data-testid': 'menu-list',
          },
          item: (node: any) => ({
            'data-testid': `menu-item-${node.id}`,
          }),
        }}
      />
      <div data-testid="selected-id" style={{ marginTop: '10px' }}>
        {selectedId}
      </div>
    </div>
  )
}
