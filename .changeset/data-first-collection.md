---
'@bazza-ui/react': patch
---

Data-first menus now hand their list the rows to show in one go, instead of every rendered row registering itself and being scored again. Typing in a data-first search re-renders only the rows whose output changes; a key that keeps every row re-renders none. In a 1,000-row data-first menu, the first key into an empty search goes from about 24 ms to about 7 ms, and the first key that narrows the list from about 20 ms to about 13 ms. When a search reorders rows that were already mounted, their `data-first` and `data-last` attributes now follow the new order.
