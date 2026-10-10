---
'@bazza-ui/react': patch
---

A menu with a submenu no longer listens to every pointer move on the page while it's open. The pointer trail used to aim at a submenu is now recorded only while a submenu trigger is hovered, and while the pointer is on its way from the trigger to the submenu. Aim guard trace details are also no longer built on each pointer move unless `logAimGuardEvents` is on.
