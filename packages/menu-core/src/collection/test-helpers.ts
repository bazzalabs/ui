// Row builders and readers for the collection tests. Not exported from the
// package.

import type { ContainerSelection } from '../tree/container.js'
import {
  type ContainerRowMeta,
  type ItemRowMeta,
  Pos,
  type RowId,
} from './types.js'

/** An enabled, activatable item row whose text is its id. */
export function item(
  id: RowId,
  fields: Partial<Omit<ItemRowMeta, 'id' | 'kind'>> = {},
): ItemRowMeta {
  return {
    id,
    kind: 'item',
    textValue: id,
    disabled: false,
    activatable: true,
    closeOnClick: true,
    ...fields,
  }
}

/** A Container's row, a group unless `selection` says otherwise. */
export function container(
  id: RowId,
  fields: { containerId?: string; selection?: ContainerSelection } = {},
): ContainerRowMeta {
  return {
    id,
    kind: 'container',
    selection: fields.selection ?? 'none',
    containerId: fields.containerId,
  }
}

const posNames = Object.keys(Pos) as (keyof typeof Pos)[]

/** Each row's `Pos` bits by name, in order. */
export function named(
  positions: ReadonlyMap<RowId, number>,
): Record<RowId, string[]> {
  const result: Record<RowId, string[]> = {}
  for (const [id, bits] of positions) {
    result[id] = posNames.filter((name) => (bits & Pos[name]) !== 0)
  }
  return result
}
