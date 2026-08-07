---
"@bazza-ui/react": minor
---

Add `data-first` and `data-last` attributes to the menu `GroupLabel` part, marking a label that is the first or last row in the list. `data-first` resolves from `GroupValue` `positional.first` with a fallback to the store's row order, so it stays correct in virtualized lists where DOM order doesn't match list order. `data-last` comes only from `positional.last`, since the store can only report whether the *group* is the last row and a label is always followed by its own items.
