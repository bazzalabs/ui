'use client'

import type {
  ItemDef,
  ItemRenderParams,
  NodeDef,
  SubmenuDef,
  SubmenuRenderParams,
  SubpageContentRenderParams,
  SubpageDef,
  SubpageTriggerRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import type * as React from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { DropdownMenu, LabelWithBreadcrumbs } from '@/registry/ui/dropdown-menu'

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
        'rounded-full size-2.5',
        LABEL_STYLES_BG[color as TW_COLOR] ?? 'bg-neutral-500',
        className,
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
  id: string,
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
  id: string,
  name: string,
  color: string,
): ItemDef {
  return {
    kind: 'item',
    value: name,
    keywords: [name],
    render: ({ props, context }: ItemRenderParams) => (
      <DropdownMenu.Item
        {...props}
        onSelect={() => toast(`Added label: ${name}`)}
      >
        <DropdownMenu.Icon>
          <LabelDot color={color} />
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
 * Creates an assignee item node with an avatar
 */
export function createAssigneeItemNode(
  id: string,
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
  },
): SubmenuDef {
  const { inputPlaceholder = `${title}...`, hideInputUntilActive = false } =
    options ?? {}

  return {
    kind: 'submenu',
    value: title,
    deepSearch: true,
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
                deepSearch={{ enabled: true, minLength: 0 }}
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

/**
 * Creates a subpage node with deep search enabled.
 * Subpage content is rendered automatically by Popup for a data Surface.
 */
export function createSubpageNode(
  id: string,
  title: string,
  icon: React.ReactNode,
  childNodes: NodeDef[],
  options?: {
    inputPlaceholder?: string
    hideInputUntilActive?: boolean
  },
): SubpageDef {
  const { inputPlaceholder = `${title}...`, hideInputUntilActive = false } =
    options ?? {}

  return {
    kind: 'subpage',
    id,
    value: title,
    deepSearch: true,
    nodes: childNodes,
    renderTrigger: ({ props, context }: SubpageTriggerRenderParams) => (
      <DropdownMenu.SubpageTrigger {...props}>
        <div className="flex items-center gap-2">
          <DropdownMenu.Icon>{icon}</DropdownMenu.Icon>
          <LabelWithBreadcrumbs
            label={title}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
        </div>
      </DropdownMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId, context }: SubpageContentRenderParams) => (
      <DropdownMenu.Subpage pageId={pageId}>
        <DropdownMenu.Surface>
          <DropdownMenu.Input
            placeholder={inputPlaceholder}
            hideUntilActive={hideInputUntilActive}
          />
          <DropdownMenu.List virtualized>
            {!context.isDeepSearchResult ? (
              <DropdownMenu.SubpageBackItem>Back</DropdownMenu.SubpageBackItem>
            ) : null}
          </DropdownMenu.List>
        </DropdownMenu.Surface>
      </DropdownMenu.Subpage>
    ),
  }
}
