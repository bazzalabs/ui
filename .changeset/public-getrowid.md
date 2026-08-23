---
'@bazza-ui/react': minor
---

Add the `getRowId` prop to `DropdownMenu.Root`, `ContextMenu.Root`, and `CommandMenu.Root`. It receives the unidentified resolved node (definitional facts only); by default, explicit `id` is used verbatim, otherwise the definition path is used.

Export the `PopupMenuNode`, `GetRowIdFn`, and `UnidentifiedMenuNode` types, and deprecate `getNavigableIds` in favor of resolver nodes or `getOrderedItemIds`.

The new prop supersedes `getQualifiedRowId` and `rowIdStrategy`, which are removed by the accompanying identity swap in this same release.
