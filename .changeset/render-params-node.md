---
'@bazza-ui/react': minor
---

Data-first render callbacks now receive the resolved `node` (`PopupMenuNode`) with its canonical `id`, `defPath`, and `parent`/`children` links. `renderNode` accepts resolved nodes or defs. Existing `{ props, context }` destructuring keeps working.
