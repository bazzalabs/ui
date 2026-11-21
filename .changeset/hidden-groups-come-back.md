---
'@bazza-ui/react': patch
---

Fix menu groups that a search hid staying hidden when a later search matched their items. Typing "audi" and then replacing it with "apple" now shows the Fruits group with Apple, instead of no rows. A group around a `RadioGroup` or `CheckboxGroup` now shows when a search matches an item inside it, instead of hiding along with it.

A `Group`, `RadioGroup` or `CheckboxGroup` hidden by a search now stays in the DOM, empty, with the `hidden` attribute, `display: none` and (on `Group`) `data-hidden`, so its items are still searched. Styles that pick the first group with `:first-child` will now match the hidden group; use `[data-first]` (or `[data-first-group]`) instead.
