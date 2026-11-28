---
'@bazza-ui/react': patch
---

Fix several submenu timing cases:

- Moving the pointer off a closed submenu trigger no longer starts a close timer that could close a submenu you then opened with ArrowRight.
- ArrowRight during a submenu's close delay now cancels the close.
- A submenu whose popup stays mounted while closed (`keepMounted`, or an exit animation) no longer reopens when the pointer later moves toward it.
- Moving back onto an open submenu trigger no longer starts an open timer that could reopen a submenu you had just closed with a press.
- With `openOnHighlight` off, aiming back at a submenu's popup during its close delay now cancels the close.
- ArrowRight on a submenu held closed by a controlled `open` no longer moves keyboard focus into it, so arrow keys keep working in the parent menu.
