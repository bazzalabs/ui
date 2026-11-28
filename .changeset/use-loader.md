---
'@bazza-ui/react': minor
---

Add `useLoader` to `DropdownMenu`, `ContextMenu`, `CommandMenu` and `SuggestionMenu`, for reading where a data-first loader stands as one status. Call it inside a data-first `Surface`: with no argument it follows the surface's own `asyncContent`, and with a branch's `node.id` it follows the loader that branch runs for deep search. It returns a `LoaderState`: `idle`, `debouncing` (a new search waits out the loader's `debounce`), `loading`, `refreshing` (loading while it still shows earlier rows), `settled` or `error`, each but `idle` with the `token` of the query it answers. It re-renders only when that loader's state changes, and returns `idle` outside a data-first `Surface`. The `LoaderState` and `QueryToken` types are exported too.

The deprecated `AsyncState` booleans (`useDataList().async.isLoading` and the rest) now say what to use instead: `useLoader` for one loader's status, and the matching flag on `useAsyncMenuCoordinator()` (`isAnyLoading`, `isAnyFetching`, `isQueryLoading`, …) for the aggregate across loaders.
