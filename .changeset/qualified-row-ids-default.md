---
'@bazza-ui/react': minor
---

**Behavior change:** data-first row ids now default to the `'qualified'` strategy. Rows without an explicit `id` are identified by their full path in the menu definition — ancestor branch segments (submenus and tree items) plus their slugified value — in both browse and deep-search contexts (previously the path was included only during deep search, so the same row had two different ids). Rows with an explicit `id` are unaffected. Set `rowIdStrategy="hybrid"` on `Root` or the data `Surface` to restore the legacy behavior.
