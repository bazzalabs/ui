---
'@bazza-ui/react': patch
---

Typing in a menu's `Input` now re-renders only the rows whose visibility changes, for rows passed to `List` as JSX children. Every mounted item and separator used to re-render on each keystroke, even when it stayed visible or hidden. Data-first lists, and `List` children passed as a function, still re-render their visible rows on each keystroke. The store also gains `isItemVisible` and `hasSearch` selectors.
