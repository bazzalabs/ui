---
'@bazza-ui/react': minor
---

`SuggestionMenu` handles the keyboard from the host input. Pass key presses to `handle.handleKeyDown(event)`: while the menu is open, ↑/↓, Ctrl+N/P and Home/End move the highlight, Enter chooses the highlighted row, and Escape closes the menu without closing an enclosing dialog. It returns `true` when the menu used the key. Tab, caret keys, typing, modified keys and keys pressed during IME composition stay with the input. The menu closes when the input loses focus, but not when focus moves into the menu or the window loses focus, and pressing inside the menu keeps focus in the input.
