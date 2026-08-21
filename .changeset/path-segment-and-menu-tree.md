---
'@bazza-ui/react': minor
---

**Breaking change.** `PopupMenuNode.segment` is now `PopupMenuNode.pathSegment`, a node's own component of its definition path; it equals the row id only when the def carries an explicit `id`. Custom `getRowId` implementations reading `node.segment` must update.

The internal directory rename (`resolve/` → `menu-tree/`) is not public surface — the `@bazza-ui/react/internal/popup-menu` barrel exports the same symbol names from the same subpath.
