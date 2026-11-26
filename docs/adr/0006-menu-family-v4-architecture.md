# The menu family's engine is rebuilt in layers, one layer at a time

The engine behind the menu family (`internal/popup-menu` and `internal/listbox`) grew one feature at a time: submenus, subpages, data-first content, deep search, async loaders, virtualization, checkbox range and drag selection, `CommandMenu` and `SuggestionMenu`. Each fit, but the result has three ways for rows to reach the list, about nine places that hold state, around twenty React contexts above a submenu row, and engine code that imports from a member. We rebuild it in four layers, with imports only going down:

1. **A framework-free core** (`packages/menu-core`, private, bundled into `@bazza-ui/react`): the menu tree and data pipeline, a **row collection** per surface (which rows exist, which are visible, their order and positions), headless controllers for submenu timing, the aim guard, close decisions, loader status and checkbox range selection, and, last, placement on `@floating-ui/dom`.
2. **Two stores** on `@base-ui/utils/store`: one per menu tree (open state, open chain, focus owner, registered elements, resolved tree, loaders) and one per surface (search, collection, highlight, checked state). A controlled value lives in one cell. Rows subscribe by key to a boolean or a number, so a row re-renders only when something about that row changes.
3. **Engine parts** over one overlay shell with three kinds, `popover`, `dialog` and `anchored`, which owns close-complete work and the subpage outlet once. One helper composes consumer and engine event handlers in a fixed order. Select and Combobox share their value-selection logic.
4. **The six members** as thin setup over the shell and stores.

The shell runs on Base UI's Popover and Dialog first, then on our own popup layer, after which the menu family no longer depends on Base UI.

Rows from JSX, data-first content and virtualized lists all reach the list through the row collection, and a data-first row only attaches its element: it never registers a second time. Filtered rows keep their place in the collection, so a group hidden by one search can't drop its rows from the next.

The public API stays as it is, with three exceptions: data-first default group renders follow ADR-0005 (no `role="group"` wrappers), a submenu's `onOpenChange` reports every change with a reason, and the overlapping async loading flags give way to one loader status (kept for a release). `aria-activedescendant` keeps pointing at value-based row ids. The `internal/popup-menu` and `internal/listbox` entry points stay.

## Considered Options

- **Keep the current engine and keep patching it**: the perf work in #582–#596 showed most slow paths can be fixed in place, but each fix had to work around the same three row paths and nine state holders, and the next feature would add a tenth.
- **Build the menus on UI SDK (`@ui-sdk/core`) as their runtime**: a spike rebuilt four members on it. Once the perf work had landed, it was about as fast, slower on data-first search and large opens, and its bundle was 19–80% bigger. Its positioning couldn't do several things our positioner does, and its popup APIs are marked experimental. Its shape was the useful part: one popup instance per layer, one list instance per surface, state read by key, and headless behaviors. That shape is what this decision keeps.
- **Rewrite the engine in one go beside the old one**: the spike shipped both engines while two members were still on the old one, adding about 12,500 lines and two copies of the data-first list. Moving one layer at a time across all six members avoids running two engines.

## Consequences

Every step lands as its own green PR on `canary`, and the old code a step replaces is deleted in that step. Before the engine changes, tests pin the behaviours the rebuild must keep, menu tests stop reaching into engine internals, and CI checks row-render budgets and the menu family's bundle size. Layering is enforced by lint, so the engine can't import a member again.
