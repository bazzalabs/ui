---
'@bazza-ui/react': patch
---

A submenu no longer closes under the pointer when the pointer enters its popup during the close delay without moving. An `onPointerEnter` or `onPointerMove` passed to a submenu's `Popup` no longer replaces the menu's own handling: the submenu still notices the pointer arriving, the rows of the parent menu stop being held for the aim guard, and your handler runs once after it. When the pointer turns back toward a submenu that is about to close, or misses it while aiming, the time it has to reach the popup now starts again.
