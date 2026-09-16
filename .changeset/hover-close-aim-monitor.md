---
'@bazza-ui/react': patch
---

Fix hover-opened `DropdownMenu` and `Select` popups closing when the popup shrinks under a stationary pointer (for example while filtering with `DropdownMenu.Input`). Hover-close is now decided by the same trajectory-based Aim Monitor that submenus use: the popup stays open while the pointer is over it or aiming back at it, and closes (after `closeDelay`) when the pointer moves away. `onOpenChange` still receives `reason: 'trigger-hover'` with the originating `MouseEvent`, and `cancel()` is honoured.
