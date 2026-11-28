---
'@bazza-ui/react': patch
---

Menu parts read which surface they're in, and queue their row width measurements, through the menu itself instead of `SurfaceContext`, `PopupSurfaceIdContext` and `RowWidthContext`. Those contexts are still provided with the same values. If you render your own `SurfaceContext.Provider` or `RowWidthContext.Provider` inside a menu, your own code still reads its value, but the menu's rows below it no longer register in its store or measure through it.
