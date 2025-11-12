import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import type { ClassNameValue } from 'tailwind-merge'
import type { ActionMenuSlotProps, PositionerSlotProps } from '../types.js'
import { cn } from './cn.js'

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

function mergePositionerSlotProps(
  a: PositionerSlotProps | undefined,
  b: PositionerSlotProps | undefined,
): PositionerSlotProps | undefined {
  if (!a) return b
  if (!b) return a

  const aIsConditional = 'root' in a || 'sub' in a
  const bIsConditional = 'root' in b || 'sub' in b

  if (aIsConditional && bIsConditional) {
    // Both conditional: merge root and sub separately
    return {
      root: mergeProps(a.root, b.root),
      sub: mergeProps(a.sub, b.sub),
    }
  }

  if (bIsConditional) {
    // b overrides with conditional config
    return {
      root: mergeProps(aIsConditional ? a.root : a, b.root),
      sub: mergeProps(aIsConditional ? a.sub : a, b.sub),
    }
  }

  if (aIsConditional) {
    // a is conditional, b is flat - merge b into both root and sub
    return {
      root: mergeProps(a.root, b),
      sub: mergeProps(a.sub, b),
    }
  }

  // Both flat: simple merge
  return mergeProps(a, b)
}

export function mergeSlotProps(
  a?: Partial<ActionMenuSlotProps>,
  b?: Partial<ActionMenuSlotProps>,
): Partial<ActionMenuSlotProps> {
  if (!a && !b) return {}
  if (!a) return b ?? {}
  if (!b) return a

  const merged: Partial<ActionMenuSlotProps> = {}
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
    keyof ActionMenuSlotProps
  >

  for (const key of allKeys) {
    // Special handling for positioner to support root/sub configs
    if (key === 'positioner') {
      merged[key] = mergePositionerSlotProps(a[key], b[key]) as any
    } else {
      merged[key] = mergeProps(a[key], b[key]) as any
    }
  }

  return merged
}
