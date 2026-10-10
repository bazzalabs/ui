---
'@bazza-ui/react': patch
---

Rows that mount together are now sorted once, and items that mount together are re-scored once, instead of once per row or item. Opening a long menu, or clearing a search that brings hundreds of rows back, used to take hundreds of milliseconds. `registerRow` and `registerItem` now publish at the next `flushPendingRegistrations()`, which the list calls from a layout effect; the store state gains a `registrationBatch` counter that re-renders the list when rows or items register outside its own commit.
