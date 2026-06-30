---
"@bazza-ui/react": patch
---

`Select`: use standard anchored positioning for searchable popups. `alignItemWithTrigger` now applies only while no search input is present — a `Select.Input` (always-visible, or a `hideUntilActive` input once it activates) makes the popup fall back to anchored positioning, matching Base UI (Select aligns, Combobox anchors). Also stop recomputing the aligned placement when the visible item count changes while open.
