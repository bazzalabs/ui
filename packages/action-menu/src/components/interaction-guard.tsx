import { composeRefs } from '@radix-ui/react-compose-refs'
import * as React from 'react'

/**
 * Minimal event types compatible with your code that referenced
 * Radix’s PointerDownOutsideEvent / FocusOutsideEvent shape.
 */
export type PointerDownOutsideEvent = {
  originalEvent: PointerEvent
  target: Element
  preventDefault: () => void
  defaultPrevented: boolean
}
export type FocusOutsideEvent = {
  originalEvent: FocusEvent
  target: Element
  preventDefault: () => void
  defaultPrevented: boolean
}

type InteractionGuardProps = {
  /** Unique id for this guard instance; generated at ActionMenu.Root */
  scopeId: string
  /** Attribute used to mark the scope root on the wrapped content */
  scopeAttr?: string // default: 'data-interaction-scope'
  /**
   * When `true`, hover/focus/click interactions will be disabled on elements outside
   * the guard. Users will need to click twice on outside elements to interact with them:
   * once to close, and again to trigger the element.
   */
  disableOutsidePointerEvents?: boolean
  /** Event handler called when the escape key is down. Can be prevented via event.preventDefault(). */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** Called when a pointerdown happens outside. Can be prevented on the synthetic event below. */
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void
  /** Called when focus moves outside. Can be prevented on the synthetic event below. */
  onFocusOutside?: (event: FocusOutsideEvent) => void
  /** Called when either a pointerdown outside or a focus outside occurs. Can be prevented. */
  onInteractOutside?: (
    event: PointerDownOutsideEvent | FocusOutsideEvent,
  ) => void
  /** Called when the layer should be dismissed (e.g., on Escape or outside interactions not prevented). */
  onDismiss?: () => void

  /**
   * You asked to determine "inside" by checking if [data-action-menu-surface] is
   * on the target or an ancestor. You can override the selector if needed.
   */
  surfaceSelector?: string

  /**
   * Optional attribute used by Branch to whitelist additional areas as “inside”.
   * Defaults to data-interaction-branch.
   */
  branchAttr?: string

  /** Render the guard without an extra wrapper element by adopting the single child. */
  asChild?: boolean
  children?: React.ReactNode
}

/* ----------------------------------------------------------------------------------------------- */
/* Global pointer-blocking CSS (for disableOutsidePointerEvents)                                   */
/* ----------------------------------------------------------------------------------------------- */

const SCOPE_STYLE_ID = (id: string) => `__ig_styles_${id}__`
const SCOPE_BLOCK_CLASS = (id: string) => `ig--block-${id}`
const scopeRefCounts = new Map<string, number>()

function ensureScopeStyles(
  scopeId: string,
  scopeAttr: string,
  branchAttr: string,
) {
  if (typeof document === 'undefined') return
  const id = SCOPE_STYLE_ID(scopeId)
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  const cls = SCOPE_BLOCK_CLASS(scopeId)
  style.textContent = `
    .${cls} * { pointer-events: none !important; }
    /* Allow interaction ONLY within this scopeId */
    .${cls} [${scopeAttr}="${scopeId}"],
   .${cls} [${scopeAttr}="${scopeId}"] *,
    .${cls} [${branchAttr}="${scopeId}"],
   .${cls} [${branchAttr}="${scopeId}"] * { pointer-events: auto !important; }
  `
  document.head.appendChild(style)
}

function enableScopedBlock(
  scopeId: string,
  scopeAttr: string,
  branchAttr: string,
) {
  ensureScopeStyles(scopeId, scopeAttr, branchAttr)
  if (typeof document === 'undefined') return
  const cls = SCOPE_BLOCK_CLASS(scopeId)
  const n = (scopeRefCounts.get(scopeId) ?? 0) + 1
  scopeRefCounts.set(scopeId, n)
  document.documentElement.classList.add(cls)
}

function disableScopedBlock(scopeId: string) {
  if (typeof document === 'undefined') return
  const cls = SCOPE_BLOCK_CLASS(scopeId)
  const n = Math.max(0, (scopeRefCounts.get(scopeId) ?? 0) - 1)
  if (n === 0) {
    document.documentElement.classList.remove(cls)
    scopeRefCounts.delete(scopeId)
  } else {
    scopeRefCounts.set(scopeId, n)
  }
}

/* ----------------------------------------------------------------------------------------------- */
/* Utility: make cancelable outside event                                                          */
/* ----------------------------------------------------------------------------------------------- */

function makeCancelable<T extends Event>(originalEvent: T, target: Element) {
  let prevented = false
  return {
    originalEvent,
    target,
    preventDefault: () => {
      prevented = true
    },
    get defaultPrevented() {
      return prevented
    },
  }
}

/* ----------------------------------------------------------------------------------------------- */
/* Inside detection                                                                                */
/* ----------------------------------------------------------------------------------------------- */

function isInsideScoped(
  target: Element | null,
  surfaceSelector: string,
  branchAttr: string,
  scopeAttr: string,
  scopeId: string,
) {
  if (!target) return false
  // 1) Branches marked for this scope
  if (target.closest?.(`[${branchAttr}="${scopeId}"]`)) return true
  // 2) Any surface that is inside the same scope root
  const surface = target.closest?.(surfaceSelector)
  if (
    surface &&
    (surface as Element).closest?.(`[${scopeAttr}="${scopeId}"]`)
  ) {
    return true
  }
  // 3) If the target is inside the scope root but not in a surface/branch, treat as outside
  return false
}

