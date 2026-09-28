# 006 — `SuggestionMenu` design

> **Type:** Design record ·
> **Status:** Decided, ready to plan ·
> **Researched against:** `canary` at `3b36c83a`, re-checked at `8a7cd706` (after the checkbox group and range selection work), `@base-ui/react` 1.8.0 ·
> **ADRs:** [0003](../docs/adr/0003-suggestion-menu-is-its-own-member.md), [0004](../docs/adr/0004-suggestion-menu-host-wiring.md), [0005](../docs/adr/0005-menu-family-accessibility-deviations.md) ·
> **Glossary:** Suggestion Menu, Host Input, Handle, Settled in [`packages/react/CONTEXT.md`](../packages/react/CONTEXT.md)

A suggestion menu is the list that appears when you type `/`, `@` or `:` in a text field or an editor: block commands, mentions, emoji. What sets it apart from every other menu in the family is that **the query is typed into a host input the menu doesn't own**, and **DOM focus never leaves that host**. The host can be an `<input>`, a `<textarea>`, or a contenteditable editor like ProseMirror, CodeMirror or Lexical.

Every decision below is final unless a plan-time check (section 12) turns up a fact that contradicts it.

---

## 1. Why build it

Ship's editor has a hand-rolled `/` menu: a ProseMirror plugin plus a floating listbox, because no bazza/ui menu can keep focus in an input it doesn't own. `@` mentions (async people search) and `:` emoji (a very long list) are next. That's where the popup-menu engine's loaders, virtualization and groups pay off, so the engine should grow a member that can work with a foreign host.

The bar is Linear's inline menus (measured live), with one difference: Linear ships no ARIA at all, and this design does.

---

## 2. The menu family, side by side

| | DropdownMenu | ContextMenu | CommandMenu | Combobox | **SuggestionMenu** |
|---|---|---|---|---|---|
| Base UI shell | Popover | Popover | Dialog | Popover (own positioner) | **Popover** |
| `modal` default | true | true | true | false | **non-modal** |
| Opened by | Trigger | right-click / long-press | Trigger / shortcut | its Input | **host, through the handle or Root props** |
| Query comes from | Surface `Input` | Surface `Input` | Surface `Input` | `Combobox.Input` | **the host: `handle.update({ query })` or Root `query`** |
| DOM focus while open | popup | popup | popup | `Combobox.Input` | **the host, always** |
| Keys reach the list via | focused Input or List | focused Input or List | focused Input or List | internal hook on its input | **the host calls `handle.handleKeyDown(event)`** |
| `aria-activedescendant` on | Input, else List | Input, else List | Input, else List | `Combobox.Input` | **the host, keyboard highlight only** |
| Live region | range/drag selection commits, per surface | same | same | same (no checkbox rows) | **result summary, plus the per-surface region (unused)** |
| Anchored to | Trigger | pointer position | centred | its input | **the trigger character, via a function** |
| Store exposed | `DropdownMenuStore` | `ContextMenuStore` | none | `ComboboxStore` | **behind the handle** |
| Submenus / subpages / deep search | yes / yes / yes | yes / yes / yes | no / yes / yes | no | **no / no / no** |

---

## 3. A new member, not a DropdownMenu mode

`SuggestionMenu` is its own member: a thin shell over `internal/popup-menu`, shaped like CommandMenu (666 LOC today; this shell is estimated at 400–700).

Two alternatives were rejected:
- **A host-focus mode on `DropdownMenu.Root`.** The engine needs the same changes either way (section 10), so a mode would save only the shell. In exchange, `modal`, `Trigger`, `Input`, `Submenu`, focus zones and Tab, item `shortcut`, and the meaning of `closeOnOutsidePress` would all become "valid unless in host mode" for every DropdownMenu and ContextMenu user.
- **Letting `Combobox` take an external input.** Its focus model is the closest match, but most of its 3,757 LOC is committed-value state (selection, hidden form inputs, item equality) that a suggestion menu doesn't have, and its `Input` is an element it renders.

