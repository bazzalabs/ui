---
'@bazza-ui/react': minor
---

Add `keepPreviousData` to `createVanillaQueryLoader`. When enabled, the last results stay on screen while the next search loads, reported as a background refetch so `Loading` doesn't flash. The vanilla query loader also reports a new search as loading from the first render after it changes, instead of one render later.
