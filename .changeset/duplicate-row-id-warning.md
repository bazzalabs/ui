---
'@bazza-ui/react': patch
---

Warn in development when two data-first rows compute the same row id, within one surface or across surfaces of the same menu. Duplicate ids silently share highlight and keyboard-navigation identity; the warning names the offending id. No production impact.
