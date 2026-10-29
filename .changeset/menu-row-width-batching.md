---
'@bazza-ui/react': patch
---

Measuring row widths for `--row-width` now forces one layout per batch of rows instead of one per row. Each batch applies the measuring styles to every row, reads every width, then restores the styles. Measurement also no longer calls `getComputedStyle` for each row when its debug logging is off.
