import type { PropMeta } from '@/scripts/build-types-meta'

export interface TypeDiff {
  /** Properties only in the derived type (new additions) */
  added: PropMeta[]
  /** Properties that exist in both but have different types */
  modified: PropMeta[]
  /** Properties only in the base type (removed/overridden) */
  removed: PropMeta[]
  /** Properties that are the same in both types */
  unchanged: PropMeta[]
}

/**
 * Compare two types and return the difference
 * Useful for showing what a derived type adds/changes compared to a base type
 */
export function computeTypeDiff(
  baseProps: PropMeta[],
  derivedProps: PropMeta[],
): TypeDiff {
  const basePropMap = new Map(baseProps.map((p) => [p.name, p]))
  const derivedPropMap = new Map(derivedProps.map((p) => [p.name, p]))

  const added: PropMeta[] = []
  const modified: PropMeta[] = []
  const removed: PropMeta[] = []
  const unchanged: PropMeta[] = []

  // Check each property in the derived type
  for (const derivedProp of derivedProps) {
    const baseProp = basePropMap.get(derivedProp.name)

    if (!baseProp) {
      // Property only exists in derived type
      added.push(derivedProp)
    } else if (
      baseProp.type !== derivedProp.type ||
      baseProp.required !== derivedProp.required ||
      baseProp.default !== derivedProp.default
    ) {
      // Property exists in both but is different
      modified.push(derivedProp)
    } else {
      // Property is the same in both
      unchanged.push(derivedProp)
    }
  }

  // Check for properties only in base type (removed/overridden)
  for (const baseProp of baseProps) {
    if (!derivedPropMap.has(baseProp.name)) {
      removed.push(baseProp)
    }
  }

  return { added, modified, removed, unchanged }
}
