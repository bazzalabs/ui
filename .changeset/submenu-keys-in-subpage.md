---
'@bazza-ui/react': patch
---

ArrowLeft, Ctrl+H and Escape in a submenu opened from a subpage now act on the submenu instead of navigating the subpage behind it back a page, and Backspace in that submenu's `Input` (with `backspaceGoesBack`) no longer navigates the subpage behind it. When Escape in a submenu or subpage closes the whole menu, `onOpenChange` now reports the `'escape-key'` reason and the native `keydown` event instead of `'item-press'`. When `onOpenChange` cancels a close from Escape, an item press or an outside press the menu handles, or a controlled `open` prop keeps the menu open, open submenus and subpages now stay open and keep responding to the keyboard.
