---
'@bazza-ui/react': patch
---

Duplicate row-id detection for data-first menus now runs at resolution time, in one place, covering the entire menu definition — including rows rendered through submenu `renderNode` recursion and branches that are not currently open, which the previous per-surface checks missed. The dev-only warning text changed accordingly. Detection now keys off the canonical resolved ids (explicit `id`, else the definition path); composite ids computed by a custom `getQualifiedRowId` or a non-default `rowIdStrategy` are no longer themselves inspected — collisions that exist only in those computed strings are not flagged, while canonical collisions are flagged regardless of strategy. Those APIs are superseded in the next breaking release.
