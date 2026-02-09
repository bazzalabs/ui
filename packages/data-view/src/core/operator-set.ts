// @bazza-ui/data-view — OperatorSet
// Immutable, composable collection of operator definitions.

import type { OperatorDefinition, OperatorDefinitionInput } from './types.js'

interface OperatorSetConfig {
  defaultSingle?: string
  defaultMultiple?: string
}

/**
 * An immutable, composable collection of `OperatorDefinition` entries.
 *
 * Provides query methods (`.get()`, `.all()`, `.ids()`, `.has()`, `.getDefault()`)
 * and composition methods (`.only()`, `.without()`, `.extend()`, `.replace()`, `.defaults()`)
 * that each return a **new** `OperatorSet` instance.
 */
export class OperatorSet<TId extends string = string> {
  private readonly _map: ReadonlyMap<TId, OperatorDefinition>
  private readonly _config: OperatorSetConfig

  constructor(
    map: Map<TId, OperatorDefinition>,
    config: OperatorSetConfig = {},
  ) {
    this._map = map
    this._config = config
  }

  // ── Query Methods ──────────────────────────────────────

  /** Get an operator definition by id. Throws if not found. */
  get(id: TId): OperatorDefinition {
    const op = this._map.get(id)
    if (!op) {
      throw new Error(
        `[OperatorSet] Operator "${id}" not found. Available: ${[...this._map.keys()].join(', ')}`,
      )
    }
    return op
  }

  /** Returns all operator definitions in insertion order. */
  all(): OperatorDefinition[] {
    return [...this._map.values()]
  }

  /** Returns all operator ids in insertion order. */
  ids(): TId[] {
    return [...this._map.keys()]
  }

  /** Check if an operator id exists in this set. */
  has(id: string): boolean {
    return this._map.has(id as TId)
  }

  /** Returns the number of operators in this set. */
  get size(): number {
    return this._map.size
  }

  /**
   * Get the default operator for a given target ('single' or 'multiple').
   *
   * Resolution order:
   * 1. Explicit default from config (`.defaults()` or `defineOperators` config)
   * 2. First operator matching the requested target
   */
  getDefault(target: 'single' | 'multiple'): OperatorDefinition {
    // Check explicit config
    const explicitId =
      target === 'single'
        ? this._config.defaultSingle
        : this._config.defaultMultiple

    if (explicitId && this._map.has(explicitId as TId)) {
      return this._map.get(explicitId as TId)!
    }

    // Fallback: first operator matching the requested target
    for (const op of this._map.values()) {
      if (op.target === target) return op
    }

    // Last resort: return the first operator regardless of target
    const first = this._map.values().next()
    if (first.done) {
      throw new Error('[OperatorSet] Cannot get default from empty OperatorSet')
    }
    return first.value
  }

  // ── Composition Methods ────────────────────────────────
  // All return new instances (immutable).

  /**
   * Returns a new OperatorSet containing only the specified operators.
   * Preserves original insertion order.
   */
  only<K extends TId>(...ids: K[]): OperatorSet<K> {
    const newMap = new Map<K, OperatorDefinition>()
    for (const id of ids) {
      if (!this._map.has(id)) {
        throw new Error(
          `[OperatorSet.only] Operator "${id}" not found. Available: ${[...this._map.keys()].join(', ')}`,
        )
      }
      newMap.set(id, this._map.get(id)!)
    }
    return new OperatorSet<K>(newMap, { ...this._config })
  }

  /**
   * Returns a new OperatorSet with the specified operators removed.
   */
  without<K extends TId>(...ids: K[]): OperatorSet<Exclude<TId, K>> {
    const newMap = new Map<Exclude<TId, K>, OperatorDefinition>()
    for (const [id, op] of this._map) {
      if (!ids.includes(id as any)) {
        newMap.set(id as Exclude<TId, K>, op)
      }
    }
    return new OperatorSet<Exclude<TId, K>>(newMap, { ...this._config })
  }

  /**
   * Returns a new OperatorSet with additional operators appended.
   * Existing operators are preserved; new operators are added at the end.
   */
  extend<NewId extends string>(
    defs: Record<NewId, OperatorDefinitionInput>,
  ): OperatorSet<TId | NewId> {
    const newMap = new Map<TId | NewId, OperatorDefinition>()

    // Copy existing
    for (const [id, op] of this._map) {
      newMap.set(id, op)
    }

    // Add new
    for (const [id, input] of Object.entries(defs) as [
      NewId,
      OperatorDefinitionInput,
    ][]) {
      newMap.set(id, { ...input, id })
    }

    return new OperatorSet<TId | NewId>(newMap, { ...this._config })
  }

  /**
   * Returns a new OperatorSet with the specified operator's properties overridden.
   * The operator must already exist.
   */
  replace(
    id: TId,
    overrides: Partial<OperatorDefinitionInput>,
  ): OperatorSet<TId> {
    if (!this._map.has(id)) {
      throw new Error(
        `[OperatorSet.replace] Operator "${id}" not found. Available: ${[...this._map.keys()].join(', ')}`,
      )
    }

    const newMap = new Map<TId, OperatorDefinition>()
    for (const [key, op] of this._map) {
      if (key === id) {
        newMap.set(key, { ...op, ...overrides, id: key })
      } else {
        newMap.set(key, op)
      }
    }

    return new OperatorSet<TId>(newMap, { ...this._config })
  }

  /**
   * Returns a new OperatorSet with updated default operator config.
   */
  defaults(config: { single?: TId; multiple?: TId }): OperatorSet<TId> {
    return new OperatorSet<TId>(new Map(this._map), {
      ...this._config,
      defaultSingle: config.single ?? this._config.defaultSingle,
      defaultMultiple: config.multiple ?? this._config.defaultMultiple,
    })
  }
}

// ── Factory ────────────────────────────────────────────────

/**
 * Creates an `OperatorSet` from a plain record of operator definitions.
 *
 * @example
 * ```typescript
 * const textOperators = defineOperators({
 *   'contains': { label: 'contains', target: 'single', match: (cell, [q]) => cell.includes(q) },
 *   'does not contain': { label: 'does not contain', target: 'single', match: (cell, [q]) => !cell.includes(q) },
 * })
 * ```
 */
export function defineOperators<TId extends string>(
  definitions: Record<TId, OperatorDefinitionInput>,
  config?: { defaultSingle?: TId; defaultMultiple?: TId },
): OperatorSet<TId> {
  const map = new Map<TId, OperatorDefinition>()

  for (const [id, input] of Object.entries(definitions) as [
    TId,
    OperatorDefinitionInput,
  ][]) {
    map.set(id, { ...input, id })
  }

  return new OperatorSet<TId>(map, {
    defaultSingle: config?.defaultSingle,
    defaultMultiple: config?.defaultMultiple,
  })
}
