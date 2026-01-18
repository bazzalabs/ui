---
"@bazza-ui/registry-filters": patch
---

Removed unnecessary `DropdownMenu.Trigger` wrapper inside `Filter.Trigger`; `DropdownMenu` already wraps its children with the trigger, so the double wrapper was throwing errors when used
