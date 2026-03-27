'use client'

import { ContextMenu } from '@bazza-ui/react/context-menu'
import { CopyIcon, ScissorsIcon, Trash2Icon } from 'lucide-react'
import * as React from 'react'

const ITEM_CLASSNAME =
  'group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground data-[highlighted]:bg-accent'

export function ContextMenuShowcase() {
  const triggerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const trigger = triggerRef.current

    if (!trigger) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const rect = trigger.getBoundingClientRect()
      const syntheticContextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width * 0.72,
        clientY: rect.top + rect.height * 0.4,
        button: 2,
      })

      trigger.dispatchEvent(syntheticContextMenuEvent)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <ContextMenu.Root modal={false}>
      <ContextMenu.Trigger
        ref={triggerRef}
        className="flex h-[220px] w-[300px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
      >
        <div className="text-center">
          <div className="text-sm font-medium text-foreground">
            Right-click here
          </div>
          <div className="text-xs text-muted-foreground">
            Long-press on touch
          </div>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup className="min-w-[190px] rounded-xl border border-border bg-popover shadow-lg">
            <ContextMenu.Surface>
              <ContextMenu.List className="p-1 focus:outline-none">
                <ContextMenu.Item className={ITEM_CLASSNAME}>
                  <ScissorsIcon className="size-4 text-muted-foreground group-data-[highlighted]:text-foreground" />
                  Cut
                </ContextMenu.Item>
                <ContextMenu.Item className={ITEM_CLASSNAME}>
                  <CopyIcon className="size-4 text-muted-foreground group-data-[highlighted]:text-foreground" />
                  Copy
                </ContextMenu.Item>
                <ContextMenu.Item className={ITEM_CLASSNAME}>
                  Paste
                </ContextMenu.Item>
                <ContextMenu.Separator className="my-1 h-px bg-border" />
                <ContextMenu.Item
                  className={`${ITEM_CLASSNAME} text-destructive data-[highlighted]:bg-destructive/10`}
                >
                  <Trash2Icon className="size-4 text-destructive/80" />
                  Delete
                </ContextMenu.Item>
              </ContextMenu.List>
            </ContextMenu.Surface>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
