# Popup Menu (data-first)

The data-first popup-menu system in `@bazza-ui/react`: consumers describe menu content as declarative node definitions; the library resolves them into menu nodes, then renders, filters, deep-searches, and identifies rows.

Where it lives:

- `packages/menu-core/src/tree/` — node def kinds, the Menu Node model and the resolver (identity, reconcile, graft), with no React
- `packages/menu-core/src/data/` — the pipeline over defs: browse, flatten, filtering/deep search, scoring, sorting, display, async helpers, with no React
- `packages/menu-core/src/collection/` — the Collection snapshot, its positions, the adapters' framework-free parts (the Data adapter's input, the filtering the DOM and Virtual adapters share, the merge by document position), with no React
- `packages/menu-core/src/elements/` — the Element Registry, with no React
- `packages/menu-core/src/controllers/` and `platform/` — the Controllers (the Submenu Controller, the Aim Guard Controller) and the Clock they run on, with no React
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
A surface's immutable snapshot of its rows (`CollectionSnapshot`): every row it knows in order (`orderedIds`, rows a search hides included), which show (`visible`, `visibleContainers`), the visible enabled rows in navigation order (`navOrder`), a positional bitmask per visible row (`positions`, `Pos.First` … `Pos.LastContainer`), and search scores, which order rows but never hide one (`visible` alone decides what shows). Each item row carries what the store reads from an item's registration today: text, keywords, Container, `disabled`, `activatable`, `closeOnClick`, forced order and score, shortcut, and its kind (submenu trigger or not). Built by `buildSnapshot`; a change is a new snapshot with a higher `version`, and a build that changes nothing returns the previous one. Positions follow one rule set (`computePositions`): a Container's own row, separators, empty and loading rows count as rows outside any Container; disabled rows take positions though navigation skips them; group labels are not rows. One Collection per surface: the store keeps it, navigation reads its `navOrder` (`getVisibleItemIds()`), and `ListboxState`'s `filteredItems`, `visibleGroups` and `filteredCount` are derived from it. `items`, `virtualItems` and `orderedItems` are what the DOM and Virtual adapters build it from. Positional attributes still come from `orderedRows`, the rows that registered their element in document order, through `computePositions` too (`rowPositionBits` maps them to `RowMeta`): a row reads its edges as one `Pos` bitmask through the key selector `positionBits(id)`, and registers only while it shows, so the rows it leaves take its edges in the commit that hides it. Rows move to the Collection's `positions` once the store's state carries the Collection.
_Avoid_: row registry, item list

**Collection Adapter**:
How rows reach a surface's Collection, one per surface: **DOM** (composable JSX rows register, and the store scores them against the search; navigation orders them by document position, or by the consumer's `orderedItems` with `filter={false}`), **Data** (data-first Display Nodes, already filtered, scored and sorted by the pipeline; its rows never register but bind their element and part props, and it neither filters nor sorts again), or **Virtual** (a virtualized list's `items`, mounted or not, in their order, scored like the DOM adapter's). The store picks the adapter from what the surface has: a data-first list's rows, else a virtualized list's items, else the rows that registered. Rows that register inside a data-first list (a JSX `Item`, a `Separator` or `Group` part) go in among its rows by document position (`mergeByPosition`). A row a search hides stays in the Collection, only hidden: the DOM and Virtual adapters keep every registered row and item, and the Data adapter takes the surface's browse Display Nodes as well as the ones it shows. The data-first list passes it only the rows it shows, because rows a search hides unmount, so nothing reads them; once hidden rows stay mounted, it needs to pass the browse Display Nodes again. Framework-free parts: `dataSnapshotInput`, `buildDataSnapshot`, `filteredSnapshotInput`, `mergeByPosition`.
_Avoid_: source, provider, registry

