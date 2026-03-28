# Popup Menu Aim Guard Architecture

## Document Status

- Status: Implemented (matches current code)
- Scope: `packages/react/src/internal/popup-menu`
- Audience: Maintainers of popup menu, listbox, and submenu behavior
- Last reviewed against code: 2026-02-27

## 1. Problem Statement

Nested popup menus have a well-known failure mode: while moving diagonally from a parent row to its submenu popup, the pointer briefly crosses sibling rows. If sibling highlight wins, the active submenu collapses and the experience feels unstable.

The aim guard subsystem solves this by inferring user intent from pointer trajectory and temporarily guarding sibling highlight/close behavior.

This implementation is not a static triangle-only algorithm. It is a hybrid of:

- geometric trajectory projection,
- temporal lock (short guard window), and
- continuous re-evaluation after pointer leave.

## 2. Design Goals

- Preserve submenu openness when pointer movement suggests intent toward submenu popup.
- Block sibling row takeover only in the relevant menu depth.
- Recover quickly when intent changes away (no sticky lock-in).
- Work with both dropdown and context menu trees.
- Avoid expensive rerenders in pointer-heavy paths.
- Provide opt-in debug visualization to validate geometry and tuning.

## 3. Non-Goals

- Exact geometric triangle containment as the only signal.
- Touch-first hover behavior (touch pointer hover is intentionally ignored).
- Full vertical safe-triangle rendering in debug overlay (top/bottom anchors are computed but not visualized).

## 4. High-Level Architecture

The subsystem is split into four layers:

1. Geometry and intent math (`utils/aim-guard.ts`)
2. Shared guard state and lifecycle (`hooks/use-aim-guard.tsx`)
3. Trigger-side event orchestration (`components/submenu-trigger/submenu-trigger.tsx`)
4. Popup-side guard finalization (`components/popup/popup.tsx`)

### 4.1 Module Map

| Module | Responsibility |
| --- | --- |
| `packages/react/src/internal/popup-menu/utils/aim-guard.ts` | Anchor detection, heading smoothing, projected hit-test |
| `packages/react/src/internal/popup-menu/utils/use-mouse-trail.ts` | Global pointer trail buffer shared by subscribers |
| `packages/react/src/internal/popup-menu/hooks/use-aim-guard.tsx` | Global guard state, refs, timer, activation/clear API |
| `packages/react/src/internal/popup-menu/hooks/use-popup-menu-item.ts` | Bridges guard refs into listbox item behavior |
| `packages/react/src/internal/listbox/hooks/use-listbox-item.ts` | Depth-scoped pointer highlight blocking |
| `packages/react/src/internal/popup-menu/components/submenu-trigger/submenu-trigger.tsx` | Pointer enter/move/leave logic, monitor loop, guard transitions |
| `packages/react/src/internal/popup-menu/components/popup/popup.tsx` | Clears guard once pointer enters guarded submenu popup |
| `packages/react/src/internal/popup-menu/components/submenu-trigger/submenu-safe-triangle-area.tsx` | Debug-only overlay rendering |
| `packages/react/src/internal/popup-menu/contexts/popup-menu-debug-context.ts` | Debug configuration parsing/defaults |

## 5. Context and State Model

Aim guard is provided once per popup-menu tree by `PopupMenuProviders` via `AimGuardProvider`.

### 5.1 Guard Context State

`AimGuardContextValue` keeps both React state and ref mirrors:

- `aimGuardActive: boolean`
- `guardedTriggerId: string | null`
- `guardedDepth: number | null`
- `guardedSubmenuSurfaceId: string | null`

Ref mirrors (`aimGuardActiveRef`, etc.) are used in high-frequency pointer handlers to avoid stale closures and avoid rerender coupling.

### 5.2 Why Trigger + Depth + Surface ID?

- `guardedTriggerId` identifies which row is protected.
- `guardedDepth` scopes blocking to the parent menu depth only.
- `guardedSubmenuSurfaceId` identifies the destination popup that should clear guard on successful entry.

This prevents over-blocking unrelated menu levels and lets the popup side confidently clear only when the pointer reaches the intended submenu.

## 6. Geometry Engine

Implemented in `packages/react/src/internal/popup-menu/utils/aim-guard.ts`.

### 6.1 `resolveAnchorSide(rect, triggerRect, mx, my?)`

Determines which side of submenu popup the trigger is anchored to.

- Preferred input: `triggerRect` center relative to `rect`.
- Fallback: pointer position (`mx`, `my`).
- Supports `left | right | top | bottom`.

Behavior:

- If outside submenu rect, choose side with the largest gap.
- If inside rect, choose nearest edge.

This supports flipped placements and non-right-opening submenus.

### 6.2 `getSmoothedHeading(trail, exitX, exitY, anchor, triggerRect, rect)`

Computes a smoothed vector `(dx, dy)` from recent pointer trail segments.

