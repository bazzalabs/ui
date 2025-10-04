import { createActionMenu, renderIcon } from '@bazza-ui/action-menu'
import { ChevronRightIcon } from 'lucide-react'
import { Fragment } from 'react'
import { cn } from '@/lib/utils'

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
      <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor"></path>
    </svg>
  )
}

export const LabelWithBreadcrumbs = ({
  label,
  breadcrumbs,
}: {
  label: string
  breadcrumbs?: string[]
}) => (
  <div className="flex items-center gap-1 truncate">
    {breadcrumbs?.map((crumb, idx) => (
      <Fragment key={`${idx}-${crumb}`}>
        <span className="text-muted-foreground truncate">{crumb}</span>
        <ChevronRightIcon className="size-3 text-muted-foreground/75 stroke-[2.5px] shrink-0" />
      </Fragment>
    ))}
    <span className="truncate">{label}</span>
  </div>
)

export const ActionMenu = createActionMenu<any>({
  defaults: {
    content: {
      onCloseAutoClear: 300,
    },
  },
  shell: {
    classNames: {
      overlay: cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 h-full w-full',
      ),
      drawerContent: cn(
        'group/drawer-content border rounded-lg bg-popover fixed z-50 flex h-auto flex-col min-h-0 overflow-hidden shadow-lg',
        'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80svh] data-[vaul-drawer-direction=top]:rounded-lg',
        'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-4 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80svh] data-[vaul-drawer-direction=bottom]:rounded-lg data-[vaul-drawer-direction=bottom]:mx-4',
      ),
      drawerHandle: cn(
        'bg-muted mx-auto mt-4 mb-2 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block',
      ),
    },
    slotProps: {
      drawerRoot: {
        shouldScaleBackground: true,
      },
    },
  },
  surface: {
    slots: {
      Item: ({ node, bind, search }) => {
        const props = bind.getRowProps({
          className: 'group/row',
        })

        return (
          <li {...props}>
            {node.icon && (
              <div className="size-4 flex items-center justify-center">
                {renderIcon(
                  node.icon,
                  'size-4 shrink-0 text-muted-foreground group-data-[focused=true]/row:text-primary',
                )}
              </div>
            )}
            <LabelWithBreadcrumbs
              label={node.label ?? ''}
              breadcrumbs={search?.breadcrumbs}
            />
          </li>
        )
      },
      SubmenuTrigger: ({ node, bind, search }) => {
        const props = bind.getRowProps({})

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
      Empty: () => (
        <div className="flex items-center justify-center h-10 text-muted-foreground">
          No matching options.
        </div>
      ),
    },
    classNames: {
      content: cn(
        'data-[mode=dropdown]:border bg-popover rounded-lg z-50 text-sm shadow-md origin-(--radix-popper-transform-origin) flex flex-col',
        'data-[root-menu]:data-[state=open]:animate-in data-[root-menu]:data-[state=closed]:animate-out data-[root-menu]:data-[state=closed]:fade-out-0 data-[root-menu]:data-[state=open]:fade-in-0 data-[root-menu]:data-[state=closed]:zoom-out-95 data-[root-menu]:data-[state=open]:zoom-in-95 data-[root-menu]:data-[side=bottom]:slide-in-from-top-2 data-[root-menu]:data-[side=left]:slide-in-from-right-2 data-[root-menu]:data-[side=right]:slide-in-from-left-2 data-[root-menu]:data-[side=top]:slide-in-from-bottom-2',
        'max-h-[min(500px,var(--action-menu-available-height))]',
        'box-content',
        'w-[min(300px,max(var(--row-width),175px))]',
      ),

      list: cn(
        'scroll-py-1 overflow-y-auto overflow-x-hidden outline-none',
        '[-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        'data-[mode=drawer]:flex-1 data-[mode=drawer]:max-w-full',
        // 'data-[mode=drawer]:[&_[data-action-menu-group-heading]]:px-5',
        'w-full flex-1',
        'py-1',
      ),
      input: cn(
        'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 min-h-9 max-h-9 px-4 placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out border-b caret-blue-500',
        'data-[mode=drawer]:px-6',
        'w-full',
        // 'w-[max(100%,var(--row-width))]',
      ),
      group: cn('mt-3 data-[index=0]:mt-1 mb-2'),
      groupHeading: cn('text-xs font-medium text-muted-foreground px-3'),
      item: cn(
        'group flex items-center w-full gap-2 text-sm select-none',
        'data-[focused=true]:text-accent-foreground',
        'py-1.5 data-[mode=dropdown]:px-4 data-[mode=drawer]:px-5',
        'truncate w-full relative z-1',
        'before:absolute before:top-0 before:left-1 before:right-1 before:h-full data-[focused=true]:before:bg-accent before:rounded-md before:z-[-1]',
      ),
      subtrigger: cn(
        "group flex items-center justify-between data-[focused=true]:text-accent-foreground relative cursor-default gap-4 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        'py-1.5 data-[mode=drawer]:px-5 data-[mode=dropdown]:px-4',
        'overflow-x-hidden w-full relative z-1',
        'before:absolute before:top-0 before:left-1 before:right-1 before:h-full data-[focused=true]:before:bg-accent before:rounded-md before:z-[-1]',
      ),
    },
  },
})
