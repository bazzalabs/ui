---
'@bazza-ui/react': patch
---

Add an internal root-owned menu-tree resolver for data-first popup menus: node defs are resolved once per menu root into stable node instances, reconciled by id with a reference fast path, and late defs are grafted with correct lineage. Internal groundwork only — no public API or behavior change.
