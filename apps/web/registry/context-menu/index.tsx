import { createContextMenu, renderIcon } from '@bazza-ui/context-menu'
import { ChevronRightIcon } from 'lucide-react'
import { Fragment, useCallback } from 'react'
import { cn } from '@/lib/utils'

export const ContextMenu = createContextMenu({
  slots: {
    // Content: ({ children, bind }) => (
    //   <div {...bind.getContentProps()}>{children}</div>
    // ),
    // List: ({ children, bind }) => <ul {...bind.getListProps()}>{children}</ul>,
    Item: ({ node, bind }) => {
      const props = bind.getRowProps({
        className: 'group/row',
      })

      return (
        <li {...props}>
          {node.icon && (
            <div className="min-h-4 min-w-4 size-4 flex items-center justify-center">
              {renderIcon(
                node.icon,
                'size-4 shrink-0 text-muted-foreground group-data-[focused=true]/row:text-primary',
              )}
            </div>
          )}
          <span className="truncate">{node.label}</span>
        </li>
      )
    },
    SubmenuTrigger: ({ node, bind }) => {
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
            <span className="truncate">{node.label ?? ''}</span>
          </div>
          <ChevronRightIcon className="text-muted-foreground/75 transition-[color] duration-50 ease-out shrink-0 size-4" />
        </li>
      )
    },
    GroupHeading: ({ node, bind }) => (
      <div {...bind.getGroupHeadingProps()}>
        <span>{node.heading}</span>
      </div>
    ),
    Separator: () => (
      // biome-ignore lint/a11y/useFocusableInteractive: separator is decorative
      <div role="separator" aria-orientation="horizontal" />
    ),
  },
  slotProps: {
    positioner: {
      root: { sideOffset: 8, side: 'bottom', alignOffset: -4 },
      sub: { sideOffset: -2, align: 'start', alignOffset: -4 },
    },
  },
  classNames: {
    positioner: cn('z-50'),
    content: cn(
      'border bg-popover z-50 rounded-lg flex flex-col text-sm',
      'drop-shadow-md',
      'min-w-[200px] max-w-[300px]',
    ),
    input: cn(
      'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 min-h-9 max-h-9 px-4 border-b',
      'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
      'data-[mode=drawer]:text-[16px] data-[mode=drawer]:px-6',
      'caret-blue-500',
      'w-full',
    ),
    list: cn(
      'scroll-py-1 overflow-y-auto overflow-x-hidden outline-none',
      '[-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
      'w-full flex-1',
      'py-1',
    ),
    item: cn(
      'group flex items-center gap-2 text-sm select-none aria-disabled:opacity-50',
      'data-[focused=true]:not-disabled:text-accent-foreground',
      'py-1.5 px-4',
      'w-full relative z-1',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full data-[focused=true]:not-disabled:before:bg-accent before:rounded-md before:z-[-1]',
    ),
    subtrigger: cn(
      'group flex items-center justify-between data-[focused=true]:text-accent-foreground relative cursor-default gap-4 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      'py-1.5 px-4',
      'overflow-x-hidden w-full relative z-1',
      'before:absolute before:top-0 before:left-1 before:right-1 before:h-full data-[focused=true]:before:bg-accent before:rounded-md before:z-[-1]',
    ),
    groupHeading: cn(
      'mt-3 data-[index=0]:mt-1 mb-2',
      'text-xs font-medium text-muted-foreground px-3',
    ),
    separator: cn('h-px bg-border my-1 mx-2'),
  },
})

// Re-export utilities
export { renderIcon }

// Helper SVG icon
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
