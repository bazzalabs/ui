'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useMergedRefs } from '@base-ui/utils/useMergedRefs'
import * as React from 'react'
import {
  PopupSurfaceIdContext,
  SubpageStackContext,
  useSubpageStackState,
} from '../../internal/popup-menu/index.js'
import {
  DataPopupProvider,
  DataSubpagesContent,
  useCloseInOneFrame,
  useMenuElement,
  useMenuSurfaceTier,
  usePressClaim,
} from '../../internal/popup-menu/members.js'
import type { ComponentRenderFn } from '../../utils/types.js'

export interface CommandMenuPopupState extends Dialog.Popup.State {
  /**
   * Whether any non-root subpage is currently open.
   */
  hasOpenSubpage: boolean

  /**
   * Active subpage ID, or null when the root surface is active.
   */
  subpageId: string | null
}

export interface CommandMenuPopupProps
  extends Omit<Dialog.Popup.Props, 'className' | 'render'> {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component's state.
   */
  className?: string | ((state: CommandMenuPopupState) => string)

  /**
   * Allows replacing the popup element with a custom element.
   * The render state includes dialog popup + subpage navigation state.
   */
  render?:
    | React.ReactElement
    | ComponentRenderFn<
        React.HTMLAttributes<HTMLElement>,
        CommandMenuPopupState
      >
}

/**
 * A container for the command menu contents.
 * Wraps Dialog.Popup with popup-menu subpage and data providers.
 */
export const CommandMenuPopup = React.forwardRef<
  HTMLDivElement,
  CommandMenuPopup.Props
>(function CommandMenuPopup(props, forwardedRef) {
  const {
    children,
    className: classNameProp,
    render: renderProp,
    ...rest
  } = props

  const surfaceId = React.useId()
  const tier = useMenuSurfaceTier()
  const popupRef = useMergedRefs(
    forwardedRef,
    useMenuElement('popup', surfaceId),
    // With nothing to animate, the close completes in the frame it closes.
    useCloseInOneFrame(tier),
  )
  const claimPress = usePressClaim(rest.onPointerDownCapture)

  const {
    subpageStackContextValue,
    isSubpageNavigating,
    hasOpenSubpage,
    subpageId,
  } = useSubpageStackState({
    surfaceId,
    store: tier.store,
  })

  const toPopupState = React.useCallback(
    (baseState: Dialog.Popup.State): CommandMenuPopupState => ({
      ...baseState,
      hasOpenSubpage,
      subpageId,
    }),
    [hasOpenSubpage, subpageId],
  )

  const className = React.useMemo(() => {
    if (typeof classNameProp === 'function') {
      return (baseState: Dialog.Popup.State) => {
        return classNameProp(toPopupState(baseState))
      }
    }
    return classNameProp
  }, [classNameProp, toPopupState])

  const render = React.useMemo(() => {
    if (typeof renderProp === 'function') {
      return (
        popupProps: React.HTMLAttributes<HTMLElement>,
        baseState: Dialog.Popup.State,
      ) => renderProp(popupProps, toPopupState(baseState))
    }

    return renderProp
  }, [renderProp, toPopupState])

  return (
    <PopupSurfaceIdContext.Provider value={surfaceId}>
      <SubpageStackContext.Provider value={subpageStackContextValue}>
        <DataPopupProvider>
          <Dialog.Popup
            ref={popupRef}
            className={className}
            render={render}
            data-command-menu-popup=""
            data-navigating={isSubpageNavigating ? '' : undefined}
            data-has-open-subpage={hasOpenSubpage ? '' : undefined}
            {...rest}
            onPointerDownCapture={claimPress}
          >
            {children}
            <DataSubpagesContent />
          </Dialog.Popup>
        </DataPopupProvider>
      </SubpageStackContext.Provider>
    </PopupSurfaceIdContext.Provider>
  )
})

export namespace CommandMenuPopup {
  export type Props = CommandMenuPopupProps
  export type State = CommandMenuPopupState
}
