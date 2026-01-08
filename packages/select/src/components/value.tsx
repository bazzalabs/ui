import type { ItemDef, ItemNode } from '@bazza-ui/menu'
import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'
import { useGlobalTheme, useScopedTheme } from '../contexts/theme-context.js'
import { findNodeByValue, findNodesByValues } from '../utils/find-nodes.js'

/**
 * Context for render function children in SelectValue.
 */
export interface SelectValueRenderContext<TData = unknown> {
  /** The selected node (single select) - provides access to icon, label, data, etc. */
  node?: ItemNode<TData> | ItemDef<TData>
  /** The selected nodes (multi select) - provides access to icon, label, data, etc. */
  nodes?: (ItemNode<TData> | ItemDef<TData>)[]
  /** Placeholder text when no value selected */
  placeholder: string
}

export interface SelectValueProps<TData = unknown> {
  /** Placeholder text (overrides Root's placeholder) */
  placeholder?: string
  /**
   * Render function for custom value display.
   * Receives the current value and context with node data.
   *
   * @example
   * ```tsx
   * <Select.Value>
   *   {(value, { node, placeholder }) => (
   *     node ? (
   *       <span className="flex items-center gap-2">
   *         {node.icon && <span>{node.icon}</span>}
   *         <span>{node.label}</span>
   *       </span>
   *     ) : (
   *       <span className="text-muted">{placeholder}</span>
   *     )
   *   )}
   * </Select.Value>
   * ```
   */
  children?: (
    value: string | string[] | undefined,
    context: SelectValueRenderContext<TData>,
  ) => React.ReactNode
}

/**
 * SelectValue - Renders the selected value display.
 * Use this inside Select.Trigger to display the current selection.
 *
 * Supports render function children for custom formatting:
 * - Single select: receives `value: string | undefined`
 * - Multi select: receives `values: string[] | undefined`
 */
export function SelectValue<TData = unknown>({
  placeholder: placeholderProp,
  children,
}: SelectValueProps<TData>) {
  const {
    selectedValue,
    selectedValues,
    multiple,
    menu,
    placeholder: contextPlaceholder,
  } = useRootContext<TData>()

  // Get theme slots (scoped takes priority over global)
  const globalTheme = useGlobalTheme()
  const scopedTheme = useScopedTheme()
  const ValueSlot = scopedTheme?.slots?.Value ?? globalTheme?.slots?.Value

  // Allow instance-level placeholder to override context
  const placeholder = placeholderProp ?? contextPlaceholder

  // Find the selected node(s) from the menu
  const selectedNode = React.useMemo(
    () => (multiple ? undefined : findNodeByValue(menu, selectedValue)),
    [menu, selectedValue, multiple],
  )

  const selectedNodes = React.useMemo(
    () => (multiple ? findNodesByValues(menu, selectedValues) : undefined),
    [menu, selectedValues, multiple],
  )

  // Determine if we have a value
  const hasValue = multiple
    ? selectedValues && selectedValues.length > 0
    : Boolean(selectedValue)

  // Render content
  const content = React.useMemo(() => {
    // If children is a render function, use it
    if (typeof children === 'function') {
      const value = multiple ? selectedValues : selectedValue
      return children(value, {
        node: selectedNode as SelectValueRenderContext<TData>['node'],
        nodes: selectedNodes as SelectValueRenderContext<TData>['nodes'],
        placeholder,
      })
    }

    // Otherwise use theme's Value slot
    if (ValueSlot) {
      return ValueSlot({
        value: selectedValue,
        values: selectedValues,
        multiple,
        placeholder,
        node: selectedNode as any,
        nodes: selectedNodes as any,
      })
    }

    // Default fallback
    if (multiple && selectedValues && selectedValues.length > 0) {
      return `${selectedValues.length} selected`
    }
    if (!multiple && selectedValue) {
      // Try to show label if we have a node, otherwise show value
      return selectedNode?.label ?? selectedValue
    }
    return placeholder
  }, [
    children,
    ValueSlot,
    multiple,
    selectedValue,
    selectedValues,
    selectedNode,
    selectedNodes,
    placeholder,
  ])

  return <span data-placeholder={!hasValue ? '' : undefined}>{content}</span>
}
