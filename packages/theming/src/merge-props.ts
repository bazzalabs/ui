import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import type { ClassNameValue } from 'tailwind-merge'
import { cn } from './cn.js'
import type { SlotPropMergeStrategy } from './types.js'

export const HANDLER_KEYS = [
  'onClick',
  'onKeyDown',
  'onKeyUp',
  'onMouseDown',
  'onMouseUp',
  'onMouseEnter',
  'onMouseLeave',
  'onPointerDown',
  'onPointerUp',
  'onFocus',
  'onBlur',
] as const

/** Merge two sets of React props (className, handlers, refs, styles are composed). */
export function mergeProps<
  A extends Record<string, any>,
  B extends Record<string, any>,
>(base: A | undefined, overrides?: B): A & B {
  const a: any = base ?? {}
  const b: any = overrides ?? {}
  const merged: any = { ...a, ...b }
  if (a.className || b.className)
    merged.className = cn(a.className, b.className)
  for (const key of HANDLER_KEYS) {
    const aH = a[key]
    const bH = b[key]
    if (aH || bH) merged[key] = composeEventHandlers(aH, bH)
  }
  if (a.ref || b.ref) merged.ref = composeRefs(a.ref, b.ref)
  if (a.style || b.style) {
    merged.style = { ...a.style, ...b.style }
  }
  return merged
}

export function mergeClassNames<T extends Record<string, ClassNameValue>>(
  a: T,
  b: T,
) {
  const merged: Record<string, ClassNameValue> = {}

  Object.keys(a).forEach((key) => {
    merged[key] = a[key]
  })

  Object.keys(b).forEach((key) => {
    merged[key] = cn(a[key] ?? '', b[key])
  })

  return merged
}

/**
 * Custom merge function for positioner props with root/sub structure.
 * Merges { root: {...}, sub: {...} } objects by merging root and sub separately.
 */
export function mergePositionerProps(a?: any, b?: any): any {
  if (!a && !b) return {}
  if (!a) return b ?? {}
  if (!b) return a

  // Check if either has root/sub structure
  const hasStructure = (obj: any) => obj && (obj.root || obj.sub)

  if (!hasStructure(a) && !hasStructure(b)) {
    // Neither has structure, just merge normally
    return mergeProps(a, b)
  }

  // Merge root and sub separately
  return {
    root: mergeProps(a?.root, b?.root),
    sub: mergeProps(a?.sub, b?.sub),
  }
}

export function mergeSlotProps<TSlotProps extends Record<string, any>>(
  a?: Partial<TSlotProps>,
  b?: Partial<TSlotProps>,
  strategy?: SlotPropMergeStrategy<TSlotProps>,
): Partial<TSlotProps> {
  if (!a && !b) return {}
  if (!a) return b ?? {}
  if (!b) return a

  const merged: Partial<TSlotProps> = {}
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
    keyof TSlotProps
  >

  for (const key of allKeys) {
    const aVal = a[key as any]
    const bVal = b[key as any]
    const keyStrategy = strategy?.[key as keyof TSlotProps]

    if (typeof keyStrategy === 'function') {
      // Custom merge function
      merged[key] = keyStrategy(aVal, bVal)
    } else {
      // Default shallow merge
      merged[key] = mergeProps(aVal, bVal)
    }
  }

  return merged
}