A consequence: the popup's "don't take focus" check, which today looks for Combobox's context by name (`popup.tsx:5,289,294`), becomes a generic flag that Combobox and SuggestionMenu both set. See [ADR 0003](../docs/adr/0003-suggestion-menu-is-its-own-member.md).

---

## 4. API

Names are working names; the shapes are decided.

### 4.1 The handle

```ts
const menu = SuggestionMenu.createHandle<{ trigger: '@' | ':' }>()
```

A plain object created outside React, the same idea as Base UI's `Menu.createHandle`. Editors handle keys and attributes in non-React code (ProseMirror plugins, CodeMirror extensions, Lexical commands), so the connection has to be reachable from there. React-only hosts can use `React.useState(() => SuggestionMenu.createHandle())`.

| Member | What it does |
|---|---|
| `attach(element): () => void` | Connects the host. The menu writes the host's ARIA itself (section 7), exempts it from outside press, and uses it as the anchor's scroll context. Returns a detach function. **One host at a time**: attaching another host detaches the previous one, clearing its ARIA and closing the menu if it was open for it. A menu shared by several fields re-attaches on focus. |
| `handleKeyDown(event): boolean` | The host forwards every keydown. Returns `true` when the menu consumed the key (and has already called `preventDefault`), `false` otherwise. Accepts native and React keyboard events. The menu never adds a key listener of its own. See section 5. |
| `update({ query, anchor, payload })` | Opens the menu, or updates it. |
| `close()` | Closes it. |

Why the menu writes the host's ARIA and the host forwards keys is in [ADR 0004](../docs/adr/0004-suggestion-menu-host-wiring.md). In short: ProseMirror and React only patch attributes they set themselves, so the writes are safe. And editors order their own keys, so a menu listener would run either before every editor keymap or after the editor has already acted. **Consumers must not set `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete` or `aria-haspopup` on an attached host.**

### 4.2 Root

```tsx
<SuggestionMenu.Root handle={menu}>
  {/* children may also be a function: ({ payload, query }) => … */}
  <SuggestionMenu.Portal>
    <SuggestionMenu.Positioner>
      <SuggestionMenu.Popup>
        <SuggestionMenu.Arrow />
        <SuggestionMenu.Surface>
          {/* Static header/footer content */}
          <SuggestionMenu.Header />
          <SuggestionMenu.List>
            {/* Scroll up/down arrows */}
            <SuggestionMenu.ScrollUpArrow />
            <SuggestionMenu.ScrollDownArrow />
            {/* Items */}
            <SuggestionMenu.Item>
              <SuggestionMenu.Icon />
            </SuggestionMenu.Item>
            <SuggestionMenu.LinkItem />
            {/* Groups */}
            <SuggestionMenu.Group>
              <SuggestionMenu.GroupLabel />
            </SuggestionMenu.Group>
            {/* Group membership for virtualized rows (renders no DOM) */}
            <SuggestionMenu.GroupValue />
            {/* Trees */}
            <SuggestionMenu.Tree>
              <SuggestionMenu.TreeItem>
                <SuggestionMenu.TreeConnector />
              </SuggestionMenu.TreeItem>
            </SuggestionMenu.Tree>
            {/* Separator */}
            <SuggestionMenu.Separator />
            <SuggestionMenu.Loading />
            <SuggestionMenu.Empty />
          </SuggestionMenu.List>
          <SuggestionMenu.Footer />
        </SuggestionMenu.Surface>
      </SuggestionMenu.Popup>
    </SuggestionMenu.Positioner>
  </SuggestionMenu.Portal>
</SuggestionMenu.Root>
```

| Prop | Notes |
|---|---|
| `handle` | Required. |
| `children` | Nodes, or `({ payload, query }) => nodes`, so one Root can serve several triggers. |
| `open`, `onOpenChange(open, { reason })` | Controlled or uncontrolled. Reasons: `'imperative'`, `'item-select'`, `'escape'`, `'outside-press'`, `'blur'`, `'no-results'`. |
| `query` | Optional, controlled. |
| `anchor: () => DOMRect \| null` | Optional, controlled. See section 9. |
| `noResults: 'empty' \| 'close'` | Default `'empty'`. See section 8. |
| `virtualized`, `items`, `onHighlightChange` | Same pattern as DropdownMenu: the consumer wires their own virtualizer and scrolls it from `onHighlightChange`. |

