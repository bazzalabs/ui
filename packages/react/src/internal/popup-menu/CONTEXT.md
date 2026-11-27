# Popup Menu (data-first)

The data-first popup-menu system in `@bazza-ui/react`: consumers describe menu content as declarative node definitions; the library resolves them into menu nodes, then renders, filters, deep-searches, and identifies rows.

Where it lives:

- `packages/menu-core/src/tree/` — node def kinds, the Menu Node model and the resolver (identity, reconcile, graft), with no React
- `packages/menu-core/src/data/` — the pipeline over defs: browse, flatten, filtering/deep search, scoring, sorting, display, async helpers, with no React
- `packages/menu-core/src/collection/` — the Collection snapshot, its positions, and the Data adapter, with no React
- `packages/menu-core/src/elements/` — the Element Registry, with no React
- `packages/react/src/internal/popup-menu/menu-tree/` and `data-first/` — the React layer over those: React-typed defs and nodes, the list and subpages, async loaders; their pure modules re-export from `@bazza-ui/menu-core`
- `packages/react/src/internal/popup-menu/components/`, `contexts/`, `hooks/` — the JSX parts and their plumbing

## Language

**Node Def**:
A user-authored, declarative description of one menu entry (item, link item, checkbox item, radio item, checkbox group, submenu, subpage, tree item, group, separator). Plain data; never mutated by the library.
_Avoid_: node config, definition object

**Menu Node**:
The library-created, resolved instance of a node def — carries identity (resolved ID, definition key, definition path), tree links (parent, children), and a reference to its originating def. Exactly one per logical row per menu root, in every render context; created by resolution at the root, or by grafting. Surfaced to consumers as `Node` under each family namespace.
_Avoid_: resolved node (as a noun — "resolution" stays as the process), wrapper, instance
Submenu and subpage render callbacks receive only resolver-owned child Menu Nodes as `nodes`; authored fields are available through `child.def`.

**Menu Tree**:
The single tree of Menu Nodes owned by one menu root, and the `MenuTreeResolver` that maintains it. Created once per root; re-supplied content reconciles into it rather than rebuilding it.
_Avoid_: node graph, model

**Display Node**:
The render-scoped wrapper the pipeline builds from node defs for one surface's current render (filtering, scoring, grouping applied). Rebuilt per render; context-dependent.
_Avoid_: row wrapper

**Definition Key** (field: `definitionKey`):
A node's single definition-path component: its explicit id verbatim when present, otherwise its slugified value. Every Node Def must have an explicit or inferred key; empty keys are diagnosed in development. `idScope` controls whether keys must be unique across the whole `menu` root or only within each `surface` (the default).
_Avoid_: segment, slug, part

**Definition Path** (`definitionPath`):
The Definition Keys from the menu root to a node in the definition tree, including the node's own key. Only submenu and subpage ancestors contribute keys; Containers and tree items are surface-transparent. Identical wherever the node renders — browse, deep search, or recursion.
_Avoid_: absolute path, tree path, full path, ancestor path, segments

**Breadcrumbs**:
The branch nodes walked by the displaying surface to reach a row within its own render pass. Carries rich node references, not just segments.
_Avoid_: trail, crumb path

**Browse / Deep Search**:
The two render contexts: browsing renders each surface's own nodes in place; deep search flattens a subtree into the searching surface as deep results. A row's identity must not depend on which context displays it.

**Deep Search Inclusion** (`includeInDeepSearch`):
How a branch participates in an ancestor's deep search, resolved per branch from its def or the surface default. Three modes: **included** (trigger and descendants are deep results), **trigger-only** (only the trigger is), **excluded** (neither is). Orthogonal to `hidden`, which removes the branch from every render context.
_Avoid_: deep search mode, visibility, searchable

**Inherited Disabled**:
The disabled state a deep result carries from the nearest disabled branch on its breadcrumbs, as opposed to its own def's `disabled`. A row's effective disabled state is its own or an inherited one. Only branches confer it — tree items and Containers do not.
_Avoid_: propagated disabled, ancestor disabled, locked

