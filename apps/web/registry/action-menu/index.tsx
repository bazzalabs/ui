import {
  createActionMenu,
  defaultSlots,
  renderIcon,
} from '@bazza-ui/action-menu'
import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import { Fragment, useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

declare module '@bazza-ui/action-menu' {
  interface ItemExtendedProperties {
    description?: string
  }
}

export const ActionMenu = createActionMenu({
  slots: {
    GroupHeading: ({ node, bind }) => (
      <div {...bind.getGroupHeadingProps()}>
        <span>{node.heading}</span>
      </div>
    ),

    Item: ({ node, bind, search }) => {
      const props = bind.getRowProps({
        className: cn('group/row', node.description && 'gap-3'),
      })

      const isRadioItem = node.group && node.group.variant === 'radio'
      const isRadioChecked = isRadioItem && node.group?.value === node.id

      const isCheckboxItem = node.variant === 'checkbox'

      return (
        <li {...props}>
          {isCheckboxItem && (
            <Checkbox
              checked={Boolean(node.checked)}
              className="opacity-0 data-[state=checked]:opacity-100 group-data-[focused=true]/row:opacity-100 dark:border-ring shrink-0"
            />
          )}

          {node.icon && (
            <div className="min-h-4 min-w-4 size-4 flex items-center justify-center">
              {renderIcon(
                node.icon,
                'size-4 shrink-0 text-muted-foreground group-data-[focused=true]/row:text-primary',
              )}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <LabelWithBreadcrumbs
              label={node.label ?? ''}
              breadcrumbs={search?.breadcrumbs}
            />
            {node.description && (
              <span className="text-muted-foreground text-xs truncate">
                {node.description}
              </span>
            )}
          </div>
          {isRadioChecked && <CheckIcon className="size-4 ml-auto" />}
        </li>
      )
    },
    SubmenuTrigger: ({ node, bind, search }) => {
      const props = bind.getRowProps({
        className: 'group/row',
      })

      return (
        <li {...props}>
          <div className="flex items-center gap-2 min-w-0">
            {node.icon && (
              <div className="size-4 flex items-center justify-center">
                {renderIcon(
                  node.icon,
                  'size-4 shrink-0 text-muted-foreground group-data-[focused=true]:text-primary',
                )}
              </div>
            )}
            <LabelWithBreadcrumbs
              label={node.label ?? ''}
              breadcrumbs={search?.breadcrumbs}
            />
          </div>
          <TriangleRightIcon className="text-muted-foreground/75 group-data-[menu-state=open]:group-data-[menu-focused=false]:text-foreground/75 group-data-[menu-focused=true]:text-foreground transition-[color] duration-50 ease-out shrink-0" />
        </li>
      )
    },
    Loading: (args) => {
      const count = args.progress?.reduce((acc, progress) => {
        return progress.isLoading ? acc : acc + 1
      }, 0)
      const total = args.progress?.length ?? 0

      return (
        <div className="flex items-center justify-center gap-2 h-12 text-muted-foreground">
          <DiamondSpinner className="size-5 text-primary rotate-45" />
          <span className="tabular-nums">
            Loading {total > 0 ? `${count}/${total}` : ''}...
          </span>
        </div>
      )
    },
    Empty: ({ query }) =>
      query ? (
        <div className="flex items-center justify-center h-10 text-muted-foreground">
          No matching options.
        </div>
      ) : null,
    List: (args) =>
      !args.query && args.nodes.length === 0 ? null : defaultSlots().List(args),
  },
  slotProps: {
    positioner: {
      root: { sideOffset: 8, side: 'bottom', alignOffset: -4 },
      sub: { sideOffset: -2, align: 'list', alignOffset: -4 },
    },
  },
  classNames: {
    drawerOverlay: cn(
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 h-full w-full',
    ),
    drawerContent: cn(
      'fixed z-50',
      'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80svh] data-[vaul-drawer-direction=top]:rounded-lg',
      'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80svh] data-[vaul-drawer-direction=bottom]:rounded-lg data-[vaul-drawer-direction=bottom]:mx-4',
    ),
    drawerContentInner: cn(
      'border rounded-lg bg-popover flex h-auto flex-col min-h-0 overflow-hidden shadow-lg mb-4',
      '[--action-menu-drawer-handle-height:theme(spacing.8)]',
    ),
    drawerHandle: cn(
      'h-(--action-menu-drawer-handle-height) w-full relative',
      'before:absolute before:top-4 before:left-1/2 before:-translate-x-1/2',
      'before:bg-muted before:h-2 before:w-[100px] before:shrink-0 before:rounded-full',
    ),
    content: cn(
      'data-[mode=dropdown]:border bg-popover rounded-lg z-50 flex flex-col text-sm data-[root-menu]:drop-shadow-md data-[sub-menu]:drop-shadow-xl origin-(--radix-popper-transform-origin)',
      'data-[root-menu]:data-[state=open]:animate-in data-[root-menu]:data-[state=closed]:animate-out data-[root-menu]:data-[state=closed]:fade-out-0 data-[root-menu]:data-[state=open]:fade-in-0 data-[root-menu]:data-[state=closed]:zoom-out-95 data-[root-menu]:data-[state=open]:zoom-in-95 data-[root-menu]:data-[side=bottom]:slide-in-from-top-2 data-[root-menu]:data-[side=left]:slide-in-from-right-2 data-[root-menu]:data-[side=right]:slide-in-from-left-2 data-[root-menu]:data-[side=top]:slide-in-from-bottom-2 data-[root-menu]:data-[state=open]:transition-[opacity,scale] data-[root-menu]:data-[state=open]:duration-150 data-[root-menu]:data-[state=closed]:transition-[opacity,scale] data-[root-menu]:data-[state=closed]:duration-150',
      'data-[mode=dropdown]:max-h-[min(500px,var(--action-menu-available-height))]',
      'box-content',
      'data-[mode=dropdown]:w-[min(400px,max(var(--row-width),175px))]',
      'data-[mode=drawer]:max-h-[calc(80svh-var(--action-menu-drawer-handle-height)-calc(var(--spacing)*4))]',
    ),
    list: cn(
      'scroll-py-1 overflow-y-auto overflow-x-hidden outline-none',
      '[-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
      'w-full flex-1',
      'py-1',
    ),
    input: cn(
      'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 min-h-9 max-h-9 px-4 border-b',
      'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
      'data-[mode=drawer]:text-[16px] data-[mode=drawer]:px-6',
      'caret-blue-500',
      'w-full',
    ),
    groupHeading: cn(
      'mt-3 data-[index=0]:mt-1 mb-2',
      'text-xs font-medium text-muted-foreground px-3',
    ),
    item: cn(
      'group flex items-center w-full gap-2 text-sm select-none aria-disabled:opacity-50',
      'data-[focused=true]:not-disabled:text-accent-foreground',
      'py-1.5 data-[mode=dropdown]:px-4 data-[mode=drawer]:px-5',
      'truncate w-full relative z-1',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full data-[focused=true]:not-disabled:before:bg-accent before:rounded-md before:z-[-1]',
    ),
    subtrigger: cn(
      "group flex items-center justify-between data-[focused=true]:text-accent-foreground relative cursor-default gap-4 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
      'py-1.5 data-[mode=drawer]:px-5 data-[mode=dropdown]:px-4',
      'overflow-x-hidden w-full relative z-1',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full data-[focused=true]:before:bg-accent before:rounded-md before:z-[-1]',
    ),
  },
})

const TriangleRightIcon = ({
  ...props
}: React.HTMLAttributes<SVGSVGElement>) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor" />
    </svg>
  )
}

const diamondCoords = [
  { x: 3, y: 48 },
  { x: 18, y: 33 },
  { x: 18, y: 48 },
  { x: 18, y: 63 },
  { x: 33, y: 48 },
  { x: 33, y: 18 },
  { x: 33, y: 33 },
  { x: 33, y: 63 },
  { x: 33, y: 78 },
  { x: 48, y: 3 },
  { x: 48, y: 18 },
  { x: 48, y: 33 },
  { x: 48, y: 48 },
  { x: 48, y: 63 },
  { x: 48, y: 78 },
  { x: 48, y: 93 },
  { x: 63, y: 18 },
  { x: 63, y: 33 },
  { x: 63, y: 48 },
  { x: 63, y: 63 },
  { x: 63, y: 78 },
  { x: 78, y: 33 },
  { x: 78, y: 48 },
  { x: 78, y: 63 },
  { x: 93, y: 48 },
] as const

export const DiamondSpinner = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const getRectProps = useCallback(
    (size: number, coord: { x: number; y: number }) => {
      return {
        x: coord.x - size / 2,
        y: coord.y - size / 2,
        width: size,
        height: size,
      }
    },
    [],
  )

  return (
    <svg
      className={cn('fill-current size-6', className)}
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <style>
        {`
          @keyframes diamond-spin {
            25% { transform: translate(30px, -30px); }
            50% { transform: translate(60px, 0px); }
            75% { transform: translate(30px, 30px); }
          }
        `}
      </style>
      {/* Background squares */}
      {diamondCoords.map((c) => (
        <rect
          key={`bg-${c.x}-${c.y}`}
          className="fill-current/30"
          {...getRectProps(7, c)}
        />
      ))}
      {/* Animated squares */}
      <g style={{ animation: 'diamond-spin 1.4s steps(2, end) infinite' }}>
        {diamondCoords.slice(0, 5).map((c) => (
          <rect key={`fg-${c.x}-${c.y}`} {...getRectProps(9, c)} />
        ))}
      </g>
    </svg>
  )
}

export const LabelWithBreadcrumbs = ({
  label,
  breadcrumbs,
  classNames,
}: {
  label: React.ReactNode
  breadcrumbs?: string[]
  classNames?: {
    label?: string
    breadcrumb?: string
    separator?: string
  }
}) => (
  <div className="flex items-center gap-1 truncate">
    {breadcrumbs?.map((crumb, idx) => (
      <Fragment key={`${idx}-${crumb}`}>
        <span
          className={cn(
            'text-muted-foreground truncate',
            classNames?.breadcrumb,
          )}
        >
          {crumb}
        </span>
        <ChevronRightIcon
          className={cn(
            'size-3 text-muted-foreground/75 stroke-[2.5px] shrink-0',
            classNames?.separator,
          )}
        />
      </Fragment>
    ))}
    <span
      className={cn(
        'truncate',
        'text-primary/90 group-data-[focused=true]/row:text-primary',
        classNames?.label,
      )}
    >
      {label}
    </span>
  </div>
)
