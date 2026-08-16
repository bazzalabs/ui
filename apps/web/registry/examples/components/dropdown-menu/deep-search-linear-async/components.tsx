'use client'

import type {
  AsyncNodesConfig,
  CheckboxItemDef,
  ItemDef,
  ItemRenderParams,
  NodeDef,
  SubmenuDef,
  SubmenuRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import * as React from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  DiamondSpinner,
  DropdownMenu,
  LabelWithBreadcrumbs,
} from '@/registry/ui/dropdown-menu'

export function createSelectionStore(initial: Set<string>) {
  let selectedIds = initial
  const listeners = new Set<() => void>()
  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => selectedIds,
    set(id: string, checked: boolean) {
      const next = new Set(selectedIds)
      if (checked) next.add(id)
      else next.delete(id)
      selectedIds = next
      for (const listener of listeners) listener()
    },
  }
}

export type SelectionStore = ReturnType<typeof createSelectionStore>

// =============================================================================
// Label Color Mapping
// =============================================================================

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

export type TW_COLOR = keyof typeof LABEL_STYLES_BG

// =============================================================================
// Label Dot Component
// =============================================================================

export function LabelDot({ color }: { color: string }) {
  return (
    <div
      className={cn(
        'rounded-full size-2.5',
        LABEL_STYLES_BG[color as TW_COLOR] ?? 'bg-neutral-500',
      )}
    />
  )
}

// =============================================================================
// Filter Icon
// =============================================================================

export const FilterIcon = () => (
  <svg
    className="fill-muted-foreground size-4"
    viewBox="0 0 16 16"
    role="img"
    focusable="false"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.25 3a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5h12.5ZM4 8a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 8Zm2.75 3.5a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z"
    />
  </svg>
)

// =============================================================================
// Node Factory Functions
// =============================================================================

/**
 * Creates an item node with standard styling
 */
export function createItemNode(
  _id: string,
  label: string,
  icon?: React.ReactNode,
  keywords?: string[],
): ItemDef {
  return {
    kind: 'item',
    value: label,
    keywords,
    render: ({ props, context }: ItemRenderParams) => (
      <DropdownMenu.Item
        {...props}
        onSelect={() =>
          toast(
            `Changed ${context.breadcrumbs?.[0]?.value?.toLowerCase() ?? 'value'} to ${label}.`,
          )
        }
      >
        {icon && <DropdownMenu.Icon>{icon}</DropdownMenu.Icon>}
        <LabelWithBreadcrumbs
          label={label}
          breadcrumbs={
            context.isDeepSearchResult ? context.breadcrumbs : undefined
          }
        />
      </DropdownMenu.Item>
    ),
  }
}

/**
 * Creates a label item node with a colored dot
 */
export function createLabelItemNode(
  labelId: string,
  name: string,
  color: string,
  store: SelectionStore,
  type: 'label' | 'project-label' = 'label',
): CheckboxItemDef {
  return {
    kind: 'checkbox-item',
    value: name,
    keywords: [name],
    render: ({ props, context }: ItemRenderParams) => (
      <LabelCheckboxItem
        {...props}
        labelId={labelId}
        name={name}
        color={color}
        context={context}
        store={store}
        type={type}
      />
    ),
  }
}

function LabelCheckboxItem({
  labelId,
  name,
  color,
  context,
  store,
  type,
  ...props
}: React.ComponentProps<typeof DropdownMenu.CheckboxItem> & {
  labelId: string
  name: string
  color: string
  context: ItemRenderParams['context']
  store: ReturnType<typeof createSelectionStore>
  type: 'label' | 'project-label'
}) {
  const checked = React.useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().has(labelId),
    () => store.getSnapshot().has(labelId),
  )

  return (
    <DropdownMenu.CheckboxItem
      {...props}
      checked={checked}
      onCheckedChange={(nextChecked) => {
        store.set(labelId, nextChecked === true)
        toast(
          `${nextChecked ? 'Added' : 'Removed'} ${type === 'project-label' ? 'project label' : 'label'}: ${name}`,
        )
      }}
    >
      <DropdownMenu.CheckboxItemIndicator className="opacity-0 data-checked:opacity-100 data-unchecked:group-data-highlighted/row:opacity-100" />
      <DropdownMenu.Icon>
        <LabelDot color={color} />
      </DropdownMenu.Icon>
      <LabelWithBreadcrumbs
        label={name}
        breadcrumbs={
          context.isDeepSearchResult ? context.breadcrumbs : undefined
        }
      />
    </DropdownMenu.CheckboxItem>
  )
}

/**
 * Creates an assignee item node with an avatar
 */
