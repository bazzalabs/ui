// Type-level tests, checked by `bun run type-check` (the `.test-d.ts` suffix
// keeps this file in packages/react's tsconfig, which leaves out `*.test.ts`).
// Each public node def is pinned to a frozen copy of its shape, so changing
// a field's type or optionality in `@bazza-ui/menu-core` fails here.
import type {
  DisplayNode as CoreDisplayNode,
  NodeDef as CoreNodeDef,
  UnresolvedMenuNode as CoreUnresolvedMenuNode,
} from '@bazza-ui/menu-core'
import type * as React from 'react'
import { expectTypeOf } from 'vitest'
import type {
  CheckboxValueChangeEventDetails,
  CheckedChangeEventDetails,
  RadioValueChangeEventDetails,
} from '../../events.js'
import type {
  PopupMenuNode,
  UnresolvedMenuNode,
} from '../../menu-tree/types.js'
import type {
  AsyncNodesConfig,
  CheckboxGroupDef,
  CheckboxGroupLabelRenderParams,
  CheckboxGroupRenderParams,
  CheckboxItemDef,
  CheckboxItemRenderParams,
  DisplayNode,
  GroupDef,
  GroupLabelRenderParams,
  GroupRenderParams,
  InitialQueryBehavior,
  ItemDef,
  ItemRenderParams,
  LinkItemDef,
  LinkItemRenderParams,
  LoaderComponentProps,
  NodeDef,
  PopupMenuDisplayNodeTypes,
  PopupMenuNodeDefTypes,
  QueryLoaderConfig,
  RadioGroupDef,
  RadioGroupLabelRenderParams,
  RadioGroupRenderParams,
  RadioItemDef,
  RadioItemRenderParams,
  SeparatorDef,
  SeparatorRenderParams,
  StaticLoaderConfig,
  SubmenuDef,
  SubmenuRenderParams,
  SubpageContentRenderParams,
  SubpageDef,
  SubpageTriggerRenderParams,
  TreeItemDef,
  TreeItemRenderParams,
} from '../types.js'

// ----------------------------------------------------------------------------
// Frozen def shapes
// ----------------------------------------------------------------------------

expectTypeOf<ItemDef>().toEqualTypeOf<{
  kind: 'item'
  render: (params: ItemRenderParams) => React.ReactNode
  id?: string
  hidden?: boolean
  forceOrderMinScore?: number
  value: string
  keywords?: string[]
  disabled?: boolean
  onSelect?: () => void
  closeOnClick?: boolean
  shortcut?: string
  forceOrder?: number
  forceScore?: number
}>()

expectTypeOf<LinkItemDef>().toEqualTypeOf<{
  kind: 'link-item'
  href: string
  render: (params: LinkItemRenderParams) => React.ReactNode
  id?: string
  hidden?: boolean
  forceOrderMinScore?: number
  value: string
  keywords?: string[]
  disabled?: boolean
  onSelect?: () => void
  closeOnClick?: boolean
  shortcut?: string
  forceOrder?: number
  forceScore?: number
}>()

expectTypeOf<TreeItemDef>().toEqualTypeOf<{
  kind: 'tree-item'
  selectable?: boolean
  nodes?: NodeDef[]
  deepSearch?: boolean
  render: (params: TreeItemRenderParams) => React.ReactNode
  id?: string
  hidden?: boolean
  forceOrderMinScore?: number
  value: string
  keywords?: string[]
  disabled?: boolean
  onSelect?: () => void
  closeOnClick?: boolean
  forceOrder?: number
  forceScore?: number
}>()

expectTypeOf<RadioItemDef>().toEqualTypeOf<{
  kind: 'radio-item'
  render: (params: RadioItemRenderParams) => React.ReactNode
  id?: string
  hidden?: boolean
  forceOrderMinScore?: number
  value: string
  keywords?: string[]
  disabled?: boolean
  onSelect?: () => void
  closeOnClick?: boolean
  shortcut?: string
  forceOrder?: number
  forceScore?: number
}>()

expectTypeOf<CheckboxItemDef>().toEqualTypeOf<{
  kind: 'checkbox-item'
  value: string
  render: (params: CheckboxItemRenderParams) => React.ReactNode
  id?: string
  hidden?: boolean
  forceOrderMinScore?: number
  checked?: boolean
  onCheckedChange?: (
    checked: boolean,
    eventDetails: CheckedChangeEventDetails,
  ) => void
  keywords?: string[]
  disabled?: boolean
  closeOnClick?: boolean
  forceOrder?: number
  forceScore?: number
}>()

expectTypeOf<SubmenuDef>().toEqualTypeOf<{
  kind: 'submenu'
  nodes?: NodeDef[]
  asyncNodes?: AsyncNodesConfig
  deepSearch?: boolean
  includeInDeepSearch?: true | 'trigger-only' | false
  render: (params: SubmenuRenderParams) => React.ReactNode
  id?: string
  hidden?: boolean
  forceOrderMinScore?: number
  value: string
  keywords?: string[]
  disabled?: boolean
  forceOrder?: number
  forceScore?: number
}>()

