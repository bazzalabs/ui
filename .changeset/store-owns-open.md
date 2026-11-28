---
'@bazza-ui/react': patch
---

A menu's open state is its store's alone: a controlled `open` that the consumer applies on its next render, in a transition, or from an external store now behaves as an uncontrolled one does.

- A submenu with a controlled `open` (`DropdownMenu.Submenu`, `ContextMenu.Submenu`):
  - the pointer heading for it holds the aim guard while its prop follows, as it does for an uncontrolled submenu, instead of letting the rows it crosses take the highlight;
  - ArrowRight that opens it moves focus into it once it opens;
  - a change taken back before the prop arrives reaches `onOpenChange` (the pointer leaving after a hover asked to open it reports the close), so the submenu doesn't open after the pointer has gone;
  - a close the consumer hasn't applied leaves it open, as its prop says: a hover doesn't ask to open it again, and a sibling's highlight asks to close it again;
  - an open the consumer took but hasn't applied is taken back (`onOpenChange(false)`) when the pointer aiming at it moves on without reaching it, so a late prop doesn't open it beside another row.
- A controlled menu opened by touch (`Select`, `DropdownMenu`, `ContextMenu`, a submenu) records it when its prop applies the open, so `Select` anchors instead of aligning the selected item, and scroll arrows behave as they do for an uncontrolled one.
- A change Base UI started (Escape, an outside press, a trigger press) that doesn't go through, because the root's `onOpenChange` cancels it or the menu refuses it (a disabled menu, an exempt element), is canceled for Base UI too, which then skips its own handling of the event: Escape isn't `preventDefault()`ed.
- A `Combobox` close its consumer cancels no longer freezes the list's filtering.
- `onOpenChange` isn't called for a change that changes nothing (closing a menu that's closed, with nothing pending), or for the same change asked again in the same task or for the same event (two listeners of one key), as `SuggestionMenu` already did.
- A submenu's `suppressAutoOpenRef` set to `false` clears the suppression again. A write made while no trigger is mounted is kept for the trigger, and applies only if the trigger mounts highlighted, as before: one that mounts unhighlighted ends it, as losing the highlight does.
