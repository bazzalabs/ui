---
'@bazza-ui/react': patch
---

`@bazza-ui/react` now declares `"sideEffects": false`: importing any of its modules does nothing outside it, so a bundler may drop the modules an app never uses. No module ran anything on import, so nothing changes at runtime.
