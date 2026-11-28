---
'@bazza-ui/react': patch
---

A dropdown menu, context menu, command menu, suggestion menu, select or combobox popup with no exit animation now finishes closing in the frame it closes when the keyboard, an item press or your code closes it: `onOpenChangeComplete(false)` runs before the next paint, and the closed popup is never painted. Before, it stayed on screen, closed, for one more frame. A popup that closes with its submenus reports each one's close, the submenus first. When another popup closes with it (another menu, a popover), every close finishes a frame later, as before, inner ones first. A close a press makes (outside the popup, on the command menu's backdrop, or in your own `onPointerDown`) still finishes a frame later, as before, so focus returns where it did. A popup with an exit animation still finishes closing when the animation ends.
