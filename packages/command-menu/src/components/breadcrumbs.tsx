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
      data-slot="command-menu-breadcrumbs"
      className={theme?.classNames?.breadcrumbs}
    >
      <button
        type="button"
        onClick={handleBack}
        data-slot="breadcrumb-back-button"
        className={theme?.classNames?.backButton}
      >
        <span aria-hidden>←</span>
        <span>Back</span>
      </button>
      {navigationStack.length > 0 && (
        <>
          <span
            data-slot="breadcrumb-separator"
            className={theme?.classNames?.breadcrumbSeparator}
          >
            /
          </span>
          <div data-slot="breadcrumb-items">
            {navigationStack.map((entry, index) => (
              <React.Fragment key={entry.menuId}>
                {index > 0 && (
                  <span
                    data-slot="breadcrumb-separator"
                    className={theme?.classNames?.breadcrumbSeparator}
                  >
                    /
                  </span>
                )}
                <span
                  data-slot="breadcrumb-item"
                  className={theme?.classNames?.breadcrumbItem}
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
