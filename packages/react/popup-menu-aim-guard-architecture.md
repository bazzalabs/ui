# Popup Menu Aim Guard Architecture

## Document Status

- Status: Implemented (matches current code)
- Scope: `packages/menu-core/src/controllers/` and `packages/react/src/internal/popup-menu`
- Audience: Maintainers of popup menu, listbox, and submenu behavior
- Last reviewed against code: 2026-11-30 (UI-683, `AimGuardController`)

The vocabulary (Aim Guard Controller, Aim Guard Trigger, Submenu Controller) is defined in `src/internal/popup-menu/CONTEXT.md`; the rules for controllers and their bindings are in `packages/react/AGENTS.md` ("Layers"). This document explains how the pieces work together and why.

## 1. Problem Statement

Nested popup menus have a well-known failure mode: while moving diagonally from a parent row to its submenu popup, the pointer briefly crosses sibling rows. If a sibling takes the highlight, the open submenu collapses and the menu feels unstable.

The aim guard infers intent from the pointer's trajectory and briefly stops the parent menu's other rows from taking the pointer. It is a hybrid (K7) of:

- geometric trajectory projection,
- a temporal lock (a short guard window), and
- continuous re-evaluation after the pointer leaves the trigger.

## 2. Design Goals

- Keep a submenu open while the pointer is heading for its popup.
- Block the other rows only at the depth of the menu the trigger is in.
- Recover quickly when the pointer turns away (no sticky lock).
- Work the same in every menu family member (dropdown, context menu, data-first submenus).
- Cost nothing while idle: no pointer listener unless a trigger is hovered or tracking an exit, no animation frames, no re-renders of rows on guard changes.
- Offer an opt-in debug overlay and logs to tune and verify the geometry.

## 3. Non-Goals

- Exact triangle containment as the only signal.
- Hover behavior for touch (touch pointers are ignored).
- Drawing the overlay for vertical anchors (top and bottom are computed but not drawn).

## 4. Architecture

| Piece | Where | Does |
| --- | --- | --- |
| Geometry | `packages/menu-core/src/aim-guard/aim-guard.ts` | Anchor side, smoothed heading, projected hit test. Pure functions. |
| `AimGuardController` | `packages/menu-core/src/controllers/aim-guard.ts` | The tree's guard: who holds it, its timeout, one pointer listener for every held trail, popup reports, logs. One per menu root. |
| `AimGuardTrigger` | same file, from `AimGuardController.trigger()` | One submenu trigger's side: reads the pointer leaving the trigger and moving on, keeps its trail, holds and releases the guard for its trigger and depth, shows its decisions to its debug overlay, if it has one. It reaches the tree only through the controller's private link. |
| Debug overlay | `packages/menu-core/src/controllers/aim-guard-overlay.ts` | `createAimGuardOverlay`: one trigger's safe triangle, worked out from the decisions it shows, while something subscribes. The controller makes one per trigger only when it's given the factory (`overlay` option), which the React binding passes in development only. |
| `SubmenuController` | `packages/menu-core/src/controllers/submenu.ts` | Decides what each reading means in each state (`idle`, `open-pending`, `open`, `guarded`, `close-pending`): when to hold, release, open, close, and how long to track the exit. Takes the trigger's `AimGuardTrigger` as its `aimGuard`. |
| React tree binding | `components/submenu-trigger/create-aim-guard.ts`, `hooks/use-aim-guard.tsx` | `createAimGuard(settings)`: the controller on the window's `pointermove`; in development, logging gated on `debug.logAimGuardEvents`, overlay settings from `debug.showSafeTriangleArea` and the overlay factory. The tree's first submenu trigger makes it on the tree tier (`ensureAimGuard`); a tree with no submenu has none. `useAimGuardRefs()` gives listbox rows their `AimGuardRefs`, which read the tier's guard when read (idle while there's none). |
| React trigger binding | `components/submenu-trigger/use-submenu-aim-guard.ts` | Makes the trigger's `AimGuardTrigger` with getters for the trigger's and popup's rects, configures it, disposes it, and subscribes to its overlay only while the debug flag is on. |
| Submenu trigger | `components/submenu-trigger/submenu-trigger.tsx`, `use-submenu-controller.ts` | Sends pointer events to the `SubmenuController`, holds the hover trail while hovered, renders the overlay. |
| Popup | `components/popup/popup.tsx` | Reports the pointer over a submenu popup (`pointerInPopup`), from its `onPointerEnter` and `onPointerMove`, composed after the consumer's props. |
| Rows | `hooks/use-popup-menu-item.ts`, `internal/listbox/hooks/use-listbox-item.ts` | A row at the guarded depth doesn't take the pointer highlight. |
| Overlay | `components/submenu-trigger/submenu-safe-triangle-area.tsx` | Draws the safe triangle from the trigger's debug snapshot. |

