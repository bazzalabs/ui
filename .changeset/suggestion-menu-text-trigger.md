---
'@bazza-ui/react': minor
---

Add `SuggestionMenu.attachTextTrigger(menu, field, { triggers })` and its React hook `SuggestionMenu.useTextTrigger(menu, { triggers })`, which make an `<input>` or `<textarea>` a suggestion menu host with no other code.

- Typing a trigger such as `@` opens the menu with the text after it as the query.
- The popup is anchored at the trigger character, laid out with the field's own font and wrapping, and it follows the field when it scrolls.
- Keys the menu uses are forwarded to it and go no further, so an app's own Enter handler doesn't also run.
- After Escape, or once a row is chosen, the menu stays closed until the trigger is typed again.
- A handle shared by several fields follows the one with focus.
- Each trigger can allow spaces, require the start of a line, or wait for a minimum query length.
- The payload is the match, with the `from`–`to` range to replace when a row is chosen. It's readable as `menu.payload`, alongside the new `menu.query`.
