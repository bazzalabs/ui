---
'@bazza-ui/react': minor
---

Calling `event.preventBaseUIHandler()` in your own event handler on a menu part now skips the part's own handling of that event, as it does on Base UI components. For example, an `Item`'s `onClick` that calls it doesn't select the item, and a `List`'s `onKeyDown` that calls it doesn't move the highlight. Called from a handler you pass to the part itself, it skips only the handlers on that element: the parts and Base UI components the event bubbles to still handle it. Called from a `render` element's handler, it works as it does with Base UI: the Base UI handlers above it are skipped too. It applies to the click, key, focus, blur, context menu and touch handlers, and to most pointer handlers, of the dropdown menu, context menu, command menu, suggestion menu, select and combobox parts. A disabled `LinkItem` still never follows its link. It doesn't apply yet to handlers whose part acts before yours runs:

- a row's `onPointerDown`, and the `onPointerDown` of `List`, `Surface`, `SubmenuTrigger`, `Combobox.Clear` and `Combobox.Icon`;
- `Popup`'s and `ScrollArrow`'s pointer enter, move and leave, and the popups' `onPointerDownCapture`;
- an `Input`'s `onKeyDown` for the Backspace that goes back a subpage.

`event.preventDefault()` keeps the effect it has today.
