---
'@bazza-ui/react': patch
---

Typing in a menu's `Input` now re-renders only the rows whose visibility changes. Every mounted item and separator used to re-render on each keystroke, even when it stayed visible or hidden. The store also gains `isItemVisible` and `hasSearch` selectors.
