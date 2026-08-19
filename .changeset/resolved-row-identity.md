---
'@bazza-ui/react': minor
---

**Breaking change.** Data-first row ids are now the canonical resolved ids (`getRowId`: explicit `id` verbatim, else the definition path). `getQualifiedRowId`, `rowIdStrategy`, and `GetQualifiedRowIdContext` are removed — use the `getRowId` prop on `Root`. The `hybrid` strategy has no successor: ids no longer depend on render context by construction.

Two id changes for un-customized menus: rows under a **subpage** now include the subpage's segment in their definition path; a **single def object reused under two parents** now resolves to one node (first occurrence). Persisted state keyed by old ids must migrate.
