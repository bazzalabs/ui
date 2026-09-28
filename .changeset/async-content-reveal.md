---
'@bazza-ui/react': minor
---

Add `asyncContentReveal` to data-first surfaces. `'stream'` (the default) shows rows from `asyncContent` as soon as they load. `'block'` waits until the loader has finished for the current search and then shows everything at once; while a new search loads, the previous list stays on screen unchanged, without the loading state. `Empty` now waits until the surface's `asyncContent` has finished for the current search, so "no results" no longer shows while a refetch still holds the previous search's rows.
