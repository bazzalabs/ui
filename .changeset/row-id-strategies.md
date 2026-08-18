---
'@bazza-ui/react': minor
---

Add the `rowIdStrategy` prop (`'qualified' | 'explicit' | 'hybrid'`) to `DropdownMenu.Root`, `ContextMenu.Root`, and data surfaces for choosing how data-first row ids are computed. `'qualified'` produces context-independent ids; `'hybrid'` (the current default) is unchanged legacy behavior. A `getQualifiedRowId` function still takes precedence, and now also applies to rows rendered through submenu `renderNode` recursion (previously those rows fell back to raw `node.id ?? node.value` regardless of configuration).