expectTypeOf<SubpageDef>().toEqualTypeOf<{
  kind: 'subpage'
  nodes?: NodeDef[]
  asyncNodes?: AsyncNodesConfig
  deepSearch?: boolean
  includeInDeepSearch?: true | 'trigger-only' | false
  renderTrigger: (params: SubpageTriggerRenderParams) => React.ReactNode
  renderContent: (params: SubpageContentRenderParams) => React.ReactNode
  id?: string
  hidden?: boolean
  forceOrderMinScore?: number
  value: string
  keywords?: string[]
  disabled?: boolean
  forceOrder?: number
  forceScore?: number
}>()

expectTypeOf<SeparatorDef>().toEqualTypeOf<{
  kind: 'separator'
  id: string
  render?: (params: SeparatorRenderParams) => React.ReactNode
}>()

expectTypeOf<GroupDef>().toEqualTypeOf<{
  kind: 'group'
  id: string
  label?: string
  nodes: NodeDef[]
  render?: (params: GroupRenderParams) => React.ReactNode
  renderLabel?: (params: GroupLabelRenderParams) => React.ReactNode
}>()

expectTypeOf<RadioGroupDef>().toEqualTypeOf<{
  kind: 'radio-group'
  id: string
  label?: string
  hidden?: boolean
  nodes: RadioItemDef[]
  render?: (params: RadioGroupRenderParams) => React.ReactNode
  renderLabel?: (params: RadioGroupLabelRenderParams) => React.ReactNode
  value?: string
  onValueChange?: (
    value: string,
    eventDetails: RadioValueChangeEventDetails,
  ) => void
  disabled?: boolean
}>()

expectTypeOf<CheckboxGroupDef>().toEqualTypeOf<{
  kind: 'checkbox-group'
  id: string
  label?: string
  hidden?: boolean
  value: string[]
  nodes: CheckboxItemDef[]
  render?: (params: CheckboxGroupRenderParams) => React.ReactNode
  renderLabel?: (params: CheckboxGroupLabelRenderParams) => React.ReactNode
  onValueChange?: (
    value: string[],
    eventDetails: CheckboxValueChangeEventDetails,
  ) => void
  disabled?: boolean
}>()

// A branch's loader configs.
expectTypeOf<StaticLoaderConfig>().toEqualTypeOf<{
  type: 'static'
  Loader: React.ComponentType<LoaderComponentProps>
  loadStrategy?: 'eager' | 'lazy'
}>()
expectTypeOf<QueryLoaderConfig>().toEqualTypeOf<{
  type: 'query'
  debounce?: number
  Loader: React.ComponentType<LoaderComponentProps>
  minQueryLength?: number
  initialQueryBehavior?: InitialQueryBehavior | false
  initialQuery?: string
  loadStrategy?: 'eager' | 'lazy'
  belowMinBehavior?: 'empty' | 'placeholder'
  placeholderNodes?: NodeDef[]
}>()
expectTypeOf<InitialQueryBehavior>().toEqualTypeOf<{
  value?: string
  loadWhen?: 'needed' | 'parent-open'
}>()

// ----------------------------------------------------------------------------
// Using the defs
// ----------------------------------------------------------------------------

// A submenu def holds static child defs and an async loader config.
const item = {
  kind: 'item',
  value: 'copy',
  render: ({ props }) => props.value,
} satisfies ItemDef
const submenu: SubmenuDef = {
  kind: 'submenu',
  value: 'more',
  nodes: [item, { kind: 'separator', id: 'sep' }],
  asyncNodes: { type: 'query', Loader: () => null, minQueryLength: 2 },
  render: ({ nodes, renderNode }) => nodes.map(renderNode),
}

// `kind` discriminates the union.
declare const def: NodeDef
if (def.kind === 'submenu') expectTypeOf(def).toEqualTypeOf<SubmenuDef>()
if (def.kind === 'radio-group') {
  expectTypeOf(def.nodes).toEqualTypeOf<RadioItemDef[]>()
}
declare const node: PopupMenuNode<GroupDef>
expectTypeOf(node.kind).toEqualTypeOf<'group'>()

// A field another kind has is an error.
const separator: SeparatorDef = {
  kind: 'separator',
  id: 'sep',
  // @ts-expect-error separators have no value
  value: 'sep',
}
const group: NodeDef = {
  kind: 'group',
  id: 'g',
  nodes: [separator],
  // @ts-expect-error only branches load async nodes
  asyncNodes: { type: 'static', Loader: () => null },
}
// @ts-expect-error an item def needs its render callback
const unrendered: ItemDef = { kind: 'item', value: 'copy' }
void [submenu, group, unrendered]

// ----------------------------------------------------------------------------
// Unions spelled out in packages/react cover menu-core's
// ----------------------------------------------------------------------------

// `NodeDef`, `DisplayNode`, and `UnresolvedMenuNode` keep their own spelling
// because the docs print it; these catch a kind added to menu-core only.
expectTypeOf<NodeDef>().toEqualTypeOf<CoreNodeDef<PopupMenuNodeDefTypes>>()
expectTypeOf<DisplayNode>().toEqualTypeOf<
  CoreDisplayNode<PopupMenuDisplayNodeTypes>
>()
expectTypeOf<UnresolvedMenuNode>().toEqualTypeOf<
  CoreUnresolvedMenuNode<PopupMenuNode>
>()
