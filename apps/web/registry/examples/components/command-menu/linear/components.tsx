'use client'

import type {
  AsyncNodesConfig,
  CheckboxItemDef,
  CheckboxItemRenderParams,
  GroupDef,
  ItemDef,
  ItemRenderParams,
  NodeDef,
  RowRenderContext,
  SeparatorDef,
  SubpageContentRenderParams,
  SubpageDef,
  SubpageTriggerRenderParams,
} from '@bazza-ui/react/command-menu'
import { useDataList } from '@bazza-ui/react/command-menu'
import type * as React from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { CommandMenu, LabelWithBreadcrumbs } from '@/registry/ui/command-menu'

export type LabelRecord = {
  id: string
  name: string
  color: string
}

export type AssigneeRecord = {
  id: string
  name: string
  username: string
  role: string
}

export const LABEL_STYLES_BG = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  neutral: 'bg-neutral-500',
} as const

type TailwindColor = keyof typeof LABEL_STYLES_BG

function initialsForName(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

function RowLabel({
  label,
  context,
}: {
  label: string
  context: RowRenderContext
}) {
  return (
    <LabelWithBreadcrumbs
      label={label}
      breadcrumbs={context.isDeepSearchResult ? context.breadcrumbs : undefined}
    />
  )
}

function SubpageHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <CommandMenu.Header className="gap-3 py-2.5">
      <CommandMenu.SubpageBack />
      <div className="min-w-0 flex-1">
        <div className="truncate text-foreground">{title}</div>
        {description ? <div className="truncate">{description}</div> : null}
      </div>
      <CommandMenu.Kbd keys="backspace" />
    </CommandMenu.Header>
  )
}

function SubpageBackRow({ pageId }: { pageId: string }) {
  return (
    <CommandMenu.SubpageBackItem
      forceMount
      keywords={['back', 'previous']}
      value={`${pageId}-back`}
    >
      <CommandMenu.Icon>
        <span aria-hidden="true" className="text-xs leading-none">
          ←
        </span>
      </CommandMenu.Icon>
      Back
      <CommandMenu.Shortcut>
        <CommandMenu.Kbd keys="backspace" />
      </CommandMenu.Shortcut>
    </CommandMenu.SubpageBackItem>
  )
}

export function LabelDot({
  color,
  className,
}: {
  color: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'size-2.5 rounded-full',
        LABEL_STYLES_BG[color as TailwindColor] ?? 'bg-neutral-500',
        className,
      )}
    />
  )
}

export function AssigneeAvatar({
  assignee,
  className,
}: {
  assignee: AssigneeRecord
  className?: string
}) {
  return (
    <Avatar className={cn('size-4', className)}>
      <AvatarImage
        alt={`@${assignee.username}`}
        src={`https://github.com/${assignee.username}.png`}
      />
      <AvatarFallback className="text-[8px]">
        {initialsForName(assignee.name)}
      </AvatarFallback>
    </Avatar>
  )
}

export function CommandMenuRows() {
  const { nodes, renderNode } = useDataList()

  return <>{nodes.map(renderNode)}</>
}

export function createGroupNode(
  id: string,
  label: string,
  nodes: NodeDef[],
): GroupDef {
  return {
    kind: 'group',
    id,
    label,
    nodes,
    render: ({ props, children, context }) => (
      <CommandMenu.Group {...props}>
        <CommandMenu.GroupLabel>{context.label}</CommandMenu.GroupLabel>
        {children}
      </CommandMenu.Group>
    ),
  }
}

export function createSeparatorNode(id: string): SeparatorDef {
  return {
    kind: 'separator',
    id,
    render: ({ props }) => <CommandMenu.Separator {...props} />,
  }
}

export function createItemNode({
  id,
  label,
  icon,
  keywords,
  shortcut,
  disabled,
  closeOnClick,
  onSelect,
}: {
  id: string
  label: string
  icon?: React.ReactNode
  keywords?: string[]
  shortcut?: string
  disabled?: boolean
  closeOnClick?: boolean
  onSelect?: () => void
}): ItemDef {
  return {
    kind: 'item',
    id,
    value: label,
    keywords,
    shortcut,
    disabled,
    closeOnClick,
    onSelect,
    render: ({ props, context }: ItemRenderParams) => (
      <CommandMenu.Item {...props}>
        {icon ? <CommandMenu.Icon>{icon}</CommandMenu.Icon> : null}
        <RowLabel context={context} label={label} />
        {shortcut ? (
          <CommandMenu.Shortcut>
            <CommandMenu.Kbd keys={shortcut} />
          </CommandMenu.Shortcut>
        ) : null}
      </CommandMenu.Item>
    ),
  }
}

