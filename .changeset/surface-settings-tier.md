---
'@bazza-ui/react': patch
---

Menu parts read their menu's settings (`disabled`, selection, tab and positioning settings) from the menu itself instead of from `PopupMenuContext` and the `*StoreContext` contexts. Those contexts are still provided with the same values. If you render your own `PopupMenuContext.Provider` or `*StoreContext.Provider` inside a menu, your own code still reads its value, but it no longer changes how the menu's parts below it behave.
