# 003 — Bump `@base-ui/react` to `1.5.0`

> **Linear:** [UI-303](https://linear.app/bazzalabs/issue/UI-303/bump-base-uireact-to-150) ·
> **Branch:** `ui-303-bump-base-uireact-to-150` ·
> **Type:** Chore / Dependencies ·
> **Effort:** S ·
> **Risk:** Medium (small type-level migration plus behavior changes) ·
> **Planned against commit:** `07aee02d` (tip of branch `ui-301-unify-data-first-menu-api`).

This plan is **self-contained**. You (the executor) have no context from the authoring
session. Read it fully, honor the **STOP conditions**, and update the status row in
`plans/README.md` when done. Package manager is **bun only** — never npm/yarn/pnpm/npx.

---

## 1. Goal

Upgrade the Base UI dependency of `@bazza-ui/react` from `@base-ui/react@1.0.0` to the
latest stable `@base-ui/react@1.5.0`, align the direct `@base-ui/utils` dependency
accordingly, and apply the small source migrations required by the updated type surface.
Bump the workspace app (`apps/web`) that also depends on Base UI directly so the whole
monorepo resolves a **single** Base UI version. Add a changeset. Ship green (typecheck +
tests + build).

This is a dependency bump plus a narrow compatibility migration. Do not refactor component
logic or change behavior beyond the exact source edits specified in this plan.

---

## 2. Why this is low-risk (read before you worry)

The scary Base UI breaking changes (detached triggers moving `openOnHover`/`delay`/
`closeDelay` from `Root` to `Trigger`, `trackAnchor`→`disableAnchorTracking`,
`loop`→`loopFocus`, root elements changing from `<button>` to `<span>`, etc.) **all landed
in pre-1.0.0 betas**. This package is already on `1.0.0` stable, so it has already absorbed
them. Everything from `1.1.0` → `1.5.0` that touches the APIs this package uses is either a
**bug fix**, **additive**, or a small type-level cleanup.

The package also already lives on the renamed `@base-ui` npm org (the rename from
`@base-ui-components/react` → `@base-ui/react` *was* the 1.0.0 change). **No package rename
is needed.**

### 2.1 Exact Base UI import surface used by this package (verified)

Only these subpaths are imported anywhere in `packages/react/src` + `packages/react/test`:

| Import | Count | Verified present in target? |
|---|---|---|
| `@base-ui/react/use-render` → `useRender` | 35 | ✅ `use-render/useRender.d.ts` |
| `@base-ui/react/popover` → `Popover` + types `PopoverRootProps`, `PopoverPositionerProps`, `PopoverTriggerProps`, `PopoverPortalProps`, `PopoverPopupProps`, `PopoverBackdropProps`, `PopoverArrowProps` | 16 | ✅ namespace + flat type aliases (re-exported via `popover/index.d.ts` barrel from each part file) |
| `@base-ui/react/slider` → `Slider` + type `SliderRoot` | 2 | ✅ `Slider` namespace + `SliderRoot` (in `slider/control/SliderControl.d.ts`) |
| `@base-ui/react/merge-props` → `mergeProps`, `makeEventPreventable` | 1 | ✅ `merge-props/mergeProps.d.ts` |
| `@base-ui/utils/store` → `createSelector`, `ReactStore` | 3 | ✅ `store/createSelector.*`, `store/ReactStore.*` |
| `@base-ui/utils/useStableCallback` → `useStableCallback` | 2 | ✅ `useStableCallback.*` |
| `@base-ui/utils/useRefWithInit` → `useRefWithInit` | 1 | ✅ `useRefWithInit.*` |

**Every one of these survives intact in `@base-ui/react@1.5.0` / `@base-ui/utils@0.2.9`.**
Verification was done by unpacking the published tarballs (`npm pack @base-ui/react@1.5.0`,
`npm pack @base-ui/utils@0.2.9`) and grepping their `.d.ts` files.

### 2.2 Store API migration: `useControlledProp` now takes 2 args

Diffing `@base-ui/utils` `store/ReactStore.d.ts` from `0.2.3` (installed) → `0.2.9`
(target) shows `set()`, `update()`, and `setState()` *disappearing* from `ReactStore` and
`useControlledProp` losing its 3rd `defaultValue` argument.

- `set()`, `update()`, `setState()` were **moved up to the `Store` base class**
  (`store/Store.d.ts` lines ~35/41/48 in `0.2.9`), and `ReactStore extends Store<State>`.
  The `Store.d.ts` diff `0.2.3` → `0.2.9` is **purely additive** (adds a `use()` method and
  `SelectorArgs`/`Tail` helper types). The package's stores call `this.set(...)` /
  `this.update(...)` (see `OpenChainStore.ts`, `FocusOwnerStore.ts`, `ListboxStore.ts`) —
  these resolve to the inherited base-class methods and still typecheck.
- The package **does** call `useControlledProp` in six places with the old 3-argument
  signature. Migrate those calls to the new 2-argument signature. Do **not** reimplement
  defaulting in `useControlledProp`: default `open` is already passed into
  `ListboxStore.useStore(..., { open: defaultOpen })`. `defaultSearch` is different: it is
  a `Surface` prop, not a root/store creation prop, so Step 4.1 must explicitly preserve its
  old first-render initialization behavior.

If `bun run type-check` flags a different store method, see **STOP condition C**.

### 2.3 Slider thumb style migration

`Slider.Thumb` now accepts a function-valued `style` prop via Base UI's render-prop-aware
component typing, but this package's `SeekSliderThumbRenderProps` intentionally exposes a
plain `React.CSSProperties` object. Narrow `SeekSliderThumbProps` so its external `style`
prop is `React.CSSProperties`, and keep the render-prop merge behavior unchanged.

---

## 3. Version decisions (and why)

| Package | Current | Target | Rationale |
|---|---|---|---|
| `@base-ui/react` (direct dep of `packages/react`) | `1.0.0` | **`1.5.0`** | Latest stable. Exact pin, matching existing convention. |
| `@base-ui/utils` (direct dep of `packages/react`) | `0.2.3` | **`0.2.9`** | `@base-ui/react@1.5.0` declares `"@base-ui/utils": "0.2.9"`. Matching the direct dep to the transitive pin keeps **one** copy of `@base-ui/utils` in the tree. Exact pin, matching convention. |
| `@base-ui/react` (direct dep of `apps/web`) | `^1.0.0` | **`^1.5.0`** | `apps/web` imports `@base-ui/react` directly in 7 source files **and** consumes `@bazza-ui/react`. Bumping keeps a single Base UI version across the workspace and documents intent. Caret, matching its existing convention. |

### Rejected alternatives (do **not** do these)

- ❌ **`@base-ui/utils@0.3.0`** (the latest published utils). `@base-ui/react@1.5.0` pins
  `0.2.9`, so a direct `0.3.0` would put **two** copies of `@base-ui/utils` in the tree.
  Exports are compatible, but it is wasteful and risks subtle type drift. `0.3.0` belongs
  with a *future* `@base-ui/react` that pins it.
- ❌ **Removing the direct `@base-ui/utils` dependency** and relying on it transitively. The
  package imports `@base-ui/utils/*` subpaths directly, so it must declare the dependency
  (dependency hygiene; transitive resolution is not guaranteed).
- ❌ **Changing `@base-ui/react` from a `dependency` to a `peerDependency`.** Out of scope
  for a version bump; it is currently a regular `dependency` by design.

---

## 4. Files in scope

1. `packages/react/package.json` — bump `@base-ui/react` and `@base-ui/utils` (`dependencies`).
2. `apps/web/package.json` — bump `@base-ui/react` (`dependencies`).
3. `bun.lock` — regenerated by `bun install` (do not hand-edit).
4. Six `useControlledProp` call sites:
   - `packages/react/src/dropdown-menu/root/root.tsx`
   - `packages/react/src/context-menu/root/root.tsx`
   - `packages/react/src/select/root/root.tsx`
   - `packages/react/src/combobox/root/root.tsx`
   - `packages/react/src/internal/popup-menu/components/submenu-root/submenu-root.tsx`
   - `packages/react/src/internal/popup-menu/components/surface/surface.tsx`
5. `packages/react/src/video-player/components/seek-slider/seek-slider.tsx` — narrow the
   thumb `style` prop type for render-prop compatibility.
6. `.changeset/<name>.md` — new patch changeset for `@bazza-ui/react` (see step 5).
7. `apps/web/public/r/base/*.json` — **only if** `bun run registry:build` regenerates them
   (see step 6). These are generated artifacts.

### Out of scope — do NOT touch

- ❌ The git-ignored **`base-ui/` directory at the repo root**. It is a *vendored reference
  clone* of the upstream Base UI repo (0 files tracked by git; `git check-ignore base-ui`
  confirms it is ignored). It is **not** a workspace member (workspace globs are `apps/*`,
  `packages/*`, `apps/web/registry/ui/*`, `apps/web/registry/components/*`). Editing it does
  nothing useful and pollutes the diff.
- ❌ Any `packages/react/src/**` component logic, store logic, tests, CSS-var enums, or
  data-attribute enums outside the seven source files listed above. The source changes are
  compatibility edits only; do not refactor behavior.
- ❌ `@base-ui/utils` version inside the vendored `base-ui/` clone.

---

## 5. Branching & workflow (Graphite stack — important)

**`packages/react` does not exist on `main` yet.** The entire `@bazza-ui/react` package is
in-flight in the Graphite stack `ui-299-support-reset-scroll-on-search` → `ui-300-*` →
`ui-301-unify-data-first-menu-api`. Plans `001` and `002` are `DONE` on that stack.

Therefore this branch **stacks on top of the current tip**, it does **not** branch from
`main`. The repo uses **Graphite (`gt`)** and **changesets** (currently in `pre`/`canary`
mode). Use `gt`, never raw `git commit` / `git push`.

- Confirm you are on (or stacked above) `ui-301-unify-data-first-menu-api`.
- New branch name (exactly, from Linear): `ui-303-bump-base-uireact-to-150`.

> **STOP condition A — stack moved.** If, by the time you execute, the
> `ui-299`→`ui-300`→`ui-301` stack has already merged to `main` (i.e.
> `git cat-file -e main:packages/react/package.json` succeeds), branch from `main`
> instead, and re-confirm the drift baseline in step 0. If `packages/react/package.json`
> is missing from **both** `main` and your current `HEAD`, **STOP and report** — you are in
> the wrong place.

---

## 6. Steps

### Step 0 — Pre-flight / drift check

```sh
cd /Users/kianbazza/repos/bazzalabs/ui
git status --short                 # expect: clean (or only your own intended changes)
grep -n '@base-ui' packages/react/package.json
```

**Expected** (the baseline this plan was written against):

```
"@base-ui/react": "1.0.0",
"@base-ui/utils": "0.2.3",
```

> **STOP condition B — drift.** If those two lines already show `1.5.0` / `0.2.9`, the bump
> may be partly/fully done — reconcile with `plans/README.md` and skip completed steps. If
> they show some *other* versions, STOP and report; the plan's assumptions no longer hold.

Also confirm the app baseline:

```sh
grep -n '"@base-ui/react"' apps/web/package.json    # expect: "@base-ui/react": "^1.0.0",
```

### Step 1 — Edit `packages/react/package.json`

In the `"dependencies"` block, change exactly these two lines:

```diff
-    "@base-ui/react": "1.0.0",
-    "@base-ui/utils": "0.2.3",
+    "@base-ui/react": "1.5.0",
+    "@base-ui/utils": "0.2.9",
```

Leave `@floating-ui/react` and everything else untouched.

### Step 2 — Edit `apps/web/package.json`

Change exactly this line in `"dependencies"`:

```diff
-    "@base-ui/react": "^1.0.0",
+    "@base-ui/react": "^1.5.0",
```

### Step 3 — Install (regenerates `bun.lock`)

```sh
cd /Users/kianbazza/repos/bazzalabs/ui
bun install
```

**Expected:** completes with no errors. `git diff --stat bun.lock` should show changes
confined to Base UI and its transitive deps (e.g. `@base-ui/react`, `@base-ui/utils`,
`@floating-ui/*`, `@babel/runtime`, `use-sync-external-store`). If unrelated packages churn
heavily, inspect before proceeding.

Sanity-check there is exactly **one** resolved `@base-ui/utils` and `@base-ui/react`:

```sh
grep -E '"@base-ui/(react|utils)@' bun.lock | sort -u
```

**Expected:** a single `@base-ui/react@1.5.0` and a single `@base-ui/utils@0.2.9` entry
(plus the dev/peer ranges). Two different versions of either = the alignment failed; revisit
steps 1–2.

### Step 4 — Apply source compatibility migrations

#### 4.1 `useControlledProp` call sites

Change exactly these six calls from the old 3-argument signature to the new 2-argument
signature:

```diff
-  store.useControlledProp('open', openProp, defaultOpen)
+  store.useControlledProp('open', openProp)
```

Apply that in:

- `packages/react/src/dropdown-menu/root/root.tsx`
- `packages/react/src/context-menu/root/root.tsx`
- `packages/react/src/select/root/root.tsx`
- `packages/react/src/combobox/root/root.tsx`
- `packages/react/src/internal/popup-menu/components/submenu-root/submenu-root.tsx`

For search, preserve the old `defaultSearch` first-store-initialization behavior and then
apply the analogous `useControlledProp` migration. Because `Surface` unmounts/remounts while
the `ListboxStore` instance persists, the initialization guard must be **store-scoped**, not
component-local.

Add this module-level constant near the top of
`packages/react/src/internal/popup-menu/components/surface/surface.tsx`, after the state
interface is fine:

```ts
const defaultSearchInitializedStores = new WeakSet<object>()
```

Then, inside `PopupMenuSurface`, place this after the store is available and before the
current `store.useControlledProp('search', ...)` call:

```ts
if (!defaultSearchInitializedStores.has(store)) {
  defaultSearchInitializedStores.add(store)
  if (searchProp === undefined && defaultSearch !== store.state.search) {
    store.setSearch(defaultSearch)
  }
}
```

Then change:

```diff
-  store.useControlledProp('search', searchProp, defaultSearch)
+  store.useControlledProp('search', searchProp)
```

in `packages/react/src/internal/popup-menu/components/surface/surface.tsx`.

Why render-time initialization here is acceptable: the old `@base-ui/utils@0.2.3`
`useControlledProp` also initialized uncontrolled defaults synchronously during render and
tracked the initialized key on the persistent store. The `WeakSet` mirrors that behavior
without changing `ListboxStore`'s public API. This wrapper is only needed for `defaultSearch`
because `defaultOpen` is already seeded through `ListboxStore.useStore` in roots/submenus.

Do **not** remove `defaultOpen` or `defaultSearch` from props. They remain documented public
behavior.

#### 4.2 `SeekSliderThumb` style type

In `packages/react/src/video-player/components/seek-slider/seek-slider.tsx`, update
`SeekSliderThumbProps` so its external `style` prop is a plain `React.CSSProperties`, not
Base UI's function-capable style type. Keep the existing render implementation.

Current shape:

```ts
export interface SeekSliderThumbProps
  extends Omit<
    React.ComponentPropsWithRef<typeof Slider.Thumb>,
    'render' | 'children'
  > {
  render?: RenderProp<SeekSliderThumbRenderProps, SeekSliderThumbState>
  children?: React.ReactNode
}
```

Target shape:

```ts
export interface SeekSliderThumbProps
  extends Omit<
    React.ComponentPropsWithRef<typeof Slider.Thumb>,
    'render' | 'children' | 'style'
  > {
  render?: RenderProp<SeekSliderThumbRenderProps, SeekSliderThumbState>
  children?: React.ReactNode
  style?: React.CSSProperties
}
```

This preserves the public wrapper contract (`renderProps.style` is always a CSS object) and
avoids widening downstream custom thumb renderers to handle function-valued styles.

### Step 5 — Add a changeset

The repo is in changesets `pre` (`canary`) mode. This is a `patch` (the **public API of
`@bazza-ui/react` does not change** — only its Base UI dependency). The app `web` is in the
changeset `ignore` list, so **no changeset is needed for it**.

Create `.changeset/bump-base-ui-react-150.md` with this exact content (note the YAML
front-matter with literal newlines, matching existing changesets like
`.changeset/bright-parts-compose.md`):

```md
---
"@bazza-ui/react": patch
---

Bump `@base-ui/react` to `1.5.0` and `@base-ui/utils` to `0.2.9`.
```

> Do **not** run `bun run changeset` (interactive). Write the file directly.

### Step 6 — Verification gates (must all pass)

Run from the repo root. These are the exact, verified commands (see `plans/README.md` →
*Commands*). `bun run *` delegates to `turbo run *` across the workspace, so these cover
`packages/react`, `apps/web`, and the rest.

```sh
cd /Users/kianbazza/repos/bazzalabs/ui
bun run type-check     # exit 0, no errors (covers packages/react AND apps/web)
bun run test           # all pass (packages/react vitest suite)
bun run build          # exit 0 (tsup for packages/react; next build for apps/web)
bun run check          # biome lint+format check, exit 0
```

If you want a faster inner loop while iterating, scope to the library first:

```sh
cd packages/react && bun run type-check && bun run test && bun run build
```

> **STOP condition C — typecheck fails in `packages/react`.** Capture the exact error.
> - If it is a **store** error (`set`/`update`/`setState`/`select`/`useState` on a class
>   extending `ReactStore`): re-read §2.2. The methods are on the `Store` base class in
>   `0.2.9`. If they are genuinely gone, the published `0.2.9` differs from what this plan
>   verified — **STOP and report** with the error; do not invent a migration.
> - If it is a **Popover/Slider/useRender type** error other than the explicit
>   `SeekSliderThumb` style narrowing in Step 4.2: a flat type alias or prop was renamed.
>   **STOP and report** the symbol; do not guess a replacement.
> - Any other typecheck error that requires editing `src/**`: **STOP and report**. A pure
>   version bump should not require source edits.

> **STOP condition D — tests fail.** See §7 for which areas the Base UI changes touch.
> If a failure is a *behavior* change (e.g. event-handler ordering, focus, slider commit
> reasons), do **not** paper over it by editing the test to match. Report the failing test,
> the assertion, and the relevant changelog entry from §7 so a human can decide whether the
> new Base UI behavior is acceptable. Only adjust source/tests if a maintainer confirms.

### Step 7 — Registry artifacts (conditional)

`apps/web/public/r/base/*.json` are generated by the registry build and embed component
source that imports `@base-ui/react`. They contain **no Base UI version pin** (their
`dependencies` reference `@bazza-ui/react`, not `@base-ui/react`), so they likely will not
change — but regenerate to be safe:

```sh
cd /Users/kianbazza/repos/bazzalabs/ui
bun run registry:build
git status --short apps/web/public/r
```

If files changed, include them in the commit. If nothing changed, move on.

### Step 8 — Commit & submit (Graphite)

Stage everything and create the branch (write code **before** `gt create`, per the gt
workflow). Use the exact branch name from Linear.

```sh
cd /Users/kianbazza/repos/bazzalabs/ui
git add packages/react/package.json apps/web/package.json bun.lock .changeset/bump-base-ui-react-150.md
git add apps/web/public/r 2>/dev/null || true   # only if step 6 changed anything
gt create --message "chore(deps): bump @base-ui/react to 1.5.0 (UI-303)"
gt submit --no-interactive
```

> The first line of the commit message becomes the PR title. After submit, surface the
> first PR's `/github/pr/` URL to the user.

---

## 7. Behavior-change watch list (won't fail typecheck — verify by test + manual)

These `1.1.0` → `1.5.0` changelog entries touch APIs this package builds on. Most are bug
fixes that should *improve* behavior, but they are where a regression could hide. If a test
in step 5 fails, check here first.

| Area | Base UI change (version) | This package's exposure | What to check |
|---|---|---|---|
| `mergeProps` multi-arg event forwarding fix (**1.4.1**, #4598) | `packages/react/src/video-player/utils/merge-element-props.ts` `wrapEventHandlers` forwards `(event, ...args)` and calls `makeEventPreventable`. | Video player part event composition (recent `canary.5`/`.6` work). Run video-player tests; manually verify play/pause/mute buttons still fire and that `preventBaseUIHandler` opt-out still works. |
| `preventBaseUIHandler` runtime wrapping fix (**1.4.0**, #4330) | Same file (`makeEventPreventable`). | Same as above. |
| Popover: trap focus w/ `Popover.Close` + `modal`; nested hoverable popups (**1.3.0**); remove stray focus guards when `modal` (**1.4.0**); preserve active trigger on close press, controlled-`open` open-state detection (**1.5.0**). | All popup-menu primitives are built on `Popover` (`dropdown-menu`, `context-menu`, `select`, `combobox`, submenu/backdrop/positioner/portal/arrow). | Open/close + focus return for dropdown & context menus; submenu open/close; backdrop behavior. Covered partly by `positioner.test.tsx` and menu tests. |
| Popover auto-resize CSS-var refactor (**1.1.0**, #3652): `--positioner-width`/`--positioner-height` no longer required on `Positioner` unless a `Viewport` part is used. | `positioner.css-vars.ts` declares `positionerWidth`/`positionerHeight` + `anchorWidth`/`anchorHeight` enum names. | Menu positioning/animation still correct (transform-origin, available width/height). Visual; not unit-tested. |
| Slider: change-event cloning (**1.2.0**), field data attrs (**1.2.0**), keyboard float rounding (**1.4.0**), edge thumb alignment (**1.4.0**). | `video-player/components/volume-slider`, `.../seek-slider` use `Slider.Root/Control/Track/Indicator/Thumb`. | Volume drag + seek scrubbing; keyboard arrow stepping. |
| `render`-prop warning accuracy improved (**1.4.0**, #4324/#4363). | Many parts pass `render={...}`. | Watch test output for **new** console warnings; a new warning may indicate a real misuse to fix (report it, don't silence). |
| `useRender` exported missing types (**1.1.0**, #3565). | `useRender` (35 call sites). | Additive — no action; just confirms types are richer. |

---

## 8. Done criteria (machine-checkable)

All of the following, from repo root, on branch `ui-303-bump-base-uireact-to-150`:

- [ ] `grep '@base-ui' packages/react/package.json` shows `"@base-ui/react": "1.5.0"` and `"@base-ui/utils": "0.2.9"`.
- [ ] `grep '"@base-ui/react"' apps/web/package.json` shows `"^1.5.0"`.
- [ ] `grep -E '"@base-ui/(react|utils)@' bun.lock | sort -u` shows exactly one `react@1.5.0` and one `utils@0.2.9`.
- [ ] `.changeset/bump-base-ui-react-150.md` exists with a `"@bazza-ui/react": patch` entry.
- [ ] Exactly six `store.useControlledProp(...)` calls remain, all with 2 arguments.
- [ ] `PopupMenuSurface` initializes uncontrolled `defaultSearch` once per persistent store
      via a module-level `WeakSet`, before calling `store.useControlledProp('search', searchProp)`.
- [ ] `SeekSliderThumbProps` omits `style` from Base UI thumb props and re-adds
      `style?: React.CSSProperties`.
- [ ] `bun run type-check` → exit 0.
- [ ] `bun run test` → all pass.
- [ ] `bun run build` → exit 0.
- [ ] `bun run check` → exit 0.
- [ ] `git status` shows no stray edits outside the in-scope files (esp. nothing under `base-ui/`).
- [ ] Branch submitted via `gt submit`; first PR URL surfaced to the user.

---

## 9. Maintenance notes

- **Next bump:** when moving past `1.5.0`, re-check what `@base-ui/react@<next>` pins for
  `@base-ui/utils` (run `npm view @base-ui/react@<next> dependencies`) and realign the
  direct `@base-ui/utils` dep the same way. `@base-ui/utils` is a `0.x` package — treat
  every minor as potentially breaking and re-diff `store/Store.d.ts` / `store/ReactStore.d.ts`
  against the in-tree store usage (`OpenChainStore`, `FocusOwnerStore`, `ListboxStore`).
- **Single-version invariant:** keep the direct `@base-ui/utils` pin equal to whatever
  `@base-ui/react` pins transitively. Two copies silently double the store/runtime code.
- **Watch upstream peer deps:** `@base-ui/react@1.5.0` adds `@date-fns/tz` + `date-fns` as
  *optional* peers (for date components this package doesn't use). No action needed now, but
  if you adopt Base UI date components later, add those peers.
- **`base-ui/` clone:** remains a local, git-ignored reference. If it drifts from the
  installed version it can mislead future audits — consider documenting its purpose or
  removing it, but that is a separate task.

---

## 10. Rollback

```sh
git checkout -- packages/react/package.json apps/web/package.json bun.lock
rm -f .changeset/bump-base-ui-react-150.md
bun install   # restores 1.0.0 / 0.2.3 resolution
```

(Or `gt` branch abandonment if already created.)
