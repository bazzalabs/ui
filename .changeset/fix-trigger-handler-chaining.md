---
"@bazza-ui/react": patch
---

Consumer event handlers on `DropdownMenu.Trigger` and `Select.Trigger` now chain with internal handlers instead of replacing them. Opt out of the internal behavior with `event.preventBaseUIHandler()`.
