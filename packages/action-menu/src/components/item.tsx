import { composeRefs } from '@radix-ui/react-compose-refs'
import type { VirtualItem } from '@tanstack/react-virtual'
import * as React from 'react'
import {
  closeSubmenuChain,
  useDisplayMode,
  useHoverPolicy,
  useRootCtx,
  useSubCtx,
  useSurfaceId,
} from '../contexts/index.js'
import { useSurfaceSel } from '../hooks/use-surface-sel.js'
import { SELECT_ITEM_EVENT } from '../lib/events.js'
import { mergeProps } from '../lib/merge-props.js'
import { hasDescendantWithProp } from '../lib/react-utils.js'
import type {
  CheckboxItemNode,
  ItemNode,
  MenuNodeDefaults,
  RadioItemNode,
  RowBindAPI,
  SearchContext,
  SurfaceSlots,
  SurfaceStore,
} from '../types.js'

function makeRowId(
  baseId: string,
  search: SearchContext | undefined,
  surfaceId: string | null,
) {
  if (!search || !search.isDeep || !surfaceId) return baseId
  return baseId // keep stable to avoid breaking references
}

interface ItemProps<T> {
  ref?: React.Ref<HTMLElement>
  virtualItem?: VirtualItem
  node: ItemNode<T>
  slot: NonNullable<SurfaceSlots<T>['Item']>
  className?: string
  defaults?: MenuNodeDefaults<T>['item']
  store: SurfaceStore<T>
  search?: SearchContext
}

export function Item<T>({
  ref: refProp,
  virtualItem,
  node,
  slot,
  className,
  defaults,
  store,
  search,
}: ItemProps<T>) {
  const ref = React.useRef<HTMLElement | null>(null)
  const surfaceId = useSurfaceId()
  const mode = useDisplayMode()
  const rowId = makeRowId(node.id, search, surfaceId)
  const root = useRootCtx()
  const sub = useSubCtx()
  const onSelect = node.onSelect ?? defaults?.onSelect

  // Checkbox state (controlled only)
  const checked =
    node.variant === 'checkbox' ? (node as CheckboxItemNode).checked : false

  // For checkbox/radio, default to NOT closing; for button, default to closing
  const defaultCloseOnSelect = node.variant === 'button'
  const closeOnSelect =
    node.closeOnSelect ?? defaults?.closeOnSelect ?? defaultCloseOnSelect

  const handleSelect = React.useCallback(() => {
    if (node.variant === 'checkbox') {
      // Toggle checkbox state
      ;(node as CheckboxItemNode).onCheckedChange(!checked)
    } else if (node.variant === 'radio') {
      if (node.group?.variant === 'radio' && node.value) {
        node.group.onValueChange(node.value)
      }
    }

    onSelect?.({ node, search })
    if (closeOnSelect) {
      closeSubmenuChain(sub, root)
    }
  }, [node.variant, checked, node, onSelect, search, closeOnSelect, sub, root])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const onSelectFromKey: EventListener = () => {
      handleSelect()
    }
    el.addEventListener(SELECT_ITEM_EVENT, onSelectFromKey)
    return () => el.removeEventListener(SELECT_ITEM_EVENT, onSelectFromKey)
  }, [handleSelect])

  React.useEffect(() => {
    store.registerRow(rowId, {
      ref: ref as any,
      virtualItem,
      disabled: node.disabled ?? false,
      kind: 'item',
    })
    return () => store.unregisterRow(rowId)
  }, [store, rowId, node.disabled])

  const activeId = useSurfaceSel(store, (s) => s.activeId)
  const focused = activeId === rowId
  const { aimGuardActiveRef } = useHoverPolicy()

  const disabled = node.disabled ?? false

  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    e.preventDefault()
  }, [])

  const onMouseMove = React.useCallback(() => {
    if (disabled) return
    if (store.ignorePointerRef.current) return
    if (aimGuardActiveRef.current) return
    if (!focused) store.setActiveId(rowId, 'pointer')
  }, [disabled, aimGuardActiveRef, focused, store, rowId])

  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation() // Prevent event from bubbling to wrapper
      if (disabled) return
      handleSelect()
    },
    [disabled, handleSelect, rowId],
  )

  const baseRowProps = React.useMemo(() => {
    // Compute checked state for checkbox and radio items
    const isChecked =
      node.variant === 'checkbox'
        ? checked
        : node.variant === 'radio'
          ? node.group?.variant === 'radio' && node.group.value === node.value
          : undefined

    return {
      id: rowId,
      ref: composeRefs(refProp as any, ref as any),
      role:
        node.variant === 'checkbox' || node.variant === 'radio'
          ? ('menuitemcheckbox' as const)
          : ('option' as const),
      tabIndex: -1,
      'action-menu-row': '',
      'data-index': virtualItem?.index,
      'data-action-menu-item-id': rowId,
      'data-focused': focused,
      'data-variant': node.variant,
      'data-checked': isChecked,
      'data-group-position': node.groupPosition,
      'data-group-index': node.groupIndex,
      'data-group-size': node.groupSize,
      'aria-selected': focused,
      'aria-checked': isChecked,
      disabled: node.disabled ?? false,
      'aria-disabled': node.disabled ?? false,
      'data-mode': mode,
      className,
      onPointerDown,
      onMouseMove,
      onClick,
    } as const
  }, [
    rowId,
    virtualItem?.index,
    refProp,
    focused,
    node.variant,
    checked,
    node.group,
    (node as RadioItemNode).value,
    node.disabled,
    node.groupPosition,
    node.groupIndex,
    node.groupSize,
    mode,
    className,
    onPointerDown,
    onMouseMove,
    onClick,
  ])

  const bind: RowBindAPI = React.useMemo(
    () => ({
      focused,
      disabled: node.disabled ?? false,
      getRowProps: (overrides) =>
        mergeProps(baseRowProps as any, overrides as any),
    }),
    [focused, node.disabled, baseRowProps],
  )

  // Create an enriched node with live reactive state for slot renderers
  const enrichedNode = React.useMemo(() => {
    if (node.variant === 'checkbox') {
      return {
        ...node,
        checked: checked,
      } as CheckboxItemNode<T>
    }
    if (node.variant === 'radio') {
      // Radio items don't have a checked prop, but we can add the selection state to the base node
      return node
    }
    return node
  }, [node, checked, node.variant]) as ItemNode<T>

  if (node.render) {
    return node.render({ node: enrichedNode, bind, search, mode })
  }

  const slotArgs = { node: enrichedNode, bind, search, mode }
  const visual = slot(slotArgs)

  // If the slot placed `getRowProps` on any nested node, just return it as-is.
  if (hasDescendantWithProp(visual, 'data-action-menu-item-id')) {
    return visual as React.ReactElement
  }

  const fallbackVisual = visual ?? <span>{node.label ?? String(node.id)}</span>
  return <div {...(baseRowProps as any)}>{fallbackVisual}</div>
}
