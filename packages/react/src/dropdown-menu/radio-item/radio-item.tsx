'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useAimGuard } from '../contexts/aim-guard-context.js'
import { useRadioGroupContext } from '../contexts/radio-group-context.js'
import { useRootContext } from '../contexts/root-context.js'
import {
  useGroupContext,
  useSurfaceContext,
} from '../contexts/surface-context.js'
import { DropdownMenuRadioItemDataAttributes } from './radio-item.data-attrs.js'
import {
  RadioItemContext,
  type RadioItemContextValue,
} from './radio-item-context.js'

export interface DropdownMenuRadioItemState extends Record<string, unknown> {
  /**
   * Whether the item is highlighted (via keyboard or pointer).
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
  /**
   * Whether the item is currently selected/checked.
   */
  checked: boolean
}

export interface DropdownMenuRadioItemProps<T = unknown>
  extends ComponentProps<'div', DropdownMenuRadioItemState> {
  /**
   * The value to set when this item is selected.
   * This is required and must be unique within the RadioGroup.
   */
  value: T

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   * @default false
   */
  disabled?: boolean

  /**
   * Callback when this item is selected.
   */
  onSelect?: () => void

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether clicking this item should close the menu.
   * @default false
   */
  closeOnClick?: boolean
}

const stateAttributesMapping = {
  checked: (value: unknown): Record<string, string> | null =>
    value
      ? { [DropdownMenuRadioItemDataAttributes.checked]: '' }
      : { [DropdownMenuRadioItemDataAttributes.unchecked]: '' },
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [DropdownMenuRadioItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [DropdownMenuRadioItemDataAttributes.disabled]: '' } : null,
}

/**
 * A selectable radio item within a RadioGroup.
 * Only one RadioItem can be selected at a time within a RadioGroup.
 * Renders a `<div>` element with role="menuitemradio".
 */
export const DropdownMenuRadioItem = React.forwardRef(
  function DropdownMenuRadioItem<T>(
    props: DropdownMenuRadioItemProps<T>,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      value,
      keywords,
      disabled: disabledProp = false,
      onSelect,
      forceMount = false,
      closeOnClick = false,
      render,
      className,
      style,
      onClick,
      onPointerDown,
      onPointerMove,
      children,
      ...rest
    } = props

    const { store } = useSurfaceContext()
    const groupContext = useGroupContext()
    const radioGroupContext = useRadioGroupContext<T>()
    const { depth, closeAll } = useRootContext()
    const { aimGuardActiveRef, guardedDepthRef } = useAimGuard()

    const id = React.useId()
    const ref = React.useRef<HTMLDivElement>(null)

    // Combine disabled from props and RadioGroup
    const disabled = disabledProp || radioGroupContext.disabled

    // Check if this item is selected
    const checked = radioGroupContext.value === value

    // Infer text value for filtering
    const [inferredValue, setInferredValue] = React.useState<string>('')

    React.useLayoutEffect(() => {
      if (ref.current) {
        const textContent = ref.current.textContent?.trim() ?? ''
        setInferredValue(textContent)
      }
    }, [children])

    // Register with store for navigation/filtering
    React.useEffect(() => {
      if (!inferredValue && !forceMount) return

      const unregister = store.registerItem(id, {
        value: inferredValue,
        keywords,
        groupId: groupContext?.groupId,
        disabled,
      })

      return unregister
    }, [
      id,
      inferredValue,
      keywords,
      groupContext?.groupId,
      disabled,
      store,
      forceMount,
    ])

    // Register onSelect handler (called when Enter is pressed on highlighted item)
    React.useEffect(() => {
      const handleSelect = () => {
        if (disabled) return
        radioGroupContext.setValue(value)
        onSelect?.()
        if (closeOnClick) {
          closeAll()
        }
      }
      return store.registerItemSelect(id, handleSelect)
    }, [
      id,
      disabled,
      radioGroupContext,
      value,
      onSelect,
      closeOnClick,
      closeAll,
      store,
    ])

    // Use selectors for state
    const search = store.useState('search')
    const isHighlighted = store.useState('isHighlighted', id)
    const score = store.useState('getItemScore', id)

    // Visibility based on filter
    const hasSearch = search.length > 0
    const isVisible = forceMount || !hasSearch || score > 0

    // Scroll into view on keyboard highlight
    React.useEffect(() => {
      if (
        isHighlighted &&
        store.state.highlightSource === 'keyboard' &&
        ref.current
      ) {
        ref.current.scrollIntoView({ block: 'nearest' })
      }
    }, [isHighlighted, store])

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (event.defaultPrevented || disabled) return

        event.preventDefault()
        radioGroupContext.setValue(value)
        onSelect?.()

        if (closeOnClick) {
          closeAll()
        }
      },
      [
        onClick,
        disabled,
        radioGroupContext,
        value,
        onSelect,
        closeOnClick,
        closeAll,
      ],
    )

    const handlePointerDown = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault()
        onPointerDown?.(event)
      },
      [onPointerDown],
    )

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(event)
        if (event.defaultPrevented || disabled) return
        if (aimGuardActiveRef.current && guardedDepthRef.current === depth)
          return
        store.setHighlightedId(id)
      },
      [
        onPointerMove,
        disabled,
        aimGuardActiveRef,
        guardedDepthRef,
        depth,
        store,
        id,
      ],
    )

    const state: DropdownMenuRadioItemState = React.useMemo(
      () => ({ highlighted: isHighlighted, disabled, checked }),
      [isHighlighted, disabled, checked],
    )

    const radioItemContextValue: RadioItemContextValue = React.useMemo(
      () => ({ checked, highlighted: isHighlighted, disabled }),
      [checked, isHighlighted, disabled],
    )

    const element = useRender({
      render,
      ref: [ref, forwardedRef],
      state,
      stateAttributesMapping,
      props: {
        ...rest,
        id,
        role: 'menuitemradio',
        tabIndex: -1,
        'aria-checked': checked,
        'aria-disabled': disabled || undefined,
        className,
        style,
        onClick: handleClick,
        onPointerMove: handlePointerMove,
        onPointerDown: handlePointerDown,
        children,
      },
      enabled: isVisible,
      defaultTagName: 'div',
    })

    if (!isVisible) {
      return null
    }

    return (
      <RadioItemContext.Provider value={radioItemContextValue}>
        {element}
      </RadioItemContext.Provider>
    )
  },
) as <T = unknown>(
  props: DropdownMenuRadioItemProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement | null

export namespace DropdownMenuRadioItem {
  export type State = DropdownMenuRadioItemState
  export interface Props<T = unknown> extends DropdownMenuRadioItemProps<T> {}
}
