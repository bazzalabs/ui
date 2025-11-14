/** biome-ignore-all lint/a11y/useSemanticElements: This library renders ARIA-only primitives intentionally. */

import { Popover } from '@base-ui-components/react/popover'
import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import { Primitive } from '@radix-ui/react-primitive'
import * as React from 'react'
import { Drawer } from 'vaul'
import { useDisplayMode } from '../contexts/display-mode-context.js'
import { useRootCtx } from '../contexts/root-context.js'
import { cn } from '../lib/cn.js'
import type { ButtonProps } from '../types.js'
import { InteractionGuard } from './interaction-guard.js'

export interface ActionMenuTriggerProps extends ButtonProps {}

/** Button that toggles the menu. Also acts as the Popper anchor (dropdown) or Drawer.Trigger (drawer). */
export const Trigger = React.forwardRef<
  HTMLButtonElement,
  ActionMenuTriggerProps
>(
  (
    { children, disabled, onPointerDown, onKeyDown, className, ...props },
    forwardedRef,
  ) => {
    const root = useRootCtx()
    const mode = useDisplayMode()

    const button = (
      <Primitive.button
        {...props}
        data-slot="action-menu-trigger"
        data-action-menu-trigger
        ref={composeRefs(forwardedRef, root.anchorRef)}
        disabled={disabled}
        className={cn(root.classNames?.trigger, className)}
        onClick={(event: any) => {
          // Prevent Base UI's default toggle behavior using the official API
          event.preventBaseUIHandler?.()
        }}
        onPointerUp={(event: any) => {
          // Also prevent on pointer up since Base UI may use this event
          event.preventBaseUIHandler?.()
        }}
        onPointerDown={composeEventHandlers(onPointerDown, (event: any) => {
          // Prevent Base UI's handler on pointer down as well
          event.preventBaseUIHandler?.()
          if (!disabled && event.button === 0 && event.ctrlKey === false) {
            const willOpen = !root.open
            root.onOpenToggle()
            if (willOpen) event.preventDefault()
          }
        })}
        onKeyDown={composeEventHandlers(onKeyDown, (event) => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            root.onOpenToggle()
            event.preventDefault()
          }
          if (event.key === 'ArrowDown') {
            root.onOpenChange(true)
            event.preventDefault()
          }
        })}
        aria-haspopup="menu"
        aria-expanded={root.open}
      >
        {children}
      </Primitive.button>
    )

    const content =
      mode === 'drawer' ? (
        <Drawer.Trigger asChild>{button}</Drawer.Trigger>
      ) : (
        <Popover.Trigger render={button} />
      )

    if (mode === 'drawer') {
      return content
    }

    return (
      <InteractionGuard.Branch asChild scopeId={root.scopeId}>
        {content}
      </InteractionGuard.Branch>
    )
  },
)
Trigger.displayName = 'ActionMenu.Trigger'
