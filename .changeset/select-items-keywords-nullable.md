---
"@bazza-ui/react": patch
---

Extend the `items` prop on `Select.Root` and `Combobox.Root`. The array form now accepts `keywords` (extra filter terms merged into an item's search keywords) and a `null` value, e.g. `{ value: null, label: 'Select…' }`. Item keyword auto-population reads `items[].keywords`, so you no longer need a separate per-`Item` `keywords` prop when you already describe items via `items`.
