/**
 * Duration in milliseconds to ignore pointer events after a popup/surface opens.
 *
 * This debounce prevents unintended focus transfer when a popup appears under
 * a stationary cursor. Without this debounce, the browser fires pointer events
 * even though the user hasn't moved their mouse, causing the newly appeared
 * popup to immediately steal focus.
 *
 * 100ms is chosen because:
 * - It's long enough to filter out "phantom" pointer events from position changes
 * - It's short enough that intentional mouse movements are captured quickly
 * - Human reaction time for intentional movement is typically >150ms
 *
 * If you experience issues with the debounce being too short (focus still transfers
 * unexpectedly) or too long (menu feels unresponsive), adjust this value.
 */
export const POINTER_EVENT_DEBOUNCE_MS = 100
