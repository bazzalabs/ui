import { cn } from '@bazza-ui/menu'
import * as React from 'react'
import { useCommandMenuContext } from '../context.js'
import { useScopedTheme } from '../contexts/theme-context.js'

export function CommandMenuBreadcrumbs() {
  const {
    navigationStack,
    popSubmenu,
    isInSubmenu,
    showBreadcrumbs,
    inputRef,
  } = useCommandMenuContext()
  const theme = useScopedTheme()

  const handleBack = React.useCallback(() => {
    popSubmenu()
    // Refocus input after navigation
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    })
  }, [popSubmenu, inputRef])

  if (!showBreadcrumbs || !isInSubmenu) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b px-3 py-2 text-sm text-muted-foreground',
        theme?.classNames?.breadcrumbs,
      )}
    >
      <button
        type="button"
        onClick={handleBack}
        className={cn(
          'flex items-center gap-1 hover:text-foreground',
          theme?.classNames?.backButton,
        )}
      >
        <span aria-hidden>←</span>
        <span>Back</span>
      </button>
      {navigationStack.length > 0 && (
        <>
          <span className={cn(theme?.classNames?.breadcrumbSeparator)}>/</span>
          <div className="flex items-center gap-2">
            {navigationStack.map((entry, index) => (
              <React.Fragment key={entry.menuId}>
                {index > 0 && (
                  <span className={cn(theme?.classNames?.breadcrumbSeparator)}>
                    /
                  </span>
                )}
                <span
                  className={cn('truncate', theme?.classNames?.breadcrumbItem)}
                >
                  {entry.menuTitle ?? entry.menuId}
                </span>
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