**Key Selector**:
A selector a row or part reads by its own id, returning a primitive, so a store update re-renders only the rows whose answer changed: `isVisible(id)`, `positionBits(id)` (the row's edges as one `Pos` bitmask), `containerVisible(cid)` and `hasResults`. Module-level functions in `store/ListboxStore.ts`, read with `useStore(store, selector, id)` from `@base-ui/utils/store`; they're off the store's published selector map, whose `isFirst*` / `isLast*` entries read `positionBits` too.
_Avoid_: row selector, per-row subscription

**Resolution**:
The phase that turns node defs into Menu Nodes in the Menu Tree: static content synchronously when the content is supplied (with the results the surface's loaders already hold); loader results by grafting, in the Menu Tree Store update that records them. The only phase permitted to mutate the Menu Tree.
_Avoid_: resolving (as a noun), reconciliation (reconcile is one operation inside resolution)

**Element Registry** (`ElementRegistry`):
The elements one menu tree renders, each registered by the part that renders it (trigger, positioner, popup, surface, backdrop) for as long as it's mounted, plus the root's exempt elements. One per root, kept by its Menu Tree Store and shared by its submenus. Whether a node belongs to the tree is read from it: `owns` for outside presses, `isExempt` for presses and focus moves that don't dismiss, `surfaceFor` / `popupFor` for the innermost popup holding a node (pointer ownership, the row-width target). A portaled submenu belongs because its elements registered; an element elsewhere on the page doesn't belong because of attributes it carries (`data-open`, `data-popup-open`, `data-base-ui-focusable`).
Two things opened from inside the tree belong too, as they did when membership was read from attributes. A **Nested Tree** (a select rendered inside a dropdown menu) links its registry into the outer tree's while it's open (`nest`), so the outer tree owns what it owns, at any depth. **Portaled content** a popup renders (a consumer's popover or tooltip opened from a menu item) sits outside every registered element in the DOM, but its presses pass through the popup in React's tree, and the popup **claims** them (`claim`, `claimed`); a press on a registered element is inside at once, and the root decides any other press once the event reaches its target, after those claims, or after the event when an ancestor stopped it on the way. The root sets the exempt elements on the registry on each render (`getExempt`).
_Avoid_: membership by attribute selector, inside-check

**Menu Tree Store** (`MenuTreeStore`):
The state one menu root shares with its submenus: the root's open state (one controlled cell, with how it was opened), the **Open Chain** (an `OpenChainStore`: the open submenu surfaces, outermost first), the **Focus Owner** (a `FocusOwnerStore`: the surface that owns focus, if any) and the tree's Element Registry. One per root. The root surface's Listbox store hands open changes to it, and the cell writes that store's open state, the only copy of it. `useOpenChain` and `useFocusOwner` return its Open Chain and Focus Owner, the same instances the root publishes. Every surface keeps its own search, highlight and rows. It also owns the tree's resolver, the **Loader Scope** of each data surface, each popup's data-first state (its root data surface, the content its root list last resolved, and a slot a consumer set) and the tree's version, one number that changes with every graft or render-time change to the tree. Readers of the resolved tree read the nodes there, never from state a list lifts up: a data list renders its **Tree Slice**, and a popup's **Subpage Outlet** renders the subpages of the nodes its root list resolves. With the root's component name, debug flags (in a settings store), aim guard and focus zones it makes the **tree tier** (`MenuTreeTier`), which `MenuTreeContext` provides.
_Avoid_: open chain store, focus owner store (as names for the tree itself)

**Surface Tier** (`MenuSurfaceTier`):
What one surface's store shares with the parts that render for it, apart from its published contexts: one per surface store, made where the store is (a root's `PopupMenuProviders`, a `SubmenuRoot`, a `Subpage`) and provided with `SurfaceTierContext`, so a submenu's trigger, positioner and popup read it as its surface does. It holds the submenu the surface opens in (a `SubmenuHandle`, inherited by a subpage of the submenu; its open state and `closeRootOnEsc` are store state) and the surface's checkbox selection, made with the tier and claimed by each Surface that mounts: a new Surface starts it fresh, the same one shown again keeps it. Every field is set when the tier is made and never changes. A part finds the tier of the surface its row belongs to by that surface's store (`findSurfaceTier`), since a submenu trigger sits under its submenu's tier. The two tiers replace the component name, debug, aim guard, focus zone, submenu and checkbox selection contexts. What reaches only a Surface's or a List's children keeps its own provider: the Loader Scope (`LoaderScopeContext`) and a data-first list's rows (`CollectionRowsContext`).
_Avoid_: surface context (the published `SurfaceContext` is a separate, published object), branch context

**Loader Scope**:
One data surface's loaders, kept in its Menu Tree Store (`LoaderScope`): each branch loader by the branch's Resolved ID, the surface's own `asyncContent` loader, their errors and the root content's reveal state. The surface's coordinator (`useAsyncMenuCoordinator`) is derived from it, once per change for every reader, through the scope's handle (`LoaderScopeContext`, around the Surface's children only, so a JSX surface inside a data-first one reads its parent's and the popup's subpage outlet reads none). A scope lives while its Surface shows its content: a subpage that hides the Surface drops it, and the Surface starts a new one when it shows again. Its list registers a **grafter** with the store, so a result reaches the Menu Tree in the update that records it (`updateLoaders`), and every reader (the list's deep search, the popup's Subpage Outlet) renders the grafted nodes in one commit. The loaders' own state machine is still each loader component's.
_Avoid_: coordinator state, loader map

**Tree Slice**:
The part of the Menu Tree a data list renders: the root's nodes, its graft point's children, or its subpage branch's children. A new slice whenever those nodes change, or the list's own resolution changed a node under them while it rendered. A graft a store update makes changes neither: it comes with a new Loader Scope and a new tree version, so the list's derived state keys on the slice together with its coordinator, and the root list republishes its popup's slot on the tree version. Replaces the list's graft counter.
_Avoid_: graft version, resolved-nodes slot

**Subpage Outlet**:
What renders a popup's data-first subpages, once per popup, after its content (`DataSubpagesContent`). It reads `DataPopupContext`, which the popup derives from its menu tree (`DataPopupProvider`): the popup's root data surface, and a slot of the nodes its root list resolved, which the tree keeps while the list is unmounted (a subpage is active), or the slot a consumer set with `setResolvedNodes`. Content passed while the list is unmounted is resolved by the root surface itself (`useInactiveRootResolution`), with the list's own resolution (`resolveList`): with the root loader's rows the list last resolved (its Loader Scope is gone while it is unmounted) while the surface keeps the same `asyncContent` config, and keeping the rows loaders grafted under branches that are still there and keep the same `asyncNodes` (both compared by reference). A kept row whose id a branch's new static children already have (a loaded container merged into a local one) is left out, so ids stay unique. A new array of the same defs (a submenu's content on each parent render) is only recorded. So an open page stays open while its Resolved ID is still in the tree, a page a loader added included; a page whose id is gone leaves the outlet, and with it the subpage stack, which then shows the deepest page still there. One limit: in a submenu popup, the root list (still mounted) reconciles the submenu's branch first when the root content changes, so a page that another page's own loader added there (an open page's ancestor in the submenu) is lost, and the menu shows that ancestor. The root list republishes after every content change and every graft, which replaces a consumer's slot, as the list's publish always did. A slot derived from the tree is read from the tree as the outlet renders, after the root list resolved it in the same render; the tree's version is its `graftVersion`. A surface or list under a consumer's own `DataPopupContext.Provider` registers into that provider instead, and the root list publishes its nodes there after every content change and graft. The popup's record in the tree is dropped when the popup unmounts.
_Avoid_: data popup slot, lifting

**Controller**:
A headless state machine in `menu-core` for one interaction's timing and decisions: it takes events (`send`), decides through callbacks it was given, and reads time from an injected **Clock** (`now`, timers, animation frames; `realClock`, or `createFakeClock()` in tests), and the DOM through an interface the part supplies. The part that renders the interaction only binds it. Not a Handle: a Handle links a menu to code outside React; a Controller runs inside one part.
_Avoid_: manager, machine (bare), hook (the binding is a hook; the Controller isn't)

**Submenu Controller** (`SubmenuController`):
When a submenu opens and closes, one per submenu trigger. States: `idle`, `open-pending` (the hover or keyboard delay is running), `open`, `guarded` (the pointer left the trigger aiming at the popup; the aim guard holds its menu's highlight while the exit's moves are tracked), `close-pending` (the close delay is running; a move that aims at the popup again keeps it open). Events: the pointer entering, moving over and leaving the trigger, entering the popup, a press, a key that opens it, the trigger's highlight changing, a sibling's highlight, the trigger's menu closing, its open state changing elsewhere, the trigger hiding. It decides `onOpenChange(open, reason)` and `onHighlight()`; the trigger applies them as requests, with their reason, through the Close Policy and the consumer's `onOpenChange`, and `onOpenChange` returns whether the submenu is open afterwards, so a change a disabled submenu or a consumer refuses leaves the controller where the submenu is (a controlled `open` the consumer applies on its next render reads as refused until `open.change` reports it; interim, until UI-739). A hover that's refused asks once per gesture: not again until the pointer leaves, the trigger loses the highlight or hides, or the submenu opens. The aim guard it takes reads geometry only (no popup, inside it, or outside it with a hit and whether the pointer moved back); the controller decides what that means in each state, and tells the guard what to show on its debug overlay. Pressing the trigger to open or close it stays the popover trigger's; a press on the open trigger only stops the next highlight reopening it.
_Avoid_: submenu timer, hover intent

**Close Policy** (`decideOpenChange`):
What a menu tree does with an open change asked of its root, a submenu or a subpage: `allow` it (with the reason to report), `cancel` it, `redirect` it to close the whole tree from the root, or go `back` a subpage. Pure, in `menu-core`; the caller works out the facts. Rules: a disabled root ignores the user opening and closing it, a disabled submenu refuses to open (an `imperative-action` always passes); an outside press on an exempt element, or focus moving to one or to another popup of the tree, doesn't dismiss; a focus-out an outside press caused is reported as that press; Escape in a subpage goes back, or closes the tree with `closeRootOnEsc`; Escape in a submenu closes the tree unless `closeRootOnEsc` is off.
_Avoid_: dismiss logic, close handler

**Aim Guard Controller** (`AimGuardController`):
A menu tree's aim guard (K7), one per root, on its tree tier: while the pointer leaves a submenu trigger heading for the submenu's popup, the trigger **holds** the guard, and the other rows of its menu, at that depth only, don't take the pointer; it times out by itself and is released when the pointer reaches the popup. Each submenu trigger reads the pointer through its own **Aim Guard Trigger** (`AimGuardTrigger`, from `trigger()`), the aim guard its Submenu Controller takes: the geometry of the pointer leaving the trigger and moving on, against the rects the binding reads; the pointer's **trail** (its last four positions), recorded only while the trigger is hovered or tracking an exit, through one pointer listener for the tree; and the safe-triangle debug overlay, worked out only while something subscribes to it. A popup tells the guard when the pointer is over it (`pointerInPopup`), which releases a guard on the way there and tells the trigger that opens it.
_Avoid_: safe polygon (the geometry, not the guard), aim guard store

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
