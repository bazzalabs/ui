import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import type { ClassNameValue } from 'tailwind-merge'
import type { ActionMenuClassNames, ActionMenuSlotProps } from '../types.js'
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

/** Merge two sets of React props (className, handlers, refs are composed). */
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
    merged[key] = mergeProps(a[key], b[key]) as any
  }

  return merged
}
