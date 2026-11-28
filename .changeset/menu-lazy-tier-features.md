---
'@bazza-ui/react': patch
---

Menus build submenu aim guarding and checkbox range selection only when they use them, and members that never use them ship less code: `Select`, `Combobox` and `SuggestionMenu` are about 6 KB smaller (gzip), `CommandMenu` about 3 KB, and `DropdownMenu` and `ContextMenu` about 2 KB.

The root's `debug` prop (`showSafeTriangleArea`, `logAimGuardEvents`) now works in development builds only. A production build ignores it and leaves out the safe-triangle overlay and the aim guard's log lines.
