'use client'

import { useRender } from '@base-ui/react/use-render'
import { useStore } from '@base-ui/utils/store'
import type { CheckboxItemFields } from '@bazza-ui/menu-core'
import * as React from 'react'
import {
  createChangeEventDetails,
  REASONS,
} from '../../../../utils/events/index.js'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { ItemContext, useSurfaceContext } from '../../../listbox/index.js'
import { isPending } from '../../../listbox/store/ListboxStore.js'
import { useCheckboxSelection } from '../../contexts/checkbox-selection-context.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import type {
  CheckedChangeReason,
  SelectionCommitReason,
} from '../../events.js'
import { useMaybeStore } from '../../hooks/use-maybe-store.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { isChecked } from '../../store/CheckboxGroupStore.js'
import { useMaybeCheckboxGroupContext } from '../checkbox-group/checkbox-group-context.js'
import { PopupMenuCheckboxItemDataAttributes } from './checkbox-item.data-attrs.js'
import {
  CheckboxItemContext,
  type CheckboxItemContextValue,
} from './checkbox-item-context.js'

export { PopupMenuCheckboxItemDataAttributes }

export interface PopupMenuCheckboxItemState extends Record<string, unknown> {
  /**
   * Whether the item is highlighted (via keyboard or pointer).
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
  /**
   * Whether the item is currently checked.
   */
  checked: boolean
  /** Whether a range or drag selection previews a different checked state for this item. */
  pending: boolean
  first: boolean
  last: boolean
  firstInGroup: boolean
  lastInGroup: boolean
}

export interface PopupMenuCheckboxItemProps
  extends CheckboxItemFields,
    Omit<ComponentProps<'div', PopupMenuCheckboxItem.State>, 'onSelect'> {}

const stateAttributesMapping = {
  checked: (value: unknown): Record<string, string> | null =>
    value
      ? { [PopupMenuCheckboxItemDataAttributes.checked]: '' }
      : { [PopupMenuCheckboxItemDataAttributes.unchecked]: '' },
  pending: (value: unknown) =>
    value ? { [PopupMenuCheckboxItemDataAttributes.pending]: '' } : null,
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuCheckboxItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuCheckboxItemDataAttributes.disabled]: '' } : null,
  first: (value: unknown) =>
    value ? { [PopupMenuCheckboxItemDataAttributes.first]: '' } : null,
  last: (value: unknown) =>
    value ? { [PopupMenuCheckboxItemDataAttributes.last]: '' } : null,
  firstInGroup: (value: unknown) =>
    value ? { [PopupMenuCheckboxItemDataAttributes.firstInGroup]: '' } : null,
  lastInGroup: (value: unknown) =>
    value ? { [PopupMenuCheckboxItemDataAttributes.lastInGroup]: '' } : null,
}

/**
 * A selectable checkbox item within a popup menu.
 * Manages its own checked state when standalone; inside a checkbox group the
 * group owns it (`checked`, `defaultChecked` and `onCheckedChange` are ignored).
 * Renders a `<div>` element with role="menuitemcheckbox".
 */
