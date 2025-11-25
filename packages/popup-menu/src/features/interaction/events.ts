export const OPEN_SUB_EVENT = 'popupmenu-open-sub' as const
export const CLOSE_MENU_EVENT = 'popupmenu-close' as const
export const SELECT_ITEM_EVENT = 'bazza-ui:menu:item-select' as const
export const INPUT_VISIBILITY_CHANGE_EVENT =
  'popupmenu-input-visibility-change' as const

export function dispatch(node: HTMLElement | null | undefined, type: string) {
  if (!node) return
  node.dispatchEvent(new CustomEvent(type, { bubbles: true }))
}

export function openSubmenuForActive(
  activeId: string | null,
  surfaceId: string,
) {
  if (!activeId) return
  const surface = document.querySelector<HTMLElement>(
    `[data-surface-id="${surfaceId}"]`,
  )
  if (!surface) return
  const el = document.getElementById(activeId)
  if (el && el.dataset.subtrigger === 'true') {
    dispatch(el, OPEN_SUB_EVENT)
  }
}
