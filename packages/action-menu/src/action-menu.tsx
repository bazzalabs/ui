import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import { DismissableLayer } from '@radix-ui/react-dismissable-layer'
import * as Popper from '@radix-ui/react-popper'
import { Presence } from '@radix-ui/react-presence'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'

type ActionMenuContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
}

const ActionMenuContext = React.createContext<ActionMenuContextValue | null>(
  null,
)
const ActionMenuProvider = ActionMenuContext.Provider

const useActionMenu = () => {
  const ctx = React.useContext(ActionMenuContext)
  if (!ctx)
    throw new Error('useActionMenu must be used within an ActionMenuProvider')
  return ctx
}

export interface ActionMenuProps extends React.ComponentPropsWithoutRef<'div'> {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Root = React.forwardRef<HTMLDivElement, ActionMenuProps>(
  ({ children, open: openProp, defaultOpen, onOpenChange, ...props }, ref) => {
    const [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? false,
      onChange: onOpenChange,
    })

    const anchorRef = React.useRef<HTMLButtonElement | null>(null)

    return (
      <ActionMenuProvider
        value={{
          open,
          onOpenChange: setOpen,
          onOpenToggle: () => setOpen((v) => !v),
          anchorRef,
        }}
      >
        <Popper.Root>
          <div ref={ref} {...props}>
            {children}
          </div>
        </Popper.Root>
      </ActionMenuProvider>
    )
  },
)
Root.displayName = 'ActionMenu.Root'

export interface ActionMenuTriggerProps
  extends React.ComponentPropsWithoutRef<'button'> {}

export const Trigger = React.forwardRef<
  HTMLButtonElement,
  ActionMenuTriggerProps
>(
  (
    { children, disabled, onPointerDown, onKeyDown, ...props },
    forwardedRef,
  ) => {
    const context = useActionMenu()

    return (
      <Popper.Anchor asChild>
        <button
          {...props}
          ref={composeRefs(forwardedRef, context.anchorRef)}
          disabled={disabled}
          onPointerDown={composeEventHandlers(onPointerDown, (event) => {
            if (!disabled && event.button === 0 && event.ctrlKey === false) {
              const willOpen = !context.open
              context.onOpenToggle()
              if (willOpen) event.preventDefault()
            }
          })}
          onKeyDown={composeEventHandlers(onKeyDown, (event) => {
            if (disabled) return
            if (event.key === 'Enter' || event.key === ' ')
              context.onOpenToggle()
            if (event.key === 'ArrowDown') context.onOpenChange(true)
            if (['Enter', ' ', 'ArrowDown'].includes(event.key))
              event.preventDefault()
          })}
          aria-haspopup="menu"
          aria-expanded={context.open}
        >
          {children}
        </button>
      </Popper.Anchor>
    )
  },
)
Trigger.displayName = 'ActionMenu.Trigger'

export interface ActionMenuContentProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'dir'> {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  /** Keep open on pointer down within the anchor (trigger) */
  closeOnAnchorPointerDown?: boolean
}

export const Content = React.forwardRef<HTMLDivElement, ActionMenuContentProps>(
  (
    {
      children,
      side = 'bottom',
      align = 'start',
      sideOffset = 6,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      closeOnAnchorPointerDown = false,
      ...props
    },
    ref,
  ) => {
    const context = useActionMenu()

    return (
      <Presence present={context.open}>
        <Popper.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          asChild
        >
          <DismissableLayer
            onEscapeKeyDown={() => context.onOpenChange(false)}
            onDismiss={() => context.onOpenChange(false)}
            onInteractOutside={(event) => {
              const target = event.target as Node | null
              const anchor = context.anchorRef.current
              if (
                !closeOnAnchorPointerDown &&
                anchor &&
                target &&
                anchor.contains(target)
              ) {
                event.preventDefault()
              }
            }}
            asChild
          >
            <div
              {...props}
              ref={ref}
              role="menu"
              tabIndex={-1}
              data-action-menu-surface
            >
              {children}
            </div>
          </DismissableLayer>
        </Popper.Content>
      </Presence>
    )
  },
)
Content.displayName = 'ActionMenu.Content'

export interface ActionMenuItemProps
  extends React.ComponentPropsWithoutRef<'div'> {
  disabled?: boolean
}

export const Item = React.forwardRef<HTMLDivElement, ActionMenuItemProps>(
  ({ children, disabled, onClick, onKeyDown, ...props }, ref) => {
    const { onOpenChange } = useActionMenu()
    return (
      <div
        {...props}
        ref={ref}
        role="menuitem"
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={composeEventHandlers(onClick, () => {
          if (disabled) return
          onOpenChange(false)
        })}
        onKeyDown={composeEventHandlers(onKeyDown, (e) => {
          if (disabled) return
          if (e.key === 'Enter') {
            e.preventDefault()
            onOpenChange(false)
          }
        })}
      >
        {children}
      </div>
    )
  },
)
Item.displayName = 'ActionMenu.Item'
