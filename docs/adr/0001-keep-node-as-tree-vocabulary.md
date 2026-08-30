# Keep "node" as the menu-tree vocabulary despite the ReactNode collision

The popup-menu engine's public vocabulary (`NodeDef`, `renderNode`, `Node` on all five menu-family namespaces) uses "node", which collides with `React.ReactNode`, DOM `Node`, and Node.js. We considered renaming during the 2026-08 vocabulary session and decided to keep "node": the engine is a tree, and its surrounding vocabulary — menu tree, graft, definition path, parent/children — only reads correctly with tree terminology. In practice the term is almost always qualified ("node def", "menu node"), which defuses the collision.

## Considered Options

- **entry** — "menu entry" reads well for items, but "grafting entries" and "entry tree" lose the tree precision, and groups containing entries stop sounding like a tree.
- **row** — already taken with a narrower meaning (row id = identity of one displayable line); a group is not a row, it contains rows. Merging would blur a distinction the identity model depends on.
- **item / option / command / element** — each collides with an existing part name, a single family's connotation, or React's own vocabulary.

Renaming touches public API across five namespaces, so reversing this later is expensive — do not reintroduce the debate without new evidence of real-world confusion.
