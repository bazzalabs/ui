export const CLOSE_MENU_EVENT = 'actionmenu-close' as const
export const OPEN_SUB_EVENT = 'actionmenu-open-sub' as const
export const SELECT_ITEM_EVENT = 'actionmenu-select-item' as const
export const INPUT_VISIBILITY_CHANGE_EVENT =
  'actionmenu-input-visibility-change' as const

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
  const el = surface.querySelector<HTMLElement>(
    `[data-action-menu-item-id="${activeId}"]`,
  )
  if (el && el.dataset.subtrigger === 'true') {
    dispatch(el, OPEN_SUB_EVENT)
  }
}
