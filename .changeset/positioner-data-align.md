---
"@bazza-ui/react": patch
---

Menu positioners now always render `data-align`. Previously it was only present for `align="list-start"` on a horizontal side; `align="start"`, `"center"` and `"end"`, the defaults, and `list-start` on a vertical side rendered no `data-align` at all.
