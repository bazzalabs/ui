// ============================================================================
// Containers
// ============================================================================
//
// Group, RadioGroup and CheckboxGroup are one Container, told apart by their
// selection mode. Rows keep the public `group` / `radioGroup` /
// `checkboxGroup` fields; these helpers are the one place that maps a
// Container to them and back.

import { type ContainerSelection, selectionOf } from '../tree/container.js'
import type { MenuNodeOfKind } from '../tree/menu-node.js'
import type {
  CheckboxGroupBehavior,
  ContainerMenuNode,
  FlattenedNode,
  GroupBehavior,
  PipelineDisplayRowNode,
  PipelineDisplayTypes,
  PipelineMenuNode,
  RadioGroupBehavior,
  RowRenderContext,
} from './types.js'

/** The fields that say which Container a flattened or scored row is in. */
export type ContainerMembership<N extends PipelineMenuNode<N>> = Pick<
  FlattenedNode<PipelineDisplayTypes<N>>,
  'group' | 'radioGroup' | 'checkboxGroup'
>

/** Membership of a row outside any Container. */
export const NO_CONTAINER = {
  group: null,
  radioGroup: null,
  checkboxGroup: null,
} as const

/** The row field that holds a Container of each selection mode. */
function membershipField(
  selection: ContainerSelection,
): 'group' | 'radioGroup' | 'checkboxGroup' {
  switch (selection) {
    case 'none':
      return 'group'
    case 'single':
      return 'radioGroup'
    case 'multiple':
      return 'checkboxGroup'
  }
}

const selections: readonly ContainerSelection[] = ['none', 'single', 'multiple']

/** Membership of the rows found under `container`. */
export function containerMembership<N extends PipelineMenuNode<N>>(
  container: ContainerMenuNode<N>,
): ContainerMembership<N> {
  const { id, label } = container.def
  switch (selectionOf(container.def.kind)) {
    case 'none': {
      const menuNode = container as MenuNodeOfKind<N, 'group'>
      return {
        ...NO_CONTAINER,
        group: { id, label, groupDef: menuNode.def, menuNode },
      }
    }
    case 'single': {
      const menuNode = container as MenuNodeOfKind<N, 'radio-group'>
      return {
        ...NO_CONTAINER,
        radioGroup: { id, label, radioGroupDef: menuNode.def, menuNode },
      }
    }
    case 'multiple': {
      const menuNode = container as MenuNodeOfKind<N, 'checkbox-group'>
      return {
        ...NO_CONTAINER,
        checkboxGroup: { id, label, checkboxGroupDef: menuNode.def, menuNode },
      }
    }
  }
}

/** The Container a row was found in, or `null` for a row outside one. */
export function rowContainerOf<N extends PipelineMenuNode<N>>(
  row: ContainerMembership<N>,
): ContainerMenuNode<N> | null {
  for (const selection of selections) {
    const membership = row[membershipField(selection)]
    if (membership) return membership.menuNode as ContainerMenuNode<N>
  }
  return null
}

/** A row's own membership fields, for a row built from it. */
export function membershipOf<N extends PipelineMenuNode<N>>(
  row: ContainerMembership<N>,
): ContainerMembership<N> {
  const container = rowContainerOf(row)
  return container ? containerMembership(container) : NO_CONTAINER
}

/**
 * How a row Display Node shows the Container it is in: `group` for its
 * render context, and the `radioGroup` or `checkboxGroup` field it carries.
 */
export function displayRowMembership<N extends PipelineMenuNode<N>>(
  container: ContainerMenuNode<N> | null,
): {
  group: RowRenderContext<PipelineDisplayTypes<N>>['group']
  row: Pick<PipelineDisplayRowNode<N>, 'radioGroup' | 'checkboxGroup'>
} {
  if (!container) return { group: null, row: {} }
  const { id, label } = container.def
  switch (selectionOf(container.def.kind)) {
    case 'none':
      return { group: { id, label }, row: {} }
    case 'single':
      return { group: null, row: { radioGroup: { id, label } } }
    case 'multiple': {
      const def = (container as MenuNodeOfKind<N, 'checkbox-group'>).def
      return { group: null, row: { checkboxGroup: { id, label, def } } }
    }
  }
}

/** How the Containers of each selection mode behave during search. */
export interface ContainerSearchBehaviors {
  none: GroupBehavior
  single: RadioGroupBehavior
  multiple: CheckboxGroupBehavior
}