/* ----------------------------------------------------------------------------------------------- */
/* Root                                                                                            */
/* ----------------------------------------------------------------------------------------------- */

const Root = React.forwardRef<HTMLElement, InteractionGuardProps>(
  function InteractionGuardRoot(
    {
      asChild,
      children,
      disableOutsidePointerEvents = false,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onDismiss,
      surfaceSelector = '[data-action-menu-surface]',
      scopeId,
      scopeAttr = 'data-interaction-scope',
      branchAttr = 'data-interaction-branch',
    },
    forwardedRef,
  ) {
    const localRef = React.useRef<HTMLElement | null>(null)
    const composedRef = composeRefs<HTMLElement | null>(forwardedRef, localRef)

    // enable/disable pointer-event blocking as requested
    React.useEffect(() => {
      if (!disableOutsidePointerEvents) return
      enableScopedBlock(scopeId, scopeAttr, branchAttr)
      return () => disableScopedBlock(scopeId)
    }, [disableOutsidePointerEvents, scopeId, scopeAttr, branchAttr])

    // — Escape key
    React.useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Escape') return
        onEscapeKeyDown?.(e)
        if (e.defaultPrevented) return
        onDismiss?.()
      }
      window.addEventListener('keydown', onKeyDown, { capture: true })
      return () =>
        window.removeEventListener('keydown', onKeyDown, { capture: true })
    }, [onEscapeKeyDown, onDismiss])

    // — Pointer outside
    React.useEffect(() => {
      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as Element | null
        if (!target) return
        if (
          isInsideScoped(
            target,
            surfaceSelector,
            branchAttr,
            scopeAttr,
            scopeId,
          )
        )
          return

        const ce = makeCancelable(e, target)
        onPointerDownOutside?.(ce)
        onInteractOutside?.(ce)

        // When blocking outside pointers, cancel the actual event so the first click only dismisses.
        if (disableOutsidePointerEvents) {
          try {
            e.preventDefault()
          } catch {}
        }

        if (!ce.defaultPrevented) {
          onDismiss?.()
        }
      }
      window.addEventListener('pointerdown', onPointerDown, { capture: true })
      return () =>
        window.removeEventListener('pointerdown', onPointerDown, {
          capture: true,
        })
    }, [
      surfaceSelector,
      branchAttr,
      scopeAttr,
      scopeId,
      onPointerDownOutside,
      onInteractOutside,
      onDismiss,
      disableOutsidePointerEvents,
    ])

    // — Focus outside (keeps focus inside; prevents “escapes” by re-focusing the menu)
    React.useEffect(() => {
      const onFocusIn = (e: FocusEvent) => {
        const target = e.target as Element | null
        if (!target) return
        if (
          isInsideScoped(
            target,
            surfaceSelector,
            branchAttr,
            scopeAttr,
            scopeId,
          )
        )
          return

        const ce = makeCancelable(e, target)
        onFocusOutside?.(ce)
        onInteractOutside?.(ce)

        // Try pulling focus back into the nearest open surface
        try {
          const scopeRoot = document.querySelector<HTMLElement>(
            `[${scopeAttr}="${scopeId}"]`,
          )
          const getInScope = (sel: string) =>
            scopeRoot?.querySelector<HTMLElement>(sel) ?? null
          const surface =
            getInScope(`${surfaceSelector}[data-state="open"]`) ??
            getInScope(surfaceSelector)
          if (surface) {
            // Prefer your widgets (input/list) if available
            const input = surface.querySelector<HTMLElement>(
              '[data-action-menu-input]',
            )
            const list = surface.querySelector<HTMLElement>(
              '[data-action-menu-list]',
            )
            ;(input ?? list ?? surface).focus({ preventScroll: true })
          }
        } catch {}

        if (!ce.defaultPrevented) {
          onDismiss?.()
        }
      }
      window.addEventListener('focusin', onFocusIn, { capture: true })
      return () =>
        window.removeEventListener('focusin', onFocusIn, { capture: true })
    }, [
      surfaceSelector,
      branchAttr,
      scopeAttr,
      scopeId,
      onFocusOutside,
      onInteractOutside,
      onDismiss,
    ])

    // asChild support (like Radix): adopt the single child without extra wrapper
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>
      return React.cloneElement(child, {
        ref: composeRefs(child.props.ref, composedRef),
        [scopeAttr]: scopeId,
      })
    }

    return (
      <div ref={composedRef} {...({ [scopeAttr]: scopeId } as any)}>
        {children}
      </div>
    )
  },
)

/* ----------------------------------------------------------------------------------------------- */
/* Branch                                                                                          */
/* ----------------------------------------------------------------------------------------------- */

type InteractionGuardBranchProps = {
  asChild?: boolean
  children?: React.ReactNode
  /** Override attribute name if you customize in InteractionGuard props */
  attrName?: string // default: data-interaction-branch
  /** The scope id to tag this branch with */
  scopeId: string
}

/**
 * Marks a subtree as “inside” the guard without being a surface.
 * Use this around anchors/triggers (like DismissableLayer.Branch).
 */
function Branch({
  asChild,
  children,
  attrName,
  scopeId,
}: InteractionGuardBranchProps) {
  const name = attrName ?? 'data-interaction-branch'

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>
    return React.cloneElement(child, { [name]: scopeId })
  }
  return <span {...({ [name]: scopeId } as any)}>{children}</span>
}

export const InteractionGuard = { Root, Branch }
