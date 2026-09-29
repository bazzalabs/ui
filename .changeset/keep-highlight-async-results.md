---
'@bazza-ui/react': patch
---

Data-first menus keep the highlighted row when their rows change without the search changing, for example when async results arrive or a loader refetches. The highlight still moves to the first row when the search changes, or when the highlighted row disappears or becomes disabled.