**Resolved ID** (`id`):
The unique identity of a menu node — the value persistent state, registration, and highlight key off. Produced once per root by `getResolvedId`; the default is `definitionKey` for `idScope="menu"`, or a total UTF-16 code-unit encoding of every Definition Path entry joined with `/` for `idScope="surface"`. The encoder preserves ASCII letters, digits, `.`, `_`, `~`, and `-`, and encodes every other code unit as `%` plus four lowercase hexadecimal digits. IDs are opaque. `idScope` and the selected resolver are read once when the root resolver is created; later prop changes have no effect. Custom resolution replaces only final ID generation, while `idScope` still controls Definition Key validation. Separator definitions require an authored `id`.
_Avoid_: composite id, qualified id

**Unresolved Menu Node** (`UnresolvedMenuNode`):
The definitional menu-node facts passed to `getResolvedId` before the resolved ID is assigned.

**Graft**:
Resolution of node defs that arrive after mount (async loader results; render-time content) and attaching the resulting nodes under an already-resolved parent — the graft point — so they join the single resolved tree with correct lineage (definition path, Resolved ID).
_Avoid_: merge, inject, append

**Root**:
The menu's top-level surface — the one a popup opens with. Owns the Menu Tree but is not a Menu Node: its children are the tree's top-level nodes. Consequently it has no Resolved ID, no subpage identity, and no branch loader; the root surface's own async content is represented separately from branch loaders.
_Avoid_: root node, root page, `__root__`

**Branch**:
A submenu or subpage Menu Node — a node that opens a child surface. Only branches can own a branch loader or a subpage. Containers and tree items contain nodes but are not branches; they open no surface.
_Avoid_: container (that is a group, radio group or checkbox group), parent (as a category), async submenu (a branch may be static)

**Container**:
A group, radio group, or checkbox group: one concept with a `selection` mode — `'none'` (group), `'single'` (radio group), `'multiple'` (checkbox group). Users still author the `group`, `radio-group` and `checkbox-group` kinds. In `menu-core`, the resolver and the pipeline read each as a Container (`isContainerDef`, `containerOf`, `selectionOf`) and take one path for all three, so only the selection mode and its search behavior (`groupSearchBehavior`, `radioGroupSearchBehavior`, `checkboxGroupSearchBehavior`) tell them apart. The React data-first renderers still branch per kind until they move onto the row collection. A Container is not a Branch: it opens no surface and contributes no Definition Key to its rows' paths.
_Avoid_: group (as the category; a group is the `'none'` Container), branch, section

**Collection**:
A surface's immutable snapshot of its rows (`CollectionSnapshot`): every row it knows in order (`orderedIds`, rows a search hides included), which show (`visible`, `visibleContainers`), the visible enabled rows in navigation order (`navOrder`), a positional bitmask per visible row (`positions`, `Pos.First` … `Pos.LastContainer`), and search scores, which order rows but never hide one (`visible` alone decides what shows). Each item row carries what the store reads from an item's registration today: text, keywords, Container, `disabled`, `activatable`, `closeOnClick`, forced order and score, shortcut, and its kind (submenu trigger or not). Built by `buildSnapshot`; a change is a new snapshot with a higher `version`, and a build that changes nothing returns the previous one. Positions follow one rule set (`computePositions`): a Container's own row, separators, empty and loading rows count as rows outside any Container; disabled rows take positions though navigation skips them; group labels are not rows. One Collection per surface: it is to replace the store's `items`, `orderedRows`, `filteredItems`, `orderedItems` and `virtualItems`.
_Avoid_: row registry, item list

**Collection Adapter**:
How rows reach a surface's Collection, one per surface, chosen once: **DOM** (composable JSX rows register), **Data** (data-first Display Nodes, already filtered, scored and sorted by the pipeline; its rows never register, and it neither filters nor sorts again), or **Virtual** (an `items` array). A row a search hides stays in the Collection, only hidden: the Data adapter takes the surface's browse Display Nodes as well as the ones it shows, and keeps the rows the search leaves out. The data-first list passes it only the rows it shows, because rows a search hides unmount, so nothing reads them; once hidden rows stay mounted (UI-679), it needs to pass the browse Display Nodes again. Only the Data adapter exists so far (`dataSnapshotInput`, `buildDataSnapshot`).
_Avoid_: source, provider, registry

