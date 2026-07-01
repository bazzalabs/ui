---
"@bazza-ui/react": minor
---

Filtering is now diacritics-insensitive by default across all listbox-based components (Select, Combobox, menus). Unaccented queries match accented content and vice versa (e.g. `cafe` matches `café`, `sao` matches `São Paulo`). To opt out, pass a custom `filter`/`normalizeSearch` on `Select.Surface`.
