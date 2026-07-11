---
"@bazza-ui/react": patch
---

`Select` now closes on trigger press-down (`pointerdown`) instead of waiting for a full click, matching `DropdownMenu`. `Select.Root` also accepts a `closeOnOutsidePress` prop (`'pointerdown'` default, or `'click'`) for parity with the other menu roots.
