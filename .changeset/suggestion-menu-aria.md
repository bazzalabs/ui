---
'@bazza-ui/react': minor
---

`SuggestionMenu` gives the host input the right ARIA while open. An `<input>` becomes a combobox. A `<textarea>` or contenteditable keeps its textbox role and gets no `aria-expanded`. The host's own attributes come back when the menu closes. `aria-activedescendant` follows the highlight only after the user moves it with the keyboard, so screen readers keep reading what's typed. A status region announces the count of settled results and the row Enter would choose (for example "5 results, first: Alice Smith"); format it with the new `getAriaResultsText` prop.