**Resolution**:
The phase that turns node defs into Menu Nodes in the Menu Tree: static content synchronously when the content is supplied; loader results by grafting after they arrive. The only phase permitted to mutate the Menu Tree.
_Avoid_: resolving (as a noun), reconciliation (reconcile is one operation inside resolution)

**Element Registry** (`ElementRegistry`):
The elements one menu tree renders, each registered by the part that renders it (trigger, positioner, popup, surface, backdrop) for as long as it's mounted, plus the root's exempt elements. One per root, kept by its Menu Tree Store and shared by its submenus. Whether a node belongs to the tree is read from it: `owns` for outside presses, `isExempt` for presses and focus moves that don't dismiss, `surfaceFor` / `popupFor` for the innermost popup holding a node (pointer ownership, the row-width target). A portaled submenu belongs because its elements registered; an element elsewhere on the page doesn't belong because of attributes it carries (`data-open`, `data-popup-open`, `data-base-ui-focusable`).
Two things opened from inside the tree belong too, as they did when membership was read from attributes. A **Nested Tree** (a select rendered inside a dropdown menu) links its registry into the outer tree's while it's open (`nest`), so the outer tree owns what it owns, at any depth. **Portaled content** a popup renders (a consumer's popover or tooltip opened from a menu item) sits outside every registered element in the DOM, but its presses pass through the popup in React's tree, and the popup **claims** them (`claim`, `claimed`); a press on a registered element is inside at once, and the root decides any other press once the event reaches its target, after those claims, or after the event when an ancestor stopped it on the way. The root sets the exempt elements on the registry on each render (`getExempt`).
_Avoid_: membership by attribute selector, inside-check

**Menu Tree Store** (`MenuTreeStore`):
The state one menu root shares with its submenus: the root's open state (one controlled cell, with how it was opened), the **Open Chain** (an `OpenChainStore`: the open submenu surfaces, outermost first), the **Focus Owner** (a `FocusOwnerStore`: the surface that owns focus, if any) and the tree's Element Registry. One per root. The root surface's Listbox store hands open changes to it, and the cell writes that store's open state, the only copy of it. `useOpenChain` and `useFocusOwner` return its Open Chain and Focus Owner, the same instances the root publishes. Every surface keeps its own search, highlight and rows. The resolver and the loaders are still separate.
_Avoid_: open chain store, focus owner store (as names for the tree itself)

**Listbox**:
The state layer beneath the engine: rows register into a `ListboxStore`, which owns highlight state and keyboard navigation. Implements the WAI-ARIA listbox pattern; shared by every menu family.
_Avoid_: list store, selection engine

## Removed vocabulary

These terms described the string-based identity model and no longer exist in the code. They appear here only so the names are not reintroduced with new meanings.

- **Row Id Strategy** (`rowIdStrategy`: `qualified` / `explicit` / `hybrid`) and `getQualifiedRowId` — superseded by the `getResolvedId` seam. `hybrid` has no successor: it made ids depend on render context, which the Menu Node model forbids by construction.
- **Row ID** / `getRowId` — replaced by Resolved ID / `getResolvedId`.
- **Segment** / `pathSegment` — replaced by Definition Key / `definitionKey`.
- **Display Path** (`displayPath`) — the segments of the submenus enclosing the surface a row was displayed in. Contextual by nature; deleted along with the strategy machinery that consumed it.
- **Identity Scheme** — any derivation of a row, page, loader, or deduplication key that bypasses the Menu Tree and recomputes identity from defs, values, or paths. Every scheme is replaced by the Resolved ID. Removed schemes: the subpage page ID (`getSubpagePageId`, `SubpageDef.pageId`), the async loader key (`getAsyncLoaderIdForBranch`), the deep-search dedup composite key, and the `__root__` sentinel (`ROOT_SUBPAGE_ID`).
- **Detached Node** — the placeholder produced when an out-of-tree def was passed to `renderNode`. Render callbacks now receive only Menu Nodes; the case is inexpressible.
- **Publication** — a token/withdrawal handoff of Menu Nodes between a root list and sibling subpages, prototyped in an abandoned branch. Never entered the glossary; recorded so the name is not reused.