**Precedence when props and the handle both drive a value** follows Base UI:
- **`open`** is controlled or uncontrolled. When it's controlled, `update()`, `close()` and the menu's own dismissals become requests through `onOpenChange(next, { reason })`, and the parent decides.
- **`query` and `anchor`** are never changed by the menu. If the prop is given, it wins, and the matching `update()` field is ignored with a dev-only warning. There's no `onQueryChange`.

There's no `payload` prop: a React parent closes over its own values.

### 4.3 Parts

| Kept | Dropped, and why |
|---|---|
| Root, Portal, Positioner, Popup, Surface, List | **Trigger:** the host replaces it. |
| Item, LinkItem, Group, GroupLabel, GroupValue (virtualized), Separator, Icon | **Input:** the host *is* the input. |
| Tree, TreeItem, TreeConnector (always expanded, no keys) | **Backdrop:** the menu is non-modal. |
| Empty, Loading, rendered inside `List` (they register as list rows) | **FocusZone:** no DOM focus inside the popup. |
| Arrow, ScrollUpArrow, ScrollDownArrow | **Submenu parts:** ←/→ belong to the host's caret. |
| Header, Footer, as **static regions** (not focus zones; documented as not for controls) | **Shortcut and item `shortcut`:** single keys type into the host. |
| | **RadioGroup, RadioItem, RadioGroupValue:** a suggestion commits one action; it doesn't hold a choice. |
| | **CheckboxItem, CheckboxGroup, CheckboxGroupValue:** no multi-select in v1. Space types into the host, and range and drag selection need Shift+Click, Shift+Arrow and Shift+Enter. |
| | **Subpage parts, and deep search:** both reference cases are flat. Subpage and submenu defs in `content` get a dev warning and are skipped. |

### 4.4 Surface

`SuggestionMenu.Surface` keeps `content`, `asyncContent`, `filter`, `loop`, `autoHighlightFirst` and `resetScrollOnSearch`. It has **no** `search`, `onSearchChange` or `defaultSearch`: the query has one source, the host (through Root or the handle). Transforms like stripping the trigger are the host's job. It also takes the two new async options from section 8, with suggestion-menu defaults.

### 4.5 The text-field binding

```ts
const detach = SuggestionMenu.attachTextTrigger(menu, textarea, {
  triggers: [{ char: '@', allowSpaces: true, minLength: 0 }],
})
```

It has a thin React wrapper. For `<input>` and `<textarea>`, it *is* the host code: it calls `attach`, listens for input, selection changes and keydown (forwarding keys through `handleKeyDown`), matches triggers, measures the trigger character's position, calls `update`/`close`, and implements **sticky dismissal**: after `reason: 'escape'` it stays closed until the trigger is typed again.

Editors write their own detection, because their rules are schema-specific. Ship's `/` refuses code blocks, table cells and titles, and requires whitespace before it. A generic matcher would save editors about three lines, so none is exported.

### 4.6 Wiring an editor (sketch)

```ts
const menu = SuggestionMenu.createHandle<{ trigger: '@' | '/' }>()

new Plugin({
  view(view) {
    const detach = menu.attach(view.dom)
    return {
      update(view) {
        const match = findTrigger(view.state) // the editor's own rules
        if (!match) return menu.close()
        menu.update({
          query: match.query,
          payload: { trigger: match.char },
          anchor: () => rectFromCoords(view.coordsAtPos(match.from)),
        })
      },
      destroy: detach,
    }
  },
  props: {
    handleKeyDown: (_view, event) => menu.handleKeyDown(event),
  },
})
```

The host still decides its own stickiness: it stops calling `update()` after `onOpenChange(false, { reason: 'escape' })` until the trigger is typed again.

