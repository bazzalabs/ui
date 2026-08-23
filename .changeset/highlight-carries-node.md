---
'@bazza-ui/react': minor
---

**Breaking change.** `onHighlightChange` on `DropdownMenu.Root`, `ContextMenu.Root`, and `Submenu` is now `(id, node, index, eventDetails)` — `id` remains first for both JSX and data-first rows, while `node` is second as nullable enrichment. `node` is the resolved menu node carrying the highlighted id, looked up in the menu's data-first tree (`null` when the highlight clears or when no data-first node carries that id — e.g. JSX-defined rows; a JSX row that deliberately shares an id with a data-first node yields that node). `Select`/`Combobox` signatures are unchanged. Migration: `(id, index) => …` → `(id, node, index) => …`.
