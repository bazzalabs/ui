---
"@bazza-ui/react": patch
---

`DropdownMenu.Trigger`'s hover `delay` now defaults to 100ms at runtime, as documented. Previously the prop was forwarded as `undefined`, so Base UI's 300ms default applied.
