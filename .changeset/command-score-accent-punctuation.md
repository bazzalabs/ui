---
'@bazza-ui/react': patch
---

Fix a crash when a menu search contains `^`, a backtick, or already-decomposed accented text. `^` and backtick now match literally instead of being folded away; other diacritic folding is unchanged.
