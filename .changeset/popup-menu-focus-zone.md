---
"@bazza-ui/react": minor
---

Add the `FocusZone` part to dropdown-menu and context-menu. Wrapping tabbable content (footers, toolbars, forms) in `FocusZone` makes Tab/Shift+Tab cycle focus within the menu surface (input → list → zone content → wrap) instead of closing the menu. Menus without zones keep the explicit Tab-close behavior.
