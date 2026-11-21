---
'@bazza-ui/react': patch
---

A menu with a submenu no longer listens to every pointer move on the page while it's open. The pointer trail used to aim at a submenu is now recorded only while a submenu trigger is hovered, and while the pointer is on its way from the trigger to the submenu. Whether the pointer is heading for the submenu is now judged from its path across the trigger, not from its last few positions anywhere on the page. When a fast pass records only one position inside the trigger, the point where the pointer left is used as the second. When a trigger scrolls past a pointer that didn't move over it, its submenu now closes instead of staying open. Aim guard trace details are also no longer built on each pointer move unless `logAimGuardEvents` is on.
