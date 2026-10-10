---
'@bazza-ui/react': patch
---

Moving the pointer from a submenu trigger toward its submenu no longer re-renders every row in the menu. Rows used to re-render each time the aim guard turned on or off, though only submenu triggers render from it.
