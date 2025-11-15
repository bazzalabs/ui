import * as Dialog from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import * as React from 'react'
import { useCommandMenuContext } from '../context.js'
import { useScopedTheme } from '../contexts/theme-context.js'

function px(n: number) {
  return `${Math.ceil(n)}px`
}

export function CommandMenuContent({
  children,
}: {
  children?: React.ReactNode
}) {
  const theme = useScopedTheme()
  const { currentMenu, navigationStack } = useCommandMenuContext()
  const observerRef = React.useRef<ResizeObserver | null>(null)

  // Get title from navigation stack (if in submenu) or from current menu
  const dialogTitle = React.useMemo(() => {
    if (navigationStack.length > 0) {
      const currentEntry = navigationStack[navigationStack.length - 1]
      return currentEntry?.menuTitle ?? 'Command Menu'
    }
    return currentMenu.title ?? currentMenu.id ?? 'Command Menu'
  }, [currentMenu, navigationStack])

  const innerContentRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      // Clean up existing observer
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      // If element exists, set up new observer
      if (element) {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            // Set CSS variables on the parent Dialog.Content element
            // so they can be used in the dialogContent className
            const parent = element.parentElement
            if (parent) {
              parent.style.setProperty('--command-menu-width', px(width))
              parent.style.setProperty('--command-menu-height', px(height))
            }
          }
        })

        observer.observe(element)
        observerRef.current = observer
      }
    },
    [],
  )

  // Base props for dialog inner wrapper
  const baseProps = {
    ref: innerContentRef,
    className: theme?.classNames?.dialogInner,
    'data-slot': 'command-menu-dialog-inner' as const,
    'data-command-menu-dialog-inner': true as const,
  }

  // Render dialog inner using slot or default
  const DialogInnerSlot = theme?.slots?.DialogInner
  const contentEl = DialogInnerSlot
    ? DialogInnerSlot({ children, baseProps })
    : React.createElement('div', baseProps, children)

  return (
    <Dialog.Portal>
      <Dialog.Overlay className={theme?.classNames?.dialogOverlay} />
      <Dialog.Content className={theme?.classNames?.dialogContent}>
        <VisuallyHidden.Root>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Description>{dialogTitle}</Dialog.Description>
        </VisuallyHidden.Root>
        {contentEl}
      </Dialog.Content>
    </Dialog.Portal>
  )
}