- Uses up to 4 recent deltas.
- If magnitude is very low (`< 0.5`), infers fallback direction from trigger center toward submenu edge center.

The fallback avoids a zero-vector decision when pointerleave event is nearly stationary.

### 6.3 `willHitSubmenu(exitX, exitY, heading, rect, anchor, triggerRect)`

Projects heading to the submenu entry edge and checks if projected cross-axis coordinate lands in an expanded acceptance band.

Algorithm summary:

1. Pick primary axis (`dx` for horizontal anchors, `dy` for vertical anchors).
2. Reject near-zero primary velocity (`abs(primary) < 0.01`).
3. Reject wrong direction by anchor sign.
4. Compute intersection parameter `t` with anchor edge.
5. Reject if `t <= 0` (not moving toward the relevant edge).
6. Compute projected cross-axis coordinate.
7. Accept if inside `[min, max]` where range is submenu bounds plus small expansion.

Band expansion is based on trigger cross-size:

- `baseBand = triggerCrossSize * 0.75` (or default 28)
- `extra = clamp(baseBand, 12, 36)`
- final bounds extend by `extra * 0.25`

This gives tolerance for human motion jitter without over-accepting clearly wrong trajectories.

## 7. Pointer Event Pipeline

Primary orchestration is in `packages/react/src/internal/popup-menu/components/submenu-trigger/submenu-trigger.tsx`.

### 7.1 Pointer Enter (`onPointerEnter`)

- Ignore non-mouse-like pointers.
- If guard blocks this trigger at the same parent depth (different guarded row), do nothing.
- Highlight this row.
- Clear existing guard and pending close/monitor timers.
- Open submenu immediately or after pointer delay.

Depth scoping here is intentional: a parent-depth guard should not suppress pointer handling for nested destination triggers inside the already-open submenu.

### 7.2 Pointer Move (`onPointerMove`)

- Ignore disabled/non-mouse-like events.
- Require real movement via `parentStore.shouldAllowPointerHighlight(x, y)`.
- If guard active at this depth and guarded row is different, block highlight/open.
- Otherwise highlight row and optionally open submenu (with delay rules).

### 7.3 Pointer Leave (`onPointerLeave`)

Core decision point:

1. Cancel pending open timer.
2. Capture content rect and trigger rect.
3. If pointer already inside popup bounds, treat as success (keep open, clear close pressure).
4. Else compute `anchor`, `heading`, and `hit`.
5. If hit:
   - activate guard for 600ms,
   - keep row highlighted,
   - keep submenu open,
   - start leave monitor for continuous checks.
6. If miss:
   - clear guard,
   - schedule close (immediate or delayed),
   - optionally start leave monitor during close-delay window.

## 8. Continuous Intent Monitoring

`startLeaveMonitor(...)` sets a temporary `window.pointermove` listener after leave.

It tracks whether intent flips over time rather than assuming leave-time decision is final.

### 8.1 Reversal Fast Path

If initial state was hit, and axis delta indicates movement away from submenu by threshold (`2px`), monitor immediately drops guard and triggers close path.

This avoids stale protection when user changes direction right after leaving.

### 8.2 Dynamic Hit/Miss Transitions

On each monitor pointermove:

- recompute heading using live trail,
- recompute hit with `willHitSubmenu`,
- if state flips miss->hit: reactivate guard and keep submenu open,
- if state flips hit->miss: clear guard and close/schedule close.

Monitor exits when:

- pointer enters popup,
- timeout expires,
- explicit cleanup occurs.

## 9. Guard Enforcement in Listbox Layer

Actual highlight suppression happens in listbox item pointer move logic.

Flow:

- `usePopupMenuItem` injects aim guard refs into `useListboxItem`.
- `useListboxItem` checks guard only when `guardedDepthRef.current === depth`.
- If active at same depth, pointer highlight is blocked.

This is the key depth-scoping behavior that lets submenu internals remain interactive while parent sibling rows are temporarily frozen.

## 10. Popup-Side Guard Completion

`PopupMenuPopup` clears guard when pointer moves inside the guarded submenu popup, but only if:

- this popup is a submenu,
- guard is active,
- `guardedSubmenuSurfaceIdRef.current === surfaceId`.

This guarantees lock is removed when destination is reached, reducing unnecessary blocked hover after successful traversal.

## 11. Interaction with Other Menu Subsystems

### 11.1 Focus Ownership

Focus ownership is independent but coordinated:

- pointer movement in surfaces/popup can transfer focus owner,
- aim guard only controls highlight/open close behavior.

### 11.2 Pointer Debounce

`ListboxStore.shouldAllowPointerHighlight` filters phantom highlights by requiring >1px movement from last pointer position.

This complements aim guard by reducing accidental highlight transitions due to DOM shifts.

### 11.3 Sibling Submenu Closing

Listbox store closes sibling submenus when highlighted row changes. Aim guard reduces unintended highlight changes, indirectly stabilizing submenu openness.

## 12. Timing and Thresholds

Current implementation constants/tuning:

