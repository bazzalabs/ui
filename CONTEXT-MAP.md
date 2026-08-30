# Context Map

## Contexts

- [Popup Menu](./packages/react/src/internal/popup-menu/CONTEXT.md) — the data-first popup-menu engine: node defs resolved into a menu tree, rendered, filtered, and deep-searched
- [React Components](./packages/react/CONTEXT.md) — the consumer-facing component library in `@bazza-ui/react`: families, parts, and the authoring vocabulary they share

## Relationships

- **React Components → Popup Menu**: the menu family's members (`dropdown-menu`, `context-menu`, `combobox`, `command-menu`, `select`) are consumer-facing shells over the internal popup-menu engine. Engine vocabulary (node def, menu node, graft) stays internal; only `Node` surfaces on each family's namespace.
- **Popup Menu borrows from React Components**: the anatomy and interaction vocabulary (surface, popup, submenu, subpage, focus zone, highlight) is defined in React Components — consumer language — and used freely in the engine context without redefinition.