export const PopupMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  PopupMenuCheckboxItem.Props
>(function PopupMenuCheckboxItem(props, forwardedRef) {
  const {
    id,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    value,
    keywords,
    disabled: disabledProp = false,
    onSelect,
    forceMount = false,
    closeOnClick = false,
    shortcut,
    forceOrder,
    forceScore,
    render,
    className,
    style,
    onClick,
    onPointerDown,
    onPointerMove,
    children,
    'aria-describedby': ariaDescribedBy,
    ...rest
  } = props

  const group = useMaybeCheckboxGroupContext()
  const registerItemValue = group?.registerItemValue
  // In a group, the group's store has the checked state, read by this item's
  // value (a key selector), so a change re-renders only the items it checks
  // or unchecks.
  const groupStore = group?.store ?? null

  // Controlled/uncontrolled state management
  const [internalChecked, setInternalChecked] =
    React.useState<boolean>(defaultChecked)
  const isControlled = checkedProp !== undefined
  const ownChecked = isControlled ? checkedProp : internalChecked
  const groupChecked = useMaybeStore(groupStore, isChecked, false, value)
  const checked = groupStore ? groupChecked : ownChecked

  const toggleChecked = React.useCallback(
    (reason: CheckedChangeReason = REASONS.itemPress, event?: Event) => {
      if (groupStore) {
        if (value === undefined) return
        const current = groupStore.getValue()
        const next = current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value]
        groupStore.setValue(next, reason, event)
        return
      }
      const newChecked = !checked
      const eventDetails = createChangeEventDetails(reason, event)

      // Call user's callback first
      onCheckedChange?.(newChecked, eventDetails)

      // If canceled, don't update internal state
      if (eventDetails.isCanceled) return

      if (!isControlled) {
        setInternalChecked(newChecked)
      }
    },
    [checked, groupStore, value, isControlled, onCheckedChange],
  )

  React.useEffect(() => {
    if (registerItemValue === undefined || value === undefined) return
    return registerItemValue(value)
  }, [registerItemValue, value])

  const didWarnRef = React.useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: warn once on mount
  React.useEffect(() => {
    if (didWarnRef.current) return
    if (
      group &&
      (props.checked !== undefined ||
        props.defaultChecked !== undefined ||
        props.onCheckedChange !== undefined)
    ) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'PopupMenu.CheckboxItem: `checked`, `defaultChecked` and `onCheckedChange` are ignored inside a checkbox group. The group owns checked state through its `value` and `onValueChange`.',
        )
      }
      didWarnRef.current = true
    }
    if (group && value === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'PopupMenu.CheckboxItem: a checkbox item inside a checkbox group needs a `value` prop. Without one the item is never checked.',
        )
      }
      didWarnRef.current = true
    }
  }, [])

  const item = usePopupMenuItem({
    id,
    value,
    keywords,
    disabled: disabledProp || (group?.disabled ?? false),
    forceMount,
    shortcut,
    forceOrder,
    forceScore,
    closeOnClick,
    children,
    describedBy: ariaDescribedBy,
  })

  const disabled = item.disabled

  const selection = useCheckboxSelection()
  const { rangeSelection, dragSelection } = usePopupMenuContext()
  // A range or drag selection previews the opposite of the committed state
  // for each item it would change, in the surface's store.
  const { store } = useSurfaceContext()
  const pending = useStore(store, isPending, item.storeId)
  const displayChecked = pending ? !checked : checked

  const commitOwn = React.useCallback(
    (nextChecked: boolean, reason: SelectionCommitReason, event?: Event) => {
      const eventDetails = createChangeEventDetails(reason, event)
      onCheckedChange?.(nextChecked, eventDetails)
      if (eventDetails.isCanceled) return false
      if (!isControlled) setInternalChecked(nextChecked)
      return true
    },
    [isControlled, onCheckedChange],
  )

  const checkedRef = React.useRef(checked)
  checkedRef.current = checked
  const groupId = group?.groupId

  React.useEffect(() => {
    if (!item.storeId || disabled) return
    if (groupStore && value === undefined) return
    const owner =
      groupStore && groupId !== undefined
        ? {
            id: groupId,
            getValue: () => groupStore.getValue(),
            setValue: groupStore.setValue.bind(groupStore),
          }
        : null
    return selection.registerRow({
      id: item.storeId,
      value: value ?? item.storeId,
      owner,
      // A group's committed value is its store's; a standalone item's is
      // its own state, as it last rendered.
      getChecked: groupStore
        ? () => isChecked(groupStore.state, value)
        : () => checkedRef.current,
      commit: commitOwn,
    })
  }, [selection, item.storeId, value, groupId, groupStore, disabled, commitOwn])

  // Register the select handler that toggles checked state
  // Note: closeOnClick is handled by usePopupMenuItem's onAfterSelect
  React.useEffect(() => {
    const handleSelect = () => {
      if (disabled) return
      toggleChecked()
      onSelect?.()
      selection.setAnchor(item.storeId)
    }
    return item.registerSelect(handleSelect)
  }, [disabled, toggleChecked, onSelect, item, selection])

  const state: PopupMenuCheckboxItem.State = React.useMemo(
    () => ({
      highlighted: item.isHighlighted,
      disabled,
      checked: displayChecked,
      pending,
      first: item.positional.first,
      last: item.positional.last,
      firstInGroup: item.positional.firstInGroup,
      lastInGroup: item.positional.lastInGroup,
    }),
    [item.isHighlighted, disabled, displayChecked, pending, item.positional],
  )

  // Toggling from an indicator is an interaction too: it sets the anchor.
  const toggleFromIndicator = React.useCallback(
    (reason?: CheckedChangeReason, event?: Event) => {
      toggleChecked(reason, event)
      if (item.storeId) selection.setAnchor(item.storeId)
    },
    [toggleChecked, selection, item.storeId],
  )

  const checkboxItemContextValue: CheckboxItemContextValue = React.useMemo(
    () => ({
      ...item.contextValue,
      checked: displayChecked,
      toggle: toggleFromIndicator,
    }),
    [item.contextValue, displayChecked, toggleFromIndicator],
  )

  // Merge user-provided handlers with item handlers
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (selection.consumeClickSuppression()) {
        event.preventDefault()
        return
      }
      onClick?.(event)
      if (event.defaultPrevented) return
      if (rangeSelection && event.shiftKey && !disabled && item.storeId) {
        const anchor = selection.getUsableAnchor()
        if (anchor !== null) {
          // Range selection: commit through the store and never close the menu.
          event.preventDefault()
          selection.applyRange(
            anchor,
            item.storeId,
            REASONS.rangeSelection,
            event.nativeEvent,
          )
          return
        }
      }
      item.handlers.onClick(event)
    },
    [onClick, rangeSelection, disabled, item.storeId, item.handlers, selection],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      item.handlers.onPointerDown(event)
      onPointerDown?.(event)
      if (
        dragSelection === false ||
        disabled ||
        !item.storeId ||
        event.button !== 0 ||
        event.shiftKey ||
        (event.pointerType !== 'mouse' && event.pointerType !== 'pen')
      ) {
        return
      }
      selection.beginPress({
        id: item.storeId,
        pointerId: event.pointerId,
        element: event.currentTarget,
        mode: dragSelection,
        clientY: event.clientY,
      })
    },
    [
      item.handlers,
      onPointerDown,
      dragSelection,
      disabled,
      item.storeId,
      selection,
    ],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (selection.isPressActive()) return
      if (!event.defaultPrevented) {
        item.handlers.onPointerMove(event)
      }
    },
    [onPointerMove, item.handlers, selection],
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'checkbox-item')

  const element = useRender({
    render,
    ref: [item.ref, item.rowRef, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'menuitemcheckbox',
      'aria-describedby': item.describedBy,
      tabIndex: -1,
      'aria-checked': displayChecked,
      'aria-disabled': disabled || undefined,
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      children,
    },
    enabled: item.isVisible,
    defaultTagName: 'div',
  })

  if (!item.isVisible) {
    return null
  }

  return (
    <ItemContext.Provider value={item.contextValue}>
      <CheckboxItemContext.Provider value={checkboxItemContextValue}>
        {element}
      </CheckboxItemContext.Provider>
    </ItemContext.Provider>
  )
})

export namespace PopupMenuCheckboxItem {
  export type State = PopupMenuCheckboxItemState
  export interface Props extends PopupMenuCheckboxItemProps {}
}
