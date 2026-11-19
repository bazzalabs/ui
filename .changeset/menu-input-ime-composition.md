---
'@bazza-ui/react': patch
---

A menu `Input` now waits for IME composition to finish before it filters. While you compose Chinese, Japanese or Korean text, the input shows the composing text, and the search, `onValueChange` and `onSearchChange` get the committed text once, when the composition ends. Typing or composing while the menu animates closed no longer changes the search or the text the `Input` shows.
