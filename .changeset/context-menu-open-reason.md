---
'@bazza-ui/react': patch
---

`ContextMenu.Root` now calls `onOpenChange` with the `'trigger-context-menu'` reason and the native `contextmenu` or `touchstart` event when the menu opens from a right-click or long-press. It reported `'none'` with a placeholder event before.
