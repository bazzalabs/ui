import type { MenuNodeDefaults } from '@bazza-ui/menu'
import {
  type PopupMenuDef,
  type PopupSubmenuDef,
  Positioner,
  Surface,
} from '@bazza-ui/popup-menu'
import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'
import type { SelectMenuDef } from '../types.js'
import { validateSelectMenu } from '../types.js'

export interface SelectContentProps<T = unknown> {
  /** Menu definition (optional if provided to Root) */
  menu?: SelectMenuDef<T>
  /** Placeholder for search input */
  placeholder?: string
  /** Which side to position the menu on */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** How to align the menu with the trigger */
  align?: 'start' | 'center' | 'end'
  /** Offset from the trigger (perpendicular to side) */
  sideOffset?: number
  /** Offset along the alignment axis */
  alignOffset?: number
  /** Default configurations for menu behavior */
  defaults?: Partial<MenuNodeDefaults<T>>
}

/**
 * SelectContent - Renders the select listbox content anchored to the trigger.
 * Uses popup-menu's Positioner and Surface but with listbox semantics.
 */
export function SelectContent<T = unknown>({
  menu: menuProp,
  placeholder,
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  alignOffset = 0,
  defaults,
}: SelectContentProps<T>) {
  const {
    open,
    closeAllSurfaces,
    triggerRef,
    control,
    scopeId,
    selectedValue,
    selectedValues,
    onValueChange,
    onValuesChange,
    multiple,
  } = useRootContext<T>()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Validate menu in development mode
  React.useEffect(() => {
    if (menuProp && process.env.NODE_ENV === 'development') {
      validateSelectMenu(menuProp)
    }
  }, [menuProp])

  // Extract surface defaults for Surface props
  const vimBindings = defaults?.surface?.vimBindings ?? true
  const dir = defaults?.surface?.dir ?? 'ltr'

  // Use trigger element as anchor
  if (!triggerRef.current || !menuProp) {
    return null
  }

  // Wrap menu to handle selection
  const wrappedMenu = React.useMemo(() => {
    if (!menuProp) return menuProp

    // Transform menu to handle item selection
    const transformNodes = (
      nodes?: SelectMenuDef<T>['nodes'],
    ): SelectMenuDef<T>['nodes'] => {
      if (!nodes) return nodes

      return nodes.map((node) => {
        if (node.kind === 'item') {
          // Get item value - use id as value if not explicitly set
          const itemValue = (node as any).value ?? node.id

          // Determine if this item is selected
          const isSelected = multiple
            ? selectedValues?.includes(itemValue) ?? false
            : selectedValue === itemValue

          return {
            ...node,
            variant: multiple ? ('checkbox' as const) : node.variant,
            checked: multiple ? isSelected : undefined,
            onSelect: () => {
              if (multiple) {
                // Toggle selection
                const newValues = isSelected
                  ? (selectedValues ?? []).filter((v) => v !== itemValue)
                  : [...(selectedValues ?? []), itemValue]
                onValuesChange?.(newValues)
              } else {
                // Single select
                onValueChange?.(itemValue)
                // Close after selection in single select
                closeAllSurfaces()
              }
              // Call original onSelect if provided
              node.onSelect?.()
            },
            onCheckedChange:
              multiple && node.variant === 'checkbox'
                ? (checked: boolean) => {
                    const newValues = checked
                      ? [...(selectedValues ?? []), itemValue]
                      : (selectedValues ?? []).filter((v) => v !== itemValue)
                    onValuesChange?.(newValues)
                  }
                : undefined,
          }
        }

        if (node.kind === 'group') {
          return {
            ...node,
            nodes: transformNodes(node.nodes as any) as any,
          }
        }

        return node
      })
    }

    return {
      ...menuProp,
      nodes: transformNodes(menuProp.nodes),
    } as PopupMenuDef<T>
  }, [
    menuProp,
    multiple,
    selectedValue,
    selectedValues,
    onValueChange,
    onValuesChange,
    closeAllSurfaces,
  ])

  // Listbox ID for ARIA
  const listboxId = `${scopeId}-listbox`

  return (
    <Positioner
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      anchor={triggerRef.current}
    >
      <Surface
        menu={wrappedMenu as PopupMenuDef<T>}
        open={open}
        onClose={closeAllSurfaces}
        contentRef={contentRef}
        placeholder={placeholder}
        vimBindings={vimBindings}
        dir={dir}
        defaults={defaults as any}
        control={control}
        // Override role for listbox semantics via popupProps
        popupProps={{
          role: 'listbox',
          'aria-labelledby': `${scopeId}-trigger`,
          'aria-multiselectable': multiple ? true : undefined,
          id: listboxId,
        }}
      />
    </Positioner>
  )
}
