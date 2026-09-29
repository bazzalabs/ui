---
'@bazza-ui/react': minor
---

Add `noResults` to `SuggestionMenu.Root`. With `'empty'` (the default) the menu stays open and shows `Empty` when nothing matches, and Enter reaches the host input. With `'close'` the menu closes once every search for the query has finished empty (reason `'no-results'`), before the empty popup is painted. An `update()` with the same query leaves it closed, for example when only the caret moved. An `update()` with any other query searches again. `SuggestionMenu.useAsyncMenuCoordinator` is available for showing a "searching…" indicator while results refetch.
