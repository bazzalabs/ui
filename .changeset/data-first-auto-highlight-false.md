---
'@bazza-ui/react': patch
---

`autoHighlightFirst={false}` now holds on a menu's first open; until now the first row was highlighted the first time the menu opened. Data-first surfaces (`content`) and surfaces with `orderedItems` also respect it after each search: they no longer highlight the first row, a highlighted row that is still listed stays highlighted, and one that is filtered out loses the highlight instead of passing it to the first row.
