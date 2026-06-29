/**
 * How a popup/menu was opened. Mirrors Base UI's `openMethod`.
 * `'keyboard'` covers any non-pointer activation.
 */
export type OpenMethod = 'mouse' | 'touch' | 'pen' | 'keyboard'

let lastPointerType: 'mouse' | 'touch' | 'pen' | null = null
let tracking = false

function handlePointerDown(event: PointerEvent) {
  lastPointerType = (event.pointerType as 'mouse' | 'touch' | 'pen') || 'mouse'
}

function handleKeyDown() {
  // A keyboard interaction resets pointer modality so a subsequent open is
  // attributed to the keyboard rather than a stale pointer type.
  lastPointerType = null
}

/**
 * Lazily install passive, capture-phase global listeners that track the most
 * recent input modality. Idempotent and SSR-safe.
 *
 * Capturing the modality globally is more reliable than inspecting the open
 * event alone, since synthesized `click` events carry no `pointerType`.
 */
export function ensureInputModalityTracking(): void {
  if (tracking || typeof document === 'undefined') {
    return
  }
  tracking = true
  document.addEventListener('pointerdown', handlePointerDown, {
    capture: true,
    passive: true,
  })
  document.addEventListener('keydown', handleKeyDown, {
    capture: true,
    passive: true,
  })
}

function pointerTypeToOpenMethod(
  pointerType: string | undefined | null,
): OpenMethod | null {
  switch (pointerType) {
    case 'touch':
      return 'touch'
    case 'pen':
      return 'pen'
    case 'mouse':
      return 'mouse'
    default:
      return null
  }
}

/**
 * Determine the {@link OpenMethod} for an open interaction.
 *
 * Resolution order:
 * 1. the triggering event's own `pointerType` (most accurate);
 * 2. an explicit keyboard event;
 * 3. the last globally-observed input modality;
 * 4. `'keyboard'` as a safe default.
 */
export function deriveOpenMethod(event?: Event | null): OpenMethod {
  const fromEvent = pointerTypeToOpenMethod(
    (event as PointerEvent | undefined)?.pointerType,
  )
  if (fromEvent) {
    return fromEvent
  }

  if (
    event &&
    typeof KeyboardEvent !== 'undefined' &&
    event instanceof KeyboardEvent
  ) {
    return 'keyboard'
  }

  return pointerTypeToOpenMethod(lastPointerType) ?? 'keyboard'
}
