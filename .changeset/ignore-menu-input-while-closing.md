---
'@bazza-ui/react': patch
---

While a menu animates closed, its `Input` and `List` ignore keys, so arrow keys and Enter no longer move the highlight or select a row in a menu that is already closing.
