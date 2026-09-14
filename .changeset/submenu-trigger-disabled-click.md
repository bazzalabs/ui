---
'@bazza-ui/react': patch
---

Fix `SubmenuTrigger` still opening its submenu on a raw click when `disabled`. The `disabled` state is now forwarded to the underlying `Popover.Trigger` so Base UI's click guard applies.
