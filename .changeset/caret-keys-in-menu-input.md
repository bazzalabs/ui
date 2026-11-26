---
'@bazza-ui/react': patch
---

A menu `Input` with text now keeps Home, End, ArrowLeft and ArrowRight for moving the cursor, Shift with Home, End, ArrowLeft or ArrowRight for selecting text, and Alt or Meta with an arrow key for jumping by word or line, instead of moving the highlight, closing a submenu or going back a subpage. ArrowRight still opens a highlighted submenu trigger, and Shift+ArrowUp and Shift+ArrowDown still start a keyboard drag selection of checkbox items. An empty `Input` behaves as before, and Ctrl+N, Ctrl+P, Ctrl+H and Ctrl+L still navigate.
