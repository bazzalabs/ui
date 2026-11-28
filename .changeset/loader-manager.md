---
'@bazza-ui/react': patch
---

A data-first menu's loaders now hear a new search in the same update as its rows. While a query loader waits out its `debounce`, `useDataList().async` and `useAsyncMenuCoordinator()` report it as fetching from the render that shows the new search, instead of one render later, and typing during the wait takes one render per key. Vanilla, SWR and TanStack Query loaders, and custom `Loader` components, report the same results as before.

The booleans on `AsyncState` (`useDataList().async`: `isLoading`, `isFetching`, `isInitialLoading`, `isRefetching`, `isAllRefetching`, and the `isStatic*` and `isQuery*` flags) are deprecated. They keep their values for one more release, while each loader's state becomes one status: idle, debouncing, loading, refreshing, settled or error. `skippedMenus` isn't deprecated.

Two coordinator details change (`useAsyncMenuCoordinator()`):

- `setRootReveal` still replaces the reveal until the root list publishes its own again, but `settled: true` no longer reveals results while the root loader is still loading the search: `rootReveal.settled` is only true while the menu's loaders say the root loader has settled too.
- Each entry of `loaders` (and `root`) carries the loader's current `config`, not the one it had when it first reported.
