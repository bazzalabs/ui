---
'@bazza-ui/react': minor
---

Add `SuggestionMenu` (`@bazza-ui/react/suggestion-menu`), a menu for `/` commands, `@` mentions and `:` emoji typed into an editor or text field. A handle created with `SuggestionMenu.createHandle()` connects the menu to its host input: the host attaches itself with `attach()`, opens or updates the menu with `update({ query, anchor, payload })` and closes it with `close()`, including from non-React editor code. DOM focus stays in the host input, the menu is never modal, and pressing the host input doesn't dismiss it.
