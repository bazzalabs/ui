# React Components

The consumer-facing component library: `@bazza-ui/react` exports unstyled primitives; the registry distributes their styled counterparts. Both are components — the axis is styled vs primitive, not component vs primitive.

All terms are common nouns: sentence case in prose ("the composable API", "a subpage"), capitalized only where English demands it or when naming a part (`DropdownMenu.Subpage`).

## Language

**Primitive**:
An unstyled compound component exported from `@bazza-ui/react` (e.g. `DropdownMenu`), composed of parts under one namespace.
_Avoid_: unstyled component, headless component, base component

**Family**:
A category of related library offerings. The **menu family** is the set backed by the popup-menu engine: dropdown-menu, context-menu, combobox, command-menu, select — each a **member** of the family. "Member" is relational only, never a label: refer to a member by its proper name ("the dropdown menu", "the dropdown menu docs"), not "the dropdown-menu member".
_Avoid_: suite, cluster, category; "the dropdown-menu family" (a family is the group, not one member)

**Highlight**:
The single visually-emphasized row of a popup — what arrow keys move and `data-highlighted` styles. Distinct from DOM focus (which stays on the input, trigger, or a focus zone; highlight is virtual — DOM focus never moves to rows) and from selection (checked/chosen state).
_Avoid_: active item, focused item

**Focus Zone**:
A region of a surface, registered with it, that participates in tab navigation — Tab moves real DOM focus through its interactive content. Arrow-key navigation and highlight remain the listbox's job; a focus zone is where DOM focus is allowed to go inside the popup.
_Avoid_: focus trap, focus region, tab group

**Composable API**:
Authoring menu content by composing parts directly as JSX (`<DropdownMenu.Item>` inside `<DropdownMenu.List>`). The substrate API: even data-first render functions bottom out in composable parts.
_Avoid_: compositional API, JSX API, manual API

**Data-first API**:
Authoring menu content as node defs — plain data the engine resolves, filters, and deep-searches — with render functions for presentation. Layered on the composable API; scoped to content (rows), while scaffolding parts (surface, input, list) stay composable.
_Avoid_: node API, data API, declarative API (both APIs are declarative)

**Loader**:
A source of node defs fetched after mount, created via a loader factory; results graft under the loader's parent node. Two kinds: a **static loader** fetches once; a **query loader** fetches per search query. The loader concept is agnostic to any data-fetching solution.
_Avoid_: fetcher, data source, async source

**Adapter**:
The binding that lets a data-fetching solution drive the loader pattern. Vanilla, SWR, and TanStack Query adapters ship in the package; consumers can write their own.
_Avoid_: integration, plugin, connector

**Part**:
One renderable component exported on a primitive's namespace, addressed as `Primitive.PartName` (e.g. `DropdownMenu.Trigger`). Surfaced types on the namespace (e.g. `DropdownMenu.Node`) are namespace exports, not parts — parts render.
_Avoid_: subcomponent, piece, element

**Submenu**:
A nested menu that opens in its own floating popup alongside its parent; the parent stays visible. Spatial nesting. Deep search flattens across submenu boundaries the same as subpage boundaries.
_Avoid_: nested menu, child menu, flyout

**Subpage**:
A drill-in navigation that renders a sibling surface inside the same popup, with a back affordance; the parent surface is hidden until navigated back. Temporal nesting.
_Avoid_: page, drill-down, nested view

**Surface**:
One self-contained menu pane: a list of items plus optionally an input, header, footer, and focus zone. A popup contains one or more surfaces — the root surface and one sibling surface per open subpage.
_Avoid_: panel, pane, view

**Popup**:
The floating container a positioner places on screen; wraps its surfaces. Each menu level that floats independently — the root, and each open submenu — is its own popup.
_Avoid_: popover (for menus), overlay, floating panel

**Styled Component**:
The styled, copy-paste counterpart of a primitive, distributed via the registry (`registry/ui/`). No relation to the `styled-components` library.
_Avoid_: ui component, pre-styled component, component (bare — "component" alone means any React component and never disambiguates styled from primitive)

**Registry**:
The copy-paste distribution channel served by the web app: styled components, examples, and blocks.
_Avoid_: component library (that's the npm package), template gallery

**Example**:
A runnable demo — of a primitive or of a styled component — embedded in the docs page it belongs to.
_Avoid_: demo, snippet, recipe

**Block**:
A larger composed unit in the registry: a whole feature composition (e.g. `filters-01`) rather than one component.
_Avoid_: template, section
