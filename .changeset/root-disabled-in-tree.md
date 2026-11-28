---
'@bazza-ui/react': patch
---

A menu root's `setDisabled()` now takes effect at once: calling `setDisabled(true)` and then asking the root to open in the same handler is refused. Before, the open went through until the root rendered again.
