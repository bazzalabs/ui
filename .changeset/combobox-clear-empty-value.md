---
'@bazza-ui/react': patch
---

`Combobox.Clear` is now hidden (or disabled, with `keepMounted`) when a single-value combobox has no selection. It treated the empty `null` value as a selection before.
