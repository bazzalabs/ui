---
'@bazza-ui/react': minor
---

`SuggestionMenu` anchors the popup to the host's text. `anchor` is a function returning a `DOMRect`, measured again whenever the page or the field scrolls, so the popup follows the text. A new position is computed only when the rect changes, and returning `null` keeps the last position. `SuggestionMenu.Positioner` places the popup below and aligned to the start by default. If there's no room below, it opens above, and it stays on that side until it closes instead of flipping while the user types. It never moves beside the anchor, where it would cover the text.
