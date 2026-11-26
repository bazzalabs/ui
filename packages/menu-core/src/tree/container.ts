import type { AnyNodeDef } from './node-def-map.js'

/**
 * How a Container's rows are selected: `'none'` for a group, `'single'` for a
 * radio group, `'multiple'` for a checkbox group.
 */
export type ContainerSelection = 'none' | 'single' | 'multiple'

/** The public def kinds that are Containers. */
export type ContainerKind = 'group' | 'radio-group' | 'checkbox-group'

/** A Container's def: a group, radio group, or checkbox group def. */
export type ContainerNodeDef<D extends AnyNodeDef = AnyNodeDef> = Extract<
  D,
  { kind: ContainerKind }
>

const selectionByKind: Readonly<Record<ContainerKind, ContainerSelection>> = {
  group: 'none',
  'radio-group': 'single',
  'checkbox-group': 'multiple',
}

/** Whether `kind` is one of the Container kinds. */
export function isContainerKind(kind: string): kind is ContainerKind {
  // An own key, so `Object.prototype` names never count.
  return Object.hasOwn(selectionByKind, kind)
}

/** Whether a def is a Container: a group, radio group, or checkbox group. */
export function isContainerDef<D extends AnyNodeDef>(
  def: D,
): def is ContainerNodeDef<D> {
  return isContainerKind(def.kind)
}

/** The selection mode of a Container kind. */
export function selectionOf(kind: ContainerKind): ContainerSelection {
  return selectionByKind[kind]
}

/**
 * A def read as a Container: what the Menu Tree and the data pipeline need
 * from a group, radio group, or checkbox group, whichever kind it was
 * authored as.
 */
export interface Container {
  selection: ContainerSelection
  id: string
  label: string | undefined
  /**
   * A hidden Container and its rows don't show. A radio or checkbox group is
   * hidden by a truthy `hidden`; a plain group has no `hidden` and never is.
   */
  hidden: boolean
}

/** A def read as a Container, or `null` when it isn't one. */
export function containerOf(def: AnyNodeDef): Container | null {
  if (!isContainerDef(def)) return null
  return {
    selection: selectionOf(def.kind),
    id: def.id,
    label: def.label,
    hidden: def.kind !== 'group' && Boolean(def.hidden),
  }
}