export function createAssigneeItemNode(
  _id: string,
  name: string,
  username: string,
): ItemDef {
  return {
    kind: 'item',
    value: name,
    keywords: [name, username],
    render: ({ props, context }: ItemRenderParams) => (
      <DropdownMenu.Item
        {...props}
        onSelect={() => toast(`Assigned to ${name}`)}
      >
        <DropdownMenu.Icon>
          <Avatar className="size-4">
            <AvatarImage
              src={`https://github.com/${username}.png`}
              alt={`@${username}`}
            />
            <AvatarFallback className="text-[8px]">
              {name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenu.Icon>
        <LabelWithBreadcrumbs
          label={name}
          breadcrumbs={
            context.isDeepSearchResult ? context.breadcrumbs : undefined
          }
        />
      </DropdownMenu.Item>
    ),
  }
}

/**
 * Creates a submenu node with deep search enabled.
 * Uses the Data-First API components (Surface, Input, List)
 * to properly integrate with the parent's deep search functionality.
 */
export function createSubmenuNode(
  id: string,
  title: string,
  icon: React.ReactNode,
  childNodes: NodeDef[],
  options?: {
    inputPlaceholder?: string
    hideInputUntilActive?: boolean
    includeInDeepSearch?: SubmenuDef['includeInDeepSearch']
  },
): SubmenuDef {
  const {
    inputPlaceholder = `${title}...`,
    hideInputUntilActive = false,
    includeInDeepSearch = true,
  } = options ?? {}

  return {
    kind: 'submenu',
    id,
    value: title,
    deepSearch: true,
    includeInDeepSearch,
    nodes: childNodes,
    render: ({ props, context, nodes }: SubmenuRenderParams) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger {...props}>
          <div className="flex items-center gap-2">
            <DropdownMenu.Icon>{icon}</DropdownMenu.Icon>
            <LabelWithBreadcrumbs
              label={title}
              breadcrumbs={
                context.isDeepSearchResult ? context.breadcrumbs : undefined
              }
            />
          </div>
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface
                content={nodes}
                deepSearch={{
                  enabled: true,
                  minLength: 2,
                  asyncResultBehavior: 'block',
                }}
              >
                <DropdownMenu.Input
                  placeholder={inputPlaceholder}
                  hideUntilActive={hideInputUntilActive}
                />
                <DropdownMenu.List>
                  <AsyncComponentsListItems />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  }
}

/**
 * Creates an async submenu node with deep search enabled.
 * Shows a loading spinner in the trigger when async content is loading.
 *
 * The submenu passes `asyncContent` to its Surface so it can run its own
 * loader with its own search query, independent of the parent's deep search.
 */
export function createAsyncSubmenuNode(
  id: string,
  title: string,
  icon: React.ReactNode,
  asyncNodes: AsyncNodesConfig,
  options?: {
    inputPlaceholder?: string
    hideInputUntilActive?: boolean
    includeInDeepSearch?: SubmenuDef['includeInDeepSearch']
    /** Static nodes to show alongside async content */
    staticNodes?: NodeDef[]
  },
): SubmenuDef {
  const {
    inputPlaceholder = `${title}...`,
    hideInputUntilActive = false,
    includeInDeepSearch = true,
    staticNodes = [],
  } = options ?? {}

  return {
    kind: 'submenu',
    id,
    value: title,
    deepSearch: true,
    includeInDeepSearch,
    nodes: staticNodes,
    asyncNodes,
    render: ({ props, context, asyncContent }: SubmenuRenderParams) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger {...props}>
          <div className="flex items-center gap-2 flex-1">
            <DropdownMenu.Icon>{icon}</DropdownMenu.Icon>
            <LabelWithBreadcrumbs
              label={title}
              breadcrumbs={
                context.isDeepSearchResult ? context.breadcrumbs : undefined
              }
            />
          </div>
          {context.async?.isLoading && <DiamondSpinner className="size-3.5" />}
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              {/*
                The submenu uses asyncContent as its sole data source.
                This runs its OWN loader with its OWN search query.
              */}
              <DropdownMenu.Surface
                asyncContent={asyncContent}
                deepSearch={{ enabled: true, asyncResultBehavior: 'block' }}
              >
                <DropdownMenu.Input
                  placeholder={inputPlaceholder}
                  hideUntilActive={hideInputUntilActive}
                />
                <DropdownMenu.List virtualized />
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  }
}

function AsyncComponentsListItems() {
  const { nodes: filteredNodes, renderNode } = DropdownMenu.useDataList()

  return <>{filteredNodes.map((node) => renderNode(node))}</>
}
