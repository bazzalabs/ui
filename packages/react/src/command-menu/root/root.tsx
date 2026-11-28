'use client'

import { Dialog } from '@base-ui/react/dialog'
import * as React from 'react'
import {
  type GetResolvedIdFn,
  type PopupMenuIdScope,
  PopupMenuProviders,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import { askFromBaseUI } from '../../internal/popup-menu/members.js'
import { REASONS } from '../../utils/events/index.js'
import { useHotkey } from '../../utils/keybinding/use-hotkey.js'
import type { CommandMenuOpenChangeEventDetails } from '../events.js'

export interface CommandMenuRootProps {
  children: React.ReactNode
  /** Whether the command menu is open. To render an uncontrolled menu, use `defaultOpen` instead. */
  open?: boolean
  /**
   * Whether the command menu is open when it first renders. To render a controlled menu, use `open` instead.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Called when the command menu opens or closes. The second parameter
   * contains event details, including the reason for the change;
   * `eventDetails.cancel()` keeps the menu as it is.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: CommandMenuOpenChangeEventDetails,
  ) => void
  /** Called after the open or close animation finishes. */
  onOpenChangeComplete?: (open: boolean) => void
  /**
   * A keyboard shortcut that toggles the menu from anywhere on the page, such as `'mod+k'`.
   * `mod` is Command on Apple platforms and Control elsewhere. It also works while focus is in `CommandMenu.Input`, so the same shortcut closes the menu.
   */
  hotkey?: string
  /**
   * Whether the menu is modal: page scroll is locked and outside elements can't be interacted with while it's open.
   * @default true
   */
  modal?: boolean
  /**
   * Whether the menu ignores the user opening or closing it: the trigger is disabled and the `hotkey` does nothing.
   * @default false
   */
  disabled?: boolean
  /**
   * Elements outside the menu that don't dismiss it: pressing one, or moving focus from the menu to one, is no outside press or focus-out. Read when the event happens, so the elements may change over time.
   * Applies to non-modal menus (`modal={false}`): a modal menu's backdrop takes presses outside it, so the elements under it are never pressed.
   */
  getDismissExemptElements?: () => ReadonlyArray<Element | null | undefined>
  /**
   * Computes canonical Resolved IDs for data-first content from the Unresolved Menu Node (definitional facts only).
   * @default encoded surface Definition Path joined with `/`; `idScope="menu"` uses the Definition Key
   * Read once when the menu root mounts — later changes have no effect. To retain the old dot-path default, use `node => node.def.id ?? node.definitionPath.join('.')`. This does not recreate former tree-item ancestry; exact compatibility requires walking `node.parent` and reproducing the old slug/key lineage.
   * @example
   * <CommandMenu.Root getResolvedId={(node) => node.def.id ?? node.definitionPath.join('.')} />
   */
  getResolvedId?: GetResolvedIdFn
  /** Definition Key uniqueness scope. Read once when the menu root mounts. @default 'surface' */
  idScope?: PopupMenuIdScope

  /**
   * Whether shift-clicking a checkbox item (or pressing Shift+Enter on the
   * highlighted one) sets every checkbox item between it and the last
   * checkbox item you interacted with to the same checked state. Also
   * enables the keyboard span: hold Shift while moving the highlight, release
   * Shift to apply.
   * @default true
   */
  rangeSelection?: boolean
  /**
   * Lets the user press a checkbox item and drag across others to set them all
   * to the pressed item's new state. Off by default. `'keep'` keeps rows set
   * once the pointer has reached them; `'rubber-band'` returns rows outside the
   * current span to their previous state. Mouse and pen only.
   * @default false
   */
  dragSelection?: false | 'keep' | 'rubber-band'
  /**
   * Returns the text announced to screen readers after a range or drag
   * selection changes rows, for localization. `count` is the number of rows
   * changed and `checked` the state they were set to. Defaults to English
   * ("3 items checked", "1 item unchecked").
   */
  getAriaSelectionText?: (count: number, checked: boolean) => string
}

/**
 * Groups all parts of the command menu.
 * Manages open state and provides popup-menu context to children.
 * Doesn't render its own HTML element.
 */
export function CommandMenuRoot(props: CommandMenuRoot.Props) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    hotkey,
    modal = true,
    disabled,
    getDismissExemptElements,
    getResolvedId,
    idScope = 'surface',
    rangeSelection = true,
    dragSelection = false,
    getAriaSelectionText,
  } = props

  const {
    store,
    focusOwnerStore,
    openChainStore,
    registerSurface,
    closeAll,
    handleOpenChange,
    disabled: menuDisabled,
    menuTreeResolver,
  } = usePopupMenuRoot({
    // The engine reports a command menu's changes with these reasons only
    onOpenChange: onOpenChange
      ? (nextOpen, eventDetails) =>
          onOpenChange(
            nextOpen,
            eventDetails as CommandMenuOpenChangeEventDetails,
          )
      : undefined,
    defaultOpen,
    disabled,
    closeOnOutsidePress: 'pointerdown',
    getDismissExemptElements,
    getResolvedId,
    idScope,
  })

  store.useControlledProp('openProp', openProp)

  const openState = store.useState('open')

  useHotkey(
    hotkey ?? '',
    () => handleOpenChange(!store.select('open'), REASONS.imperativeAction),
    // allowInInput keeps the hotkey working as a *toggle*: while the menu is
    // open, focus sits in the search input, so the close press must be allowed
    // to fire from an editable target.
    { enabled: !!hotkey && !menuDisabled, allowInInput: true },
  )

  const handleDialogOpenChange = React.useCallback(
    (nextOpen: boolean, dialogDetails: Dialog.Root.ChangeEventDetails) => {
      // Through the root's gate; a change that doesn't go through cancels
      // Base UI's too, so Base UI skips its dismissal's side effects
      askFromBaseUI(store, nextOpen, dialogDetails)
    },
    [store],
  )

  const handleDialogOpenChangeComplete = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && store.context.clearSearchOnClose === 'after-exit') {
        store.clearSearch()
        store.setInputActive(false)
      }

      if (!nextOpen) {
        store.clearHighlight()
        store.context.onCloseComplete?.()
        store.context.onPopupCloseComplete?.()
      }

      onOpenChangeComplete?.(nextOpen)
    },
    [store, onOpenChangeComplete],
  )

  return (
    <PopupMenuProviders
      menuTreeResolver={menuTreeResolver}
      store={store}
      focusOwnerStore={focusOwnerStore}
      openChainStore={openChainStore}
      disabled={menuDisabled}
      depth={0}
      closeAll={closeAll}
      explicitTabBehavior
      tabWithoutZones="inert"
      registerSurface={registerSurface}
      menuType="dropdown"
      closeOnOutsidePress="pointerdown"
      rangeSelection={rangeSelection}
      dragSelection={dragSelection}
      getAriaSelectionText={getAriaSelectionText}
      componentName="command-menu"
    >
      <Dialog.Root
        open={openState}
        onOpenChange={handleDialogOpenChange}
        onOpenChangeComplete={handleDialogOpenChangeComplete}
        modal={modal}
      >
        {children}
      </Dialog.Root>
    </PopupMenuProviders>
  )
}

export namespace CommandMenuRoot {
  export interface Props extends CommandMenuRootProps {}
  export type ChangeEventDetails = CommandMenuOpenChangeEventDetails
}
