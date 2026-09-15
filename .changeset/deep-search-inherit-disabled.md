---
'@bazza-ui/react': patch
---

Fix deep search surfacing descendants of a `disabled` submenu or subpage as enabled, selectable rows. A deep-search result now inherits `disabled` from its nearest disabled submenu/subpage ancestor, so it renders disabled, is skipped by keyboard navigation, and does not fire `onSelect` — matching the branch's own behaviour under pointer and keyboard navigation.
