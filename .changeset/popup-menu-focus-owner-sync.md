---
"@bazza-ui/react": patch
---

Focus ownership in dropdown-menu and context-menu now follows real DOM focus: focusing an element inside a menu surface makes that surface the focus owner, and auto-focus no longer steals focus that is already inside the surface.
