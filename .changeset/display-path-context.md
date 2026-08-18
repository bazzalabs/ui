---
'@bazza-ui/react': patch
---

Thread the display path (the enclosing submenu chain of the surface a row is rendered in) across data-first surfaces, and expose two new optional fields on `GetQualifiedRowIdContext`: `displayPath` (contextual — where the row is displayed this render) and `defPath` (canonical — the row's full path in the definition tree, identical in browse and deep search). No behavior change; groundwork for stable row-id strategies.
