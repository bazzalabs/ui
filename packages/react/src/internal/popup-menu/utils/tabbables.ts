const TABBABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]'

/**
 * Tabbable elements within (and including) a container, in DOM order.
 * Pragmatic v1: selector + tabIndex + disabled + hidden/inert ancestry.
 * Not full browser semantics (radio-group roving order, contenteditable,
 * disabled fieldsets are not modeled). jsdom-safe: no offsetParent checks.
 */
export function getTabbables(container: HTMLElement): HTMLElement[] {
  const descendants = Array.from(
    container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
  )
  const candidates = container.matches(TABBABLE_SELECTOR)
    ? [container, ...descendants]
    : descendants
  return candidates.filter(
    (el) =>
      el.tabIndex >= 0 &&
      !el.hasAttribute('disabled') &&
      !(el instanceof HTMLInputElement && el.type === 'hidden') &&
      el.closest('[hidden], [inert], [aria-hidden="true"]') === null,
  )
}