---

## 5. Keyboard

`handleKeyDown` returns:

| Key (menu open) | Menu does | Returns |
|---|---|---|
| ↓ / ↑ | highlight next / previous; wraps (Surface `loop`) | `true` if there's a highlightable row |
| Ctrl+N / Ctrl+P | same as ↓ / ↑ | same |
| Home / End | highlight first / last row | same |
| Enter | choose the highlighted row → `reason: 'item-select'` | `true` if a row is highlighted, else `false` (the host gets its newline) |
| Escape | close → `reason: 'escape'`, and `stopPropagation` so an enclosing dialog stays open | `true` |
| Tab / Shift+Tab | nothing: an editor may indent, a text field moves focus | `false` |
| ← / →, PageUp / PageDown | nothing: the caret moves, and the menu stays open until the host closes it | `false` |
| Backspace, Space, printable keys | nothing: they edit the query in the host | `false` |
| any key with ⌘, Alt or Shift, or Ctrl + anything but N/P | nothing: ⌘Enter submits, Shift+Enter is a soft break, Shift+Arrow and Shift+Home/End select text. (In other members these extend a checkbox range; a suggestion menu has no checkbox rows.) | `false` |
| any key during IME composition | nothing | `false` |
| any key while closed | nothing: ↓ doesn't open it, unlike Combobox | `false` |

What changed from the rest of the family:
- **Tab doesn't accept.** Linear, GitHub and Slack accept on Tab. No other bazza/ui menu treats Tab as selection, and this one doesn't either.
- **Home/End keep their menu meaning** instead of moving the caret. Little is lost: End at the end of a query does nothing useful, Home leaves the trigger range (which closes the menu), and macOS text fields don't move the caret on Home/End anyway.
- **PageUp/PageDown stay unbound,** as everywhere else in the family.

---

## 6. Dismissal

| Reason | When |
|---|---|
| `'item-select'` | Enter, or a click on a row |
| `'escape'` | Escape |
| `'outside-press'` | A pointer press outside both the popup and the attached host |
| `'blur'` | The attached host loses focus. Two exceptions: when focus moves into the popup, and when the whole window loses focus (`document.hasFocus()` is false, e.g. switching apps). |
| `'no-results'` | `noResults="close"` and the results settled empty |
| `'imperative'` | `close()` |

Blur is the keyboard counterpart of outside press. Ship's editor does it by hand today. A host that wants different behaviour can veto through controlled `open`.

---

## 7. Accessibility

Neither Linear's nor Ship's current inline menus get this right. Linear ships no ARIA, and Ship (like BlockNote) puts `aria-expanded` on a contenteditable, where it isn't supported. The choices below follow the specs and what's known about real screen readers. Three of them deliberately depart from the textbook APG patterns; [ADR 0005](../docs/adr/0005-menu-family-accessibility-deviations.md) records why.

### 7.1 Host attributes, by host type

Written by `attach`, **only while the menu is open**. Until a trigger is typed, the host is an ordinary text field.

