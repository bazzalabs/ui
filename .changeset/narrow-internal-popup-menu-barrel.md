---
'@bazza-ui/react': minor
---

Breaking change for direct consumers of the `@bazza-ui/react/internal/popup-menu` subpath: the barrel now exports only the surface consumed by the public menu families plus the resolved-node model (`PopupMenuNode`, `MenuTreeResolver`, `GetRowIdFn`, `defaultGetRowId`, `isPopupMenuNode`, …) and the deprecated navigation helpers. Roughly 110 previously re-exported symbols are gone — including most raw context objects and provider internals, un-prefixed data-attribute maps superseded by family-prefixed re-exports, deep-search scoring/traversal internals, aim-guard/mouse-trail/debug plumbing, tree and subpage internals, and several hook parameter/return types. If you imported one of these from the internal subpath, import the equivalent from the public family entries (`@bazza-ui/react/dropdown-menu`, …) instead, or treat it as internal.
