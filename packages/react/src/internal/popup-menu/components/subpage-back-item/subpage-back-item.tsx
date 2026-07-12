'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { ItemContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useSubpageContext } from '../../contexts/subpage-context.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { PopupMenuSubpageBackItemDataAttributes } from './subpage-back-item.data-attrs.js'

export { PopupMenuSubpageBackItemDataAttributes }

export interface PopupMenuSubpageBackItemState extends Record<string, unknown> {
  /** Whether this is a subpage back item (always true). */
  subpageBackItem: boolean
  /** Whether the item is highlighted. */
  highlighted: boolean
  /** Whether the item is disabled. */
  disabled: boolean
  first: boolean
  last: boolean
  firstInGroup: boolean
  lastInGroup: boolean
}

const stateAttributesMapping = {
  subpageBackItem: (value: unknown) =>
    value
      ? { [PopupMenuSubpageBackItemDataAttributes.subpageBackItem]: '' }
      : null,
  highlighted: (value: unknown) =>
    value ? { [PopupMenuSubpageBackItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown) =>
    value ? { [PopupMenuSubpageBackItemDataAttributes.disabled]: '' } : null,
  first: (value: unknown) =>
    value ? { [PopupMenuSubpageBackItemDataAttributes.first]: '' } : null,
  last: (value: unknown) =>
    value ? { [PopupMenuSubpageBackItemDataAttributes.last]: '' } : null,
  firstInGroup: (value: unknown) =>
    value
      ? { [PopupMenuSubpageBackItemDataAttributes.firstInGroup]: '' }
      : null,
  lastInGroup: (value: unknown) =>
    value ? { [PopupMenuSubpageBackItemDataAttributes.lastInGroup]: '' } : null,
}

export interface PopupMenuSubpageBackItemProps
  extends ComponentProps<'div', PopupMenuSubpageBackItem.State> {
  /** Explicit unique identifier for this item in the store. */
  id?: string
  /** Unique value for this item used for filtering. */
  value?: string
  /** Additional keywords to match against when filtering. */
  keywords?: string[]
  /** Whether this item is disabled. */
  disabled?: boolean
  /** Whether to force render this item regardless of filter results. */
  forceMount?: boolean
  /** Callback when this item is selected. */
  onSelect?: () => void
  /**
   * Async callback when this item is selected.
   *
   * When provided, this takes precedence over `onSelect`.
   * If provided, this callback is awaited before navigating back.
   * Return `false` to prevent automatic navigation.
   */
  onSelectAsync?: (
    context: PopupMenuSubpageBackItem.OnSelectAsyncContext,
    // biome-ignore lint/suspicious/noConfusingVoidType: `void` keeps non-returning async callbacks assignable — `Promise<undefined | boolean>` would reject `async () => { ... }`
  ) => Promise<void | boolean>
}

/**
 * A list row that navigates back one page in the current subpage stack.
 * Renders a `<div>` element with role="option".
 */
export const PopupMenuSubpageBackItem = React.forwardRef<
  HTMLDivElement,
  PopupMenuSubpageBackItem.Props
>(function PopupMenuSubpageBackItem(props, forwardedRef) {
  const {
    id,
    value,
    keywords,
    disabled: disabledProp = false,
    forceMount = false,
    onSelect,
    onSelectAsync,
    render,
    className,
    style,
    onClick,
    onPointerMove,
    onPointerDown,
    children,
    ...rest
  } = props

  const subpageContext = useSubpageContext()
  const focusOwnerStore = useFocusOwner()
  const [isPending, setIsPending] = React.useState(false)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  React.useEffect(
    () => () => {
      abortControllerRef.current?.abort()
    },
    [],
  )

  const goBack = React.useCallback(() => {
    const didGoBack = subpageContext.goBack()
    if (didGoBack && subpageContext.parentSurfaceId) {
      focusOwnerStore.setOwnerId(subpageContext.parentSurfaceId)
    }

    return didGoBack
  }, [subpageContext, focusOwnerStore])

  // biome-ignore lint/correctness/useExhaustiveDependencies(PopupMenuSubpageBackItem): only the type-level namespace (`PopupMenuSubpageBackItem.OnSelectAsyncContext`) is referenced — erased at runtime, not a real dependency
  const handleBack = React.useCallback(() => {
    if (onSelectAsync) {
      if (isPending) {
        return
      }

      abortControllerRef.current?.abort()

      const controller = new AbortController()
      abortControllerRef.current = controller
      setIsPending(true)

      let didNavigate = false
      const context: PopupMenuSubpageBackItem.OnSelectAsyncContext = {
        goBack: () => {
          const didGoBack = goBack()
          if (didGoBack) {
            didNavigate = true
          }

          return didGoBack
        },
        signal: controller.signal,
      }

      void onSelectAsync(context)
        .then((result) => {
          if (controller.signal.aborted) {
            return
          }

          if (result !== false && !didNavigate) {
            context.goBack()
          }
        })
        .catch(() => {
          // ignore async selection errors and keep current subpage open
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsPending(false)
          }
        })

      return
    }

    onSelect?.()

    goBack()
  }, [onSelect, onSelectAsync, goBack, isPending])

  const item = usePopupMenuItem({
    id,
    value,
    keywords,
    disabled: disabledProp || isPending,
    forceMount,
    closeOnClick: false,
    onSelect: handleBack,
    children,
  })

  const disabled = item.disabled

  const state: PopupMenuSubpageBackItem.State = React.useMemo(
    () => ({
      subpageBackItem: true,
      highlighted: item.isHighlighted,
      disabled,
      first: item.positional.first,
      last: item.positional.last,
      firstInGroup: item.positional.firstInGroup,
      lastInGroup: item.positional.lastInGroup,
    }),
    [item.isHighlighted, disabled, item.positional],
  )

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onClick(event)
      }
    },
    [onClick, item.handlers],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      item.handlers.onPointerDown(event)
      onPointerDown?.(event)
    },
    [item.handlers, onPointerDown],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onPointerMove(event)
      }
    },
    [onPointerMove, item.handlers],
  )

  const wrappedChildren = (
    <ItemContext.Provider value={item.contextValue}>
      {children}
    </ItemContext.Provider>
  )

  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'subpage-back-item')

  return useRender({
    render,
    ref: [item.ref, item.rowRef, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'option',
      tabIndex: -1,
      'aria-selected': item.isHighlighted,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      children: wrappedChildren,
    },
    enabled: item.isVisible,
    defaultTagName: 'div',
  })
})

export namespace PopupMenuSubpageBackItem {
  export type State = PopupMenuSubpageBackItemState
  export interface OnSelectAsyncContext {
    /** Navigate back one page manually. */
    goBack: () => boolean
    /** Aborts when a pending async selection is canceled or unmounted. */
    signal: AbortSignal
  }
  export interface Props extends PopupMenuSubpageBackItemProps {}
}
