---
'@bazza-ui/react': minor
---

Add `debounce` to query loaders (`createQueryLoader`, `createSWRQueryLoader`, `createVanillaQueryLoader`). The loader receives the search only after it stops changing for that many milliseconds, and counts as fetching while it waits, so the menu doesn't show "no results" or treat the search as finished too early.
