---
'@bazza-ui/react': minor
---

Display rows now expose a resolved `PopupMenuNode` on `node`, including its canonical `id` and authored definition at `node.def`. Rows have a `kind: 'row'` discriminant, and `compositeId` is removed in favor of `node.id`.
