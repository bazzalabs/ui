import * as React from 'react'
import { Drawer } from 'vaul'
import { useDisplayMode, useRootCtx, useSubCtx } from '../contexts/index.js'
import { cn } from '../lib/cn.js'
import type { Menu, MenuNodeDefaults, SubmenuNode } from '../types.js'
import { Positioner } from './positioner.js'
import { Surface } from './surface.js'

interface SubmenuContentProps<T> {
  menu: SubmenuNode<T>
  defaults?: Partial<MenuNodeDefaults<T>>
}

export function SubmenuContent<T>({ menu, defaults }: SubmenuContentProps<T>) {
  const sub = useSubCtx()!
  const mode = useDisplayMode()
  const root = useRootCtx()

  const suppressHover = sub.pendingOpenModalityRef.current === 'keyboard'
  React.useEffect(() => {
    sub.pendingOpenModalityRef.current = null
  }, [sub])

  const inner = (
    <Surface<T>
      menu={menu.child as Menu<T>}
      render={menu.render}
      defaults={(menu.child.defaults as MenuNodeDefaults<T>) ?? defaults}
      surfaceIdProp={sub.childSurfaceId}
      suppressHoverOpenOnMount={suppressHover}
    />
  )

  if (mode === 'drawer') {
    return (
      <Drawer.Portal>
        <Drawer.Overlay
          data-slot="action-menu-overlay"
          className={root.classNames?.drawerOverlay}
          {...root.slotProps?.drawerOverlay}
        />
        <Drawer.Content
          data-slot="action-menu-drawer-content"
          ref={sub.contentRef as any}
          className={cn(root.classNames?.drawerContent)}
          {...root.slotProps?.drawerContent}
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
            <Drawer.Title className="sr-only">
              {menu.title ?? 'Action Menu'}
            </Drawer.Title>
            <div className={root.classNames?.drawerHandle} />
            {inner as any}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    )
  }

  return <Positioner>{inner as any}</Positioner>
}
