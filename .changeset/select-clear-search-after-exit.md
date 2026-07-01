---
"@bazza-ui/react": patch
---

Fix `Select` with `clearSearchOnClose="after-exit"` not clearing the search or deactivating a `hideUntilActive` input after the close animation, which left the search input visible on reopen.
