---
'@bazza-ui/react': patch
---

Rows that mount together are now sorted once, and items that mount together are re-scored once, instead of once per row or item. Opening a long menu, or clearing a search that brings hundreds of rows back, used to take hundreds of milliseconds.

Which item is highlighted changes in two cases:

- With `filter={false}`, items that mount together highlight the first of them in `orderedItems`, not the first to register.
- When the highlighted item registers again in one commit, for example because its `shortcut` or `keywords` changed, it stays highlighted. The highlight used to move to the first row.

For direct users of the store (`DropdownMenuStore`, `ContextMenuStore`, `SelectStore`, `ComboboxStore`): `registerRow` and `registerItem` no longer update `state.orderedRows`, `state.filteredItems`, `state.filteredCount` or `state.highlightedId` right away. They publish at the next `flushPendingRegistrations()`, which the list calls from a layout effect, or in a microtask at the latest. `getVisibleItemIds()` and `selectByShortcut()` flush first. The store state gains a `registrationBatch` counter that re-renders the list when rows or items register outside its own commit.