Only `AimGuardRefs` (`internal/listbox`) is published; everything else here is internal.

## 5. The Guard

`AimGuardState` is `{ active, triggerId, depth, submenuSurfaceId }`:

- `triggerId`: the trigger whose row is protected.
- `depth`: the depth of the menu that trigger is in. Only that menu's rows are blocked, so the submenu's own rows and nested triggers stay interactive.
- `submenuSurfaceId`: the popup the pointer is heading to. A report that the pointer is over that popup releases the guard.

Holding it for 600 ms (a hit), releasing it, and its timeout change the state; `subscribe` is told once per real change, and `getSnapshot` returns a new object only then. A trigger holds and releases through its `AimGuardTrigger`:

- `hold(ms)` for its own trigger and depth;
- `release()` releases whoever holds it (the pointer entered a trigger, or left one with a miss);
- `releaseOwn()` releases it only if this trigger holds it (its submenu closed, the trigger hid or unmounted);
- `isBlocked()` is whether another trigger at the same depth holds it.

Rows read it as refs whose `current` reads the state when read, so a row's pointer handler always sees the guard as it is, and no row re-renders when it changes.

## 6. Geometry

### 6.1 `resolveAnchorSide(rect, triggerRect, mx, my?)`

Which side of the submenu popup the trigger is on: from the trigger's center (or the pointer when there is no trigger rect). Outside the popup, the side with the largest gap; inside, the nearest edge. This handles flipped and non-right-opening submenus.

### 6.2 `getSmoothedHeading(trail, exitX, exitY, anchor, triggerRect, rect)`

The sum of up to 4 recent deltas of the trail. Below a magnitude of 0.5, it falls back to the direction from the trigger's center to the middle of the popup's entry edge.

A trigger's trail starts empty when it starts recording. A fast pass may leave a single sample; the leave point is then added so the heading comes from the real path. An empty trail means the pointer never moved over the trigger (the trigger moved under it, by scrolling or a layout shift), and the leave counts as a miss.

### 6.3 `willHitSubmenu(exitX, exitY, heading, rect, anchor, triggerRect)`

Projects the heading onto the popup's entry edge and checks the cross-axis coordinate against the popup's bounds plus a small band:

1. The primary axis is `dx` for left and right anchors, `dy` for top and bottom.
2. A primary component under 0.01, or one pointing away from the anchor, is a miss.
3. `t` is where the heading reaches the edge; `t <= 0` is a miss.
4. The band is `extra = clamp(triggerCrossSize * 0.75 (or 28), 12, 36)`, and the bounds grow by `extra * 0.25` on each side.

## 7. A Pointer Leaving a Trigger

The trigger binding filters DOM events (consumer `preventDefault`, disabled, non-mouse pointers, pointer moves under 1 px) and sends the rest to its `SubmenuController`, which asks its `AimGuardTrigger` for geometry:

1. `pointer.enter` / `pointer.move`: a trigger blocked by another trigger's guard at its depth does nothing. Otherwise it takes the highlight. Then, only with `openOnHighlight` on and auto-open not suppressed (`suppressAutoOpen`, set by an explicit close and cleared when the trigger loses the highlight): entering releases any guard and cancels pending close and tracking, and opens a closed submenu now or after the pointer delay; moving opens a closed one the same way, keeping a delay already running. A hover open the submenu refuses (disabled, or its consumer canceled it or hasn't applied it) asks once per gesture: entering and moving don't ask again until the pointer leaves, the trigger loses the highlight or hides, or the submenu opens.
2. `pointer.leave`: the pending open is cancelled, then `leave(point)` reads the pointer:
   - no popup rect: release; with `closeOnPointerLeave` on, close an open submenu (now, or after `closeDelay`), otherwise it stays `open`;
   - inside the popup: release; the submenu stays open;
   - outside, aiming at the popup: hold the guard for 600 ms, keep the trigger highlighted and the submenu open, and track the exit for 600 ms (if the submenu's consumer cancels the open, or the close policy refuses it, the guard is released and nothing is tracked; a controlled submenu whose consumer took the open holds the guard and tracks while its `open` prop follows, bounded by the guard's timeout);
   - outside, missing it: release; with `closeOnPointerLeave` on, close an open submenu, or with `closeDelay` wait it out while tracking the exit for that long; with it off, the submenu stays `open` and nothing is tracked.
