import * as Popper from '@radix-ui/react-popper'
import * as React from 'react'
import { Drawer } from 'vaul'
import { useRootCtx } from '../contexts/root-context.js'
import { cn } from '../lib/cn.js'

export function DropdownShell({ children }: { children: React.ReactNode }) {
  return <Popper.Root>{children}</Popper.Root>
}

/** Drawer shell that mounts everything except the Trigger inside Vaul.Content. */
export function DrawerShell({ children }: { children: React.ReactNode }) {
  const root = useRootCtx()

  // Split children: keep Triggers outside content, render everything else inside Drawer.Content
  const elements = React.Children.toArray(children) as React.ReactElement[]
  const triggerTypeName = 'ActionMenu.Trigger'
  const triggers: React.ReactNode[] = []
  const body: React.ReactNode[] = []

  elements.forEach((child) => {
    const isTrigger =
      React.isValidElement(child) &&
      (child.type as any)?.displayName === triggerTypeName
    if (isTrigger) triggers.push(child)
    else body.push(child)
  })

  return (
    // @ts-expect-error
    <Drawer.Root
      open={root.open}
      onOpenChange={root.onOpenChange}
      {...root.slotProps?.drawerRoot}
    >
      {triggers}
      <Drawer.Portal>
        <Drawer.Overlay
          data-slot="action-menu-overlay"
          className={root.classNames?.drawerOverlay}
          {...root.slotProps?.drawerOverlay}
        />
        <Drawer.Content
          data-slot="action-menu-drawer-content"
          className={root.classNames?.drawerContent}
          {...root.slotProps?.drawerContent}
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
          }}
          onCloseAutoFocus={(event) => {
            if (root.onCloseAutoFocus) {
              root.onCloseAutoFocus(event)
            } else {
              event.preventDefault()
            }
          }}
        >
          <div
            data-slot="action-menu-drawer-content-inner"
            className={cn(root.classNames?.drawerContentInner)}
          >
            <Drawer.Title className="sr-only">Action Menu</Drawer.Title>
            <div className={root.classNames?.drawerHandle} />
            {body}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
