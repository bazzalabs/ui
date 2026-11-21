---
'@bazza-ui/react': patch
---

Menu rows look up their `data-first`, `data-last`, `data-first-group`, `data-last-group`, `data-first-in-group` and `data-last-in-group` state instead of scanning every mounted row. The positions are worked out once each time the row order changes, so a store update in a long menu no longer costs time proportional to the square of its row count.