- Guard default in provider API: `450ms`
- Guard duration used by submenu trigger hit path: `600ms`
- Keyboard submenu open delay default: `150ms`
- Pointer submenu open delay default: `0ms`
- Close delay default: `0ms` (configurable per submenu trigger)
- Reversal threshold in monitor: `2px` axis movement away
- Near-zero heading rejection: `0.01` on primary axis
- Slow-motion fallback threshold: heading magnitude `< 0.5`

## 13. Debug Visualization Architecture

Debug mode is configured from root through:

- `debug.showSafeTriangleArea` for visual overlay rendering.
- `debug.logAimGuardEvents` for opt-in aim-guard console diagnostics.

### 13.1 States

- `hover`: blue/idle (by default)
- `activated`: green/success (guard hit)
- `missed`: red/miss (optional)

### 13.2 Rendering

- Overlay is rendered in a portal to `document.body`.
- Uses live pointer position or frozen snapshot captured at leave-time transitions.
- Drawn only for horizontal anchors (`left` and `right`).

### 13.3 Configurable Options

- colors, opacities, stroke and dot styling
- freeze behavior on leave
- persistence on success
- miss state visibility and freeze duration

This debug path is valuable for tuning and regression verification without changing runtime behavior.

## 14. State Machine (Conceptual)

```text
IDLE
  -> (pointerenter trigger) HOVER

HOVER
  -> (pointerleave + hit) GUARD_ACTIVE
  -> (pointerleave + miss) CLOSING or IDLE

GUARD_ACTIVE
  -> (pointer enters guarded popup) IDLE (guard cleared)
  -> (monitor detects reversal/miss) CLOSING or IDLE
  -> (timeout) IDLE

CLOSING
  -> (pointer re-enters trigger/popup or hit transition) GUARD_ACTIVE or HOVER
  -> (delay expires) IDLE (submenu closed)
```

## 15. End-to-End Narrative

1. User hovers submenu row; row highlights and submenu opens.
2. User leaves row diagonally toward submenu.
3. System computes side, heading, and projected hit.
4. If hit, parent-depth sibling highlight is guarded for a short window.
5. While crossing the gap, sibling rows cannot steal highlight.
6. If user keeps moving toward popup, entering popup clears guard and interaction continues.
7. If user reverses away, monitor drops guard and closes submenu quickly.
8. Guard also expires naturally on timeout to prevent stale lock behavior.

## 16. Testing Coverage Snapshot

Implemented tests cover:

- geometry functions (`resolveAnchorSide`, `getSmoothedHeading`, `willHitSubmenu`)
- debug visualization rendering and configuration
- miss/success transitions
- close-delay interactions and cancellation paths
- lifecycle cleanup when root closes
- pointer modality gating (touch blocked, pen allowed)
- continuous monitoring and reversal behavior
- timeout unblocking for sibling submenu activation
- nested destination trigger visualization while parent-depth guard is active
- debug-log gating via `debug.logAimGuardEvents`

Primary files:

- `packages/react/src/internal/popup-menu/utils/aim-guard.test.ts`
- `packages/react/src/internal/popup-menu/popup-menu.test.tsx`
- `packages/react/src/internal/popup-menu/utils/use-mouse-trail.test.tsx`

## 17. Performance Characteristics

- Hot path avoids React state reads in handlers by using refs.
- Mouse trail uses one global listener with subscriber fanout (O(subscribers) per pointermove).
- Monitor listener is short-lived and created only during leave windows.
- Pointer highlight debounce in listbox reduces noisy updates.

Potential pressure points:

- global trail fanout in very large numbers of mounted subscribers,
- high-volume console logging when `debug.logAimGuardEvents` is enabled.

## 18. Known Limitations and Improvement Opportunities

1. `debug.logAimGuardEvents` is intentionally noisy and best kept for diagnostics only.
2. `isGuardBlocking` exists in context but appears unused by current callsites.
3. Debug triangle currently skips vertical anchor visualization.
4. Timing values are duplicated in callsites (for example `600ms`) rather than centralized constants.
5. `useMouseTrail` captures all pointer moves regardless of pointerType; optional filtering could reduce noise.

## 19. Change Safety Checklist

When modifying aim guard logic, verify:

- depth-scoped blocking still only affects parent menu level,
- guard clears on popup entry, submenu close, unmount, and root close,
- delayed close can still be canceled by renewed intent,
- sibling submenu activation still works after timeout,
- touch modality remains non-hover-driven.

Recommended validation command:

```bash
bun run test packages/react/src/internal/popup-menu/popup-menu.test.tsx packages/react/src/internal/popup-menu/utils/aim-guard.test.ts
```

## 20. Summary

The current architecture is robust because it combines geometric intent detection with temporal scoping and continuous post-leave monitoring. It is deliberately conservative about where blocking occurs (same depth only) and aggressive about cleanup when destination is reached or intent changes, which gives stable submenu traversal without making hover feel sticky.
