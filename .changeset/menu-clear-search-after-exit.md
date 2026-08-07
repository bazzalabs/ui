---
"@bazza-ui/react": patch
---

Default `clearSearchOnClose` to `'after-exit'` for ContextMenu, DropdownMenu, and Select surfaces so the search query clears after the exit animation instead of flashing the unfiltered list mid-close. Combobox keeps its previous default (`true`).
