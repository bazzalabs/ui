---
'@bazza-ui/react': minor
---

Require resolver-owned Menu Nodes in submenu and subpage render callbacks.

Migration:

- Change authored property reads from `child.value` to `child.def.value`.
- Pass resolved callback children directly to `renderNode` and `DataSurface.content` instead of passing raw definitions.
- Callback `nodes` is a snapshot selected at invocation time, not a live collection; `asyncContent` remains the loader configuration.
