---
'@bazza-ui/react': patch
---

Menus with a value for `autoHighlightFirst` (such as a `Select` highlighting its selected value) no longer move the highlight back to that row when they re-render with a new `onHighlightChange` function, a new `items` or `virtualItems` array, or another setting that changes identity on every render. The row is highlighted when the menu opens, or when its rows first arrive (for example `virtualItems` loaded after the menu opened), and when `autoHighlightFirst` changes; in between, the highlight stays where the keyboard or pointer moved it. A menu whose popup stays mounted while closed now highlights the row again each time it opens, and a value for `autoHighlightFirst` on a subpage's surface now highlights its row when the subpage opens.