| Host | Role | Attributes |
|---|---|---|
| `<input>` | `combobox` | `aria-expanded="true"`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`, `aria-haspopup="listbox"` |
| `<textarea>` | unchanged (`textbox`) | `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`, `aria-haspopup="listbox"` |
| contenteditable | unchanged (the editor's `textbox`, multiline) | same as `<textarea>` |

ARIA in HTML allows `<textarea>` no role other than `textbox` (GitHub's `role="combobox"` on comment textareas is non-conforming). WAI-ARIA 1.2 doesn't support `aria-expanded` on `textbox`. `attach` detects the host type from the element.

### 7.2 `aria-activedescendant` follows keyboard highlight only

It's set when the highlight moves by ↑/↓, Ctrl+N/P or Home/End, and removed when the query changes, on ←/→, and on automatic or pointer highlight. The *visual* highlight doesn't change: the first row stays highlighted, and Enter chooses it.

The reason: the menu re-highlights the first row on every query change. If `aria-activedescendant` followed that, VoiceOver would read options over the typing, and NVDA would stop announcing edits altogether. React Spectrum clears it for the same reason.

### 7.3 Result summary

Root renders a stable, visually hidden `role="status"` region from mount, outside the popup. When the **settled** results change (section 8), it announces the count and the row Enter would choose: *"5 results, first: Alice Smith"*, or *"No results"*. It says nothing per arrow press; `aria-activedescendant` covers that. The text is overridable for localisation.

React Spectrum adds an Apple-only announcer for VoiceOver's `aria-activedescendant` gaps. It isn't needed here, because the markup already avoids what triggers those gaps:
- the host always contains at least the trigger, so it's never empty;
- options carry `aria-selected`;
- rows aren't inside a `role="group"` (section 7.5).

It reuses the machinery the per-surface selection status already uses: `useInitialLiveRegionTextMutation` (Safari VoiceOver needs a first text mutation before it announces later ones) and the word-joiner trick that makes a repeated summary still change the text. Its text formatter follows the existing `getAriaSelectionText` naming (e.g. `getAriaResultsText`). It stays a separate region on Root rather than joining the per-surface one, because it must exist before the popup opens for Safari to announce the first summary.

### 7.4 Rows

The popup is a clean listbox: `Item` and `LinkItem` are `option`, with `aria-selected` for the highlight and `aria-disabled`. Groups, trees and separators are `presentation` or `none`. With checkbox, radio, submenu and subpage rows gone, no `menuitem*` roles remain. The listbox is named by `List`'s existing `label` (default `'Suggestions'`).

### 7.5 Group names, for the whole menu family

Today no menu announces group names. `GroupLabel` is `aria-hidden` and `Group` is `presentation`, while `RadioGroup` and `CheckboxGroup` are `role="group"` with no name, so screen readers hear a bare "grouping" at best. This design fixes that **for every member**:
- **Roles:** `RadioGroup` and `CheckboxGroup` become `presentation`, like `Group`, so no menu row sits inside a `role="group"`.
- **How:** options in a named group get `aria-describedby` pointing at an always-mounted, `hidden` description node the engine keeps per group. A screen reader reads *"Alice Smith, People"*. `role="group"` isn't used, because VoiceOver then stops announcing the highlighted option.
- **Where the name comes from:** the new optional `label` prop on `Group`, `GroupValue`, `RadioGroup`, `RadioGroupValue`, `CheckboxGroup` and `CheckboxGroupValue`. Data-first `GroupDef.label`, `RadioGroupDef.label` and `CheckboxGroupDef.label` feed it. Without a `label` prop, the mounted `GroupLabel`'s text is used. The prop wins when both exist, so the description doesn't change as a virtualized label row mounts and unmounts.
- **Dev warning:** a dev-only `console.warn`, once per group, when a *virtualized* list renders a `GroupLabel` for a group whose `GroupValue`, `RadioGroupValue` or `CheckboxGroupValue` has no `label`. Otherwise the name would disappear whenever the label row scrolls away. Unlabelled groups, positional-only `GroupValue`s, non-virtualized groups and data-first groups never warn.

### 7.6 What's lost and what's gained

- **Lost, compared with other members:** there's no Tab into the popup and no single-key shortcuts.
- **Gained, compared with Linear:**
  - a valid host pattern for each element type;
  - `aria-activedescendant` that doesn't fight typing;
  - an announced summary of what Enter will choose;
  - announced group names.

---

## 8. Async, highlight and empty states

The acceptance case is Ship's `@`: cached people render on the keystroke, a server search merges in, and nothing flickers.

| Topic | Decision |
|---|---|
| Combining `content` and `asyncContent` | A new generic Surface option: `'replace'` (today's behaviour, and still the default for other members) or **`'append'`**, SuggestionMenu's default. With `'append'`, filtered local `content` comes first and loader rows follow; a loader row whose Resolved ID already exists in `content` is dropped. |
| When loader rows appear | Root content gets deep search's `AsyncResultBehavior`: **`'stream'`** (SuggestionMenu's default: local now, remote appended at the end, never reordered) or `'block'` (wait for the current query's loaders, then show everything at once). In `'block'`, the previous settled list stays up, frozen, and `Loading` shows only when nothing has settled yet. |
| Keeping remote rows between queries | The data library's job. TanStack and SWR users set their native `placeholderData: keepPreviousData` / `keepPreviousData: true`, as the recipes show. The vanilla adapter gains an opt-in `keepPreviousData` (default off, like SWR's). |
| Highlight | Kept by identity while the query is unchanged (remote rows landing, stale rows refreshing). Reset to the first row when the query changes, or when the highlighted row disappears. **This becomes the data-first rule for every member.** It already is the composable path's rule; today data-first resets on every change, which yanks the highlight when remote rows arrive. |
| Settled | Results are settled once no loader for the current query is pending, meaning in flight or waiting out a debounce. Resolved and errored loaders count as settled; rows kept from the previous query don't. With no loaders, results settle on the same render. The result summary and the no-results close both wait for it. |
| Debounce | A new `debounce` option on the query loader config, next to `minQueryLength`, accepted by every loader factory and applied once by the engine. The loader counts as pending during the wait, so "settled" stays correct. It's per loader, default 0. |
| No results | Root `noResults`. `'empty'` (default) stays open and shows `Empty`; Enter falls through to the host. `'close'` closes once results settle empty (`reason: 'no-results'`) and reopens on the next matching `update()`. For example, `'close'` suits a `/` menu (the user is typing a path) and `'empty'` suits `@` (the person doesn't exist). |
| Loading indicator | The built-in `Loading` shows on first load only. A "working…" indicator while a frozen or appended list refetches is the consumer's to render, from `useAsyncMenuCoordinator().isAnyFetching`, which SuggestionMenu re-exports. |

Deep search's own `'block'` still flashes `Loading` between queries. Making it freeze like root content is tracked separately in [UI-545](https://linear.app/bazzalabs/issue/UI-545/keep-previous-deep-search-results-while-blocked-loaders-refetch). Until it lands, the docs must say that `'block'` behaves differently in the two places.

---

## 9. Anchoring and placement

- **The anchor is a function: `anchor: () => DOMRect | null`.** Tiptap (`clientRect`), Lexical (`getRect`), React Aria (`getTargetRect`) and Ariakit (`getAnchorRect`) all use one.
- **The menu wraps it in a virtual anchor** whose `getBoundingClientRect()` always calls the latest function, with the attached host as its `contextElement`. So when the editor scrolls, Floating UI re-measures, and the popup follows.
- **It swaps the anchor object only when the rect changes.** Base UI repositions only when it gets a new anchor object, and every new object costs a flip/shift/size pass with `flushSync`. So on each `update()` or prop change, the menu measures once and swaps only if the rect differs from last time. `null` keeps the last position.
- **Placement:**
  - the text-field binding anchors at the **trigger character**, not the caret, so typing doesn't move the popup;
  - the defaults are `side="bottom"`, `align="start"`;
  - **the side is chosen at open and held until close.** The popup opens above if there's no room below, and may shift along the line, but never flips mid-typing. This is the behaviour of Base UI's `lazyFlip`, which is internal (only its Combobox positioner uses it).

---

## 10. Changes to the menu family

These engine changes land alongside SuggestionMenu. Those marked **all members** change behaviour, or add options, outside SuggestionMenu.

| Change | Scope |
|---|---|
| The popup's "don't take focus" check becomes a generic flag, removing the engine's import of Combobox's context | engine; Combobox and SuggestionMenu set it |
| Exempting the attached host from outside press. Two mechanisms exist today: our document listener and Base UI's `useDismiss`. | engine |
| A public key-forwarding path that returns "handled" (today's keyboard hooks are internal and return nothing) | engine |
| `RadioGroup` and `CheckboxGroup` switch from `role="group"` to `presentation` | **all members** |
| Group-name descriptions: `label` on `Group`, `GroupValue`, `RadioGroup`, `RadioGroupValue`, `CheckboxGroup`, `CheckboxGroupValue`; hidden per-group nodes; `aria-describedby`; the dev warning | **all members** |
| Data-first highlight kept by identity while the query is unchanged | **all members** |
| The Surface `'replace' \| 'append'` option, and `AsyncResultBehavior` for root content | **all members** (option; defaults unchanged) |
| `debounce` on query loader configs | **all loaders** (option; default 0) |
| Vanilla adapter `keepPreviousData` | **vanilla loaders** (option; default off) |

---

## 11. Out of scope for v1

| Excluded | Why |
|---|---|
| Submenus | ←/→ belong to the host's caret. |
| Subpages and deep search | Both reference cases are flat. Navigating would need a scoped query and a Backspace exception. Can be added later. |
| Checkbox items and multi-select | See 4.3. |
| Editors inside iframes | The first consumer isn't in one. Anchoring and outside press across documents can be added later. |
| Integrating Ship's editor | A separate task in the Ship repo. Its `/`, `@` and `:` menus are this design's acceptance cases. |
| Aligning deep search's `'block'` | [UI-545](https://linear.app/bazzalabs/issue/UI-545/keep-previous-deep-search-results-while-blocked-loaders-refetch). |

Three existing issues turned up during research and need their own fixes: CommandMenu is missing from `docs-types-entry.ts` (so it has no generated type tables); `ListboxStore`'s "used by" comment omits Combobox; and two CommandMenu doc examples render `Empty`/`Loading` after `List` instead of inside it (`command-menu/index.mdx:227`, `:259-260`).

---

## 12. Plan-time checks

These are facts to confirm, not decisions.

- **Clicking a row.** Items `preventDefault` on `pointerdown`. Confirm in a browser that clicking a row doesn't blur the host.
- **Escape's `stopPropagation`.** Confirm it runs before Base UI Dialog's Escape listener.
- **Ctrl+N** can't be prevented in Chrome on Windows/Linux. Decide whether to skip the binding there.
- **How the two outside-press mechanisms interact.**
- **Holding the side from open to close** without Base UI's internal `lazyFlip`.
- **Caret measurement** for the text-field binding: build the mirror-element technique, or take `dom-input-range` / `textarea-caret`.
- **Vanilla `keepPreviousData`** must report "refetching", not "initial loading", or `Loading` flashes.
- **How the local filter treats loader rows** under `'append'`.
- **Testing:** jsdom can't lay out text.
  - Vitest/jsdom covers the handle, the keymap, host ARIA writes, settling and the highlight rules.
  - A browser covers the anchor, the held side, and the first three checks above.
  - Check for a browser test runner.
- **Deliverables:** a docs page, the `docs-types-entry.ts` line, `bun run docs:type-gen`, a styled `suggestion-menu` registry component (`bun run registry:build`), and examples: a ProseMirror recipe, a textarea recipe with `attachTextTrigger`, and a TanStack `@`-mention recipe with `placeholderData: keepPreviousData`.

---

## 13. Prior art

| Library | Connection | Keyboard | Anchor | ARIA on host |
|---|---|---|---|---|
| BlockNote `SuggestionMenuController` | controller component + ProseMirror extension | inside the plugin | virtual rect | `aria-expanded`, `aria-controls`, `aria-activedescendant` on the contenteditable |
| Tiptap `Suggestion` | ProseMirror plugin | `onKeyDown(): boolean` | `clientRect()` | none |
| Lexical `LexicalTypeaheadMenuPlugin` | plugin + commands | commands return boolean | `getRect()` | `aria-controls`, `aria-activedescendant` |
| React Aria `Autocomplete` | context over a sibling input | virtual focus | `getTargetRect` | combobox |
| Plate `InlineCombobox` | inserts a real `<input>` into the document; focus moves there | Ariakit | the real input | Ariakit |
| GitHub `text-expander-element` + `combobox-nav` | attaches to an input or textarea | owns the listener | caret rect | full combobox set, including on `<textarea>` |

Base UI's `Autocomplete` is a different thing: a free-text input with suggestions.