3. While tracking, `watch()` adds a second pointer listener (mouse-like moves only), and each move is read by `track(point)`:
   - in `guarded`, moving back by 2 px or more along the anchor axis, or a heading that misses, releases the guard; with `closeOnPointerLeave` on it then closes (or waits out `closeDelay`, tracking for that long), and with it off it stops tracking and stays `open`;
   - in `close-pending`, a heading that hits holds the guard again, keeps the submenu open, and tracks for 600 ms;
   - inside the popup, or once the popup has no rect, tracking ends.
4. The pointer over the submenu's popup (`pointerInPopup`) releases a guard on the way there and tells the trigger, which ends any pending close and tracking.

## 8. Pointer Trail

A trigger records its trail (last 4 points, every pointer type) while a reason holds it:

- `hover`: from pointer enter (or the first move over the trigger) until after the leave is read, or until the trigger hides;
- `monitor`: while its exit is tracked, held before the tracking listener is added, so each move reaches the trail first.

One listener records every held trail of the tree; with no trail held it is removed. So the window has no `pointermove` listener while idle, one while a trigger is hovered, and two while an exit is tracked.

## 9. Timing and Thresholds

- Guard and exit tracking after a hit: 600 ms
- Exit tracking after a miss: `closeDelay`
- Keyboard open delay: 150 ms by default; pointer open delay: 0 ms by default
- Close delay: 0 ms by default (per trigger)
- Moving back: 2 px along the anchor axis
- Near-zero heading: 0.01 on the primary axis; slow-motion fallback: magnitude under 0.5

## 10. Debug Overlay and Logs

Set on the root's `debug` prop, in development builds only: a production build (`process.env.NODE_ENV === 'production'`) ignores the prop and drops the overlay, its default settings, the log calls and their event names.

- `showSafeTriangleArea`: the overlay. A trigger's overlay is worked out only while its binding subscribes (`subscribeDebug`), which it does only while the flag is on. Tones: `hover` (live rects), `activated` (a hit; frozen on the reading with `freezeOnPointerLeave`), `missed` (for `missFreezeDuration`, with `showMissState`). An activated triangle goes when the guard stops being its trigger's, unless `persistOnSuccess`, and when its submenu closes. It is drawn in a portal on `document.body`, for left and right anchors only.
- `logAimGuardEvents`: console logs, `[PopupMenu][AimGuardProvider] <event>` for the guard (`activate`, `clear`, `timeout-expired`, `provider-unmount-clear`) and `[PopupMenu][AimGuard] <event>` for a trigger's readings and decisions (`pointerleave-hit-activate-guard`, `pointerleave-miss-close`, `leave-monitor-reversal-close`, …). Details are built only while logging.

## 11. Testing

- `packages/menu-core/src/aim-guard/aim-guard.test.ts`: the geometry.
- `packages/menu-core/src/controllers/aim-guard.test.ts`: the guard, the trail, a trigger's geometry and its overlay, on a fake clock and a fake pointer.
- `packages/menu-core/src/controllers/submenu.test.ts`: every Submenu Controller transition, on a fake guard.
- `packages/react/src/internal/popup-menu/popup-menu.test.tsx`, `pointer-trail.test.tsx`, `row-renders.test.tsx`: the DOM behavior, window listeners, logs and render budgets.
- `packages/react/src/context-menu/root/idle-frames.browser.test.tsx`: no animation frames while idle, with or past a submenu.

## 12. Change Safety Checklist

When changing aim guard logic, check that:

- blocking still affects only the trigger's own menu depth;
- the guard is released on reaching the popup, on the submenu closing, on the trigger hiding or unmounting, and on timeout;
- a delayed close can still be cancelled by renewed intent;
- a sibling submenu still opens after the timeout;
- touch input still doesn't hover-open or get tracked;
- nothing listens to the pointer, and no animation frame runs, while idle.

```bash
bun run test --filter @bazza-ui/menu-core
cd packages/react && bunx vitest run src/internal/popup-menu src/context-menu
```