export function createAssigneeItemNode({
  assignee,
  selected,
  onSelect,
}: {
  assignee: AssigneeRecord
  selected: boolean
  onSelect: (assignee: AssigneeRecord) => void
}): ItemDef {
  return {
    kind: 'item',
    id: `assignee-${assignee.id}`,
    value: assignee.name,
    keywords: [assignee.name, assignee.username, assignee.role],
    onSelect: () => {
      onSelect(assignee)
      toast(`Assigned UI-331 to ${assignee.name}.`)
    },
    render: ({ props, context }: ItemRenderParams) => (
      <CommandMenu.Item {...props}>
        <CommandMenu.Icon>
          <AssigneeAvatar assignee={assignee} />
        </CommandMenu.Icon>
        <div className="min-w-0 flex-1">
          <RowLabel context={context} label={assignee.name} />
          <div className="truncate text-xs text-muted-foreground">
            @{assignee.username} · {assignee.role}
          </div>
        </div>
        {selected ? <CommandMenu.Shortcut>Current</CommandMenu.Shortcut> : null}
      </CommandMenu.Item>
    ),
  }
}

export function createLabelCheckboxNode({
  label,
  selected,
  onCheckedChange,
}: {
  label: LabelRecord
  selected: boolean
  onCheckedChange: (labelId: string, checked: boolean) => void
}): CheckboxItemDef {
  return {
    kind: 'checkbox-item',
    id: `label-${label.id}`,
    value: label.name,
    keywords: [label.name, label.color],
    checked: selected,
    closeOnClick: false,
    onCheckedChange: (checked) => {
      onCheckedChange(label.id, checked === true)
    },
    render: ({ props, context }: CheckboxItemRenderParams) => (
      <CommandMenu.CheckboxItem {...props}>
        <CommandMenu.CheckboxItemIndicator className="opacity-0 data-checked:opacity-100 data-unchecked:group-data-[highlighted]/row:opacity-100" />
        <CommandMenu.Icon>
          <LabelDot color={label.color} />
        </CommandMenu.Icon>
        <RowLabel context={context} label={label.name} />
      </CommandMenu.CheckboxItem>
    ),
  }
}

export function createSubpageNode({
  id,
  title,
  description,
  icon,
  nodes,
  inputPlaceholder,
  emptyLabel = 'No matching commands.',
}: {
  id: string
  title: string
  description?: string
  icon: React.ReactNode
  nodes: NodeDef[]
  inputPlaceholder: string
  emptyLabel?: string
}): SubpageDef {
  return {
    kind: 'subpage',
    id,
    value: title,
    deepSearch: true,
    includeInDeepSearch: true,
    nodes,
    renderTrigger: ({ props, context }: SubpageTriggerRenderParams) => (
      <CommandMenu.SubpageTrigger {...props}>
        <div className="flex min-w-0 items-center gap-2">
          <CommandMenu.Icon>{icon}</CommandMenu.Icon>
          <RowLabel context={context} label={title} />
        </div>
        <CommandMenu.Shortcut>
          <CommandMenu.Kbd keys="return" />
        </CommandMenu.Shortcut>
      </CommandMenu.SubpageTrigger>
    ),
    renderContent: ({
      pageId,
      nodes: childNodes,
      renderNode,
    }: SubpageContentRenderParams) => (
      <CommandMenu.Subpage pageId={pageId}>
        <CommandMenu.Surface>
          <SubpageHeader description={description} title={title} />
          <CommandMenu.Input placeholder={inputPlaceholder} />
          <CommandMenu.List>
            <SubpageBackRow pageId={pageId} />
            {childNodes.map(renderNode)}
          </CommandMenu.List>
          <CommandMenu.Empty>{emptyLabel}</CommandMenu.Empty>
        </CommandMenu.Surface>
      </CommandMenu.Subpage>
    ),
  }
}

export function createAsyncSubpageNode({
  id,
  title,
  description,
  icon,
  asyncNodes,
  inputPlaceholder,
  loadingLabel,
  emptyLabel,
}: {
  id: string
  title: string
  description?: string
  icon: React.ReactNode
  asyncNodes: AsyncNodesConfig
  inputPlaceholder: string
  loadingLabel: string
  emptyLabel: string
}): SubpageDef {
  return {
    kind: 'subpage',
    id,
    value: title,
    keywords: [title, 'people', 'user', 'teammate'],
    deepSearch: true,
    includeInDeepSearch: true,
    asyncNodes,
    renderTrigger: ({ props, context }: SubpageTriggerRenderParams) => (
      <CommandMenu.SubpageTrigger {...props}>
        <div className="flex min-w-0 items-center gap-2">
          <CommandMenu.Icon>{icon}</CommandMenu.Icon>
          <RowLabel context={context} label={title} />
        </div>
        <CommandMenu.Shortcut>
          <CommandMenu.Kbd keys="return" />
        </CommandMenu.Shortcut>
      </CommandMenu.SubpageTrigger>
    ),
    renderContent: ({
      pageId,
      nodes,
      asyncContent,
    }: SubpageContentRenderParams) => (
      <CommandMenu.Subpage pageId={pageId}>
        <CommandMenu.Surface asyncContent={asyncContent} content={nodes}>
          <SubpageHeader description={description} title={title} />
          <CommandMenu.Input placeholder={inputPlaceholder} />
          <CommandMenu.List>
            <SubpageBackRow pageId={pageId} />
            <CommandMenuRows />
          </CommandMenu.List>
          <CommandMenu.Loading>{loadingLabel}</CommandMenu.Loading>
          <CommandMenu.Empty>{emptyLabel}</CommandMenu.Empty>
        </CommandMenu.Surface>
      </CommandMenu.Subpage>
    ),
  }
}
