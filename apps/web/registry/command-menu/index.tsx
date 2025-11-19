import { createCommandMenu } from '@bazza-ui/command-menu'
import { defaultSlots, renderIcon } from '@bazza-ui/menu'
import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

declare module '@bazza-ui/menu' {
  interface ItemExtendedProperties {
    description?: string
  }
}

// Create CommandMenu with factory theme
export const CommandMenu = createCommandMenu({
  defaults: {
    virtualization: {
      enabled: true,
    },
  },
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

      console.log({
        node,
        search,
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
              isSubmenu
            />
            {/*<span className="truncate text-primary/90 group-data-[focused=true]/row:text-primary">
              {node.label ?? node.title ?? ''}...
            </span>*/}
          </div>
          {/*<ChevronRightIcon className="size-4 text-muted-foreground/75 shrink-0" />*/}
        </li>
      )
    },

    InlineLoading: (args) => {
      const count = args.progress?.reduce((acc, progress) => {
        return progress.isLoading ? acc : acc + 1
      }, 0)
      const total = args.progress?.length ?? 0

      return (
        <div className="flex items-center justify-center gap-2 h-11 text-muted-foreground text-sm">
          <DiamondSpinner className="size-5 text-primary rotate-45" />
          <span className="tabular-nums">
            Loading {total > 0 ? `${count}/${total}` : ''}...
          </span>
        </div>
      )
    },

    Loading: (args) => {
      const count = args.progress?.reduce((acc, progress) => {
        return progress.isLoading ? acc : acc + 1
      }, 0)
      const total = args.progress?.length ?? 0

      return (
        <div className="flex items-center justify-center gap-2 h-14 text-muted-foreground text-sm">
          <DiamondSpinner className="size-5 text-primary rotate-45" />
          <span className="tabular-nums">
            Loading {total > 0 ? `${count}/${total}` : ''}...
          </span>
        </div>
      )
    },

    Empty: ({ query }) =>
      query ? (
        <div className="flex items-center justify-center h-14 text-muted-foreground text-sm">
          No matching commands.
        </div>
      ) : null,

    List: (args) =>
      !args.query && args.nodes.length === 0 ? null : defaultSlots().List(args),
  },

  classNames: {
    dialogOverlay: cn(
      'fixed inset-0 z-50 backdrop-blur-[2px]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    ),
    dialogContent: cn(
      'fixed left-[50%] top-[50%] z-50',
      'w-full max-w-lg',
      'translate-x-[-50%] translate-y-[-50%]',
      'h-(--command-menu-height) transition-[height] ease-in-out duration-150 overflow-hidden',
      'border rounded-lg bg-popover shadow-lg',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    ),
    dialogInner: cn('flex flex-col overflow-hidden'),
    breadcrumbs: cn(
      'flex items-center gap-2 border-b px-3 py-2',
      'text-sm text-muted-foreground',
    ),
    backButton: cn(
      'flex items-center gap-1',
      'hover:text-foreground transition-colors',
      'cursor-pointer',
    ),
    breadcrumbItem: cn('truncate'),
    breadcrumbSeparator: cn('text-muted-foreground/75'),
    list: cn(
      'scroll-py-1 overflow-y-auto overflow-x-hidden outline-none',
      '[-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
      'w-full flex-1',
      'py-1.5',
      'max-h-[400px]',
    ),
    input: cn(
      'outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
      'min-h-12 max-h-12 px-5 border-b',
      'focus-visible:placeholder-muted-foreground/75',
      'placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
      'caret-blue-500',
      'w-full bg-transparent text-base rounded-none',
    ),
    groupHeading: cn(
      'mt-3 data-[index=0]:mt-1 mb-2',
      'text-xs font-medium text-muted-foreground px-5',
    ),
    item: cn(
      'group flex items-center gap-2 text-sm select-none aria-disabled:opacity-50',
      'data-[focused=true]:not-disabled:text-accent-foreground',
      'px-5 h-11',
      'w-full relative z-1 cursor-pointer',
      'before:absolute before:top-0 before:left-1.5 before:right-1.5 before:h-full',
      'data-[focused=true]:not-disabled:before:bg-accent before:rounded-md before:z-[-1]',
    ),
    subtrigger: cn(
      'group flex items-center gap-2 text-sm select-none aria-disabled:opacity-50',
      'data-[focused=true]:not-disabled:text-accent-foreground',
      'px-5 h-11',
      'w-full relative z-1 cursor-pointer',
      'before:absolute before:top-0 before:left-1.5 before:right-1.5 before:h-full',
      'data-[focused=true]:not-disabled:before:bg-accent before:rounded-md before:z-[-1]',
    ),
  },
})

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
  const getRectProps = (size: number, coord: { x: number; y: number }) => {
    return {
      x: coord.x - size / 2,
      y: coord.y - size / 2,
      width: size,
      height: size,
    }
  }

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
  isSubmenu = false,
  classNames,
}: {
  label: React.ReactNode
  breadcrumbs?: string[]
  isSubmenu?: boolean
  classNames?: {
    label?: string
    breadcrumb?: string
    separator?: string
  }
}) => (
  <div className="flex items-center gap-1 truncate">
    {breadcrumbs?.map((crumb, idx) => (
      <React.Fragment key={`${idx}-${crumb}`}>
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
      </React.Fragment>
    ))}
    <span
      className={cn(
        'truncate',
        'text-primary/90 group-data-[focused=true]/row:text-primary',
        classNames?.label,
      )}
    >
      {label}
      {isSubmenu && '...'}
    </span>
  </div>
)
