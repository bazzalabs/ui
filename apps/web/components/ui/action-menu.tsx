import { createActionMenu, renderIcon } from '@bazza-ui/action-menu'
import { ChevronRightIcon } from 'lucide-react'
import { Fragment, isValidElement } from 'react'
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
  <div className="flex items-center gap-1">
    {breadcrumbs?.map((crumb, idx) => (
      <Fragment key={`${idx}-${crumb}`}>
        <span className="text-muted-foreground">{crumb}</span>
        <ChevronRightIcon className="size-3 text-muted-foreground/75 stroke-[2.5px]" />
      </Fragment>
    ))}
    <span>{label}</span>
  </div>
)

export const ActionMenu = createActionMenu<any>({
  classNames: {
    content: cn(
      'border bg-popover z-50 rounded-lg text-sm shadow-md origin-(--radix-popper-transform-origin) flex flex-col h-full w-full',
      'data-[root-menu]:data-[state=open]:animate-in data-[root-menu]:data-[state=closed]:animate-out data-[root-menu]:data-[state=closed]:fade-out-0 data-[root-menu]:data-[state=open]:fade-in-0 data-[root-menu]:data-[state=closed]:zoom-out-95 data-[root-menu]:data-[state=open]:zoom-in-95 data-[root-menu]:data-[side=bottom]:slide-in-from-top-2 data-[root-menu]:data-[side=left]:slide-in-from-right-2 data-[root-menu]:data-[side=right]:slide-in-from-left-2 data-[root-menu]:data-[side=top]:slide-in-from-bottom-2',
      'relative isolate',
    ),
    list: cn(
      'p-1 flex flex-col w-full min-w-[200px] max-w-[500px] max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto outline-none',
    ),
    input: cn(
      'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 h-9 px-4 placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out border-b caret-blue-500',
    ),
    item: cn(
      'group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm select-none',
      'data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground',
    ),
    subtrigger: cn(
      "group w-full flex items-center justify-between data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground relative cursor-default gap-4 rounded-md px-3 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
      'relative',
    ),
  },
  slots: {
    Item: ({ node, bind, search }) => {
      const props = bind.getRowProps()

      const Icon = renderIcon(
        node.icon,
        'size-4 shrink-0 data-[focused=true]:text-primary',
      )

      return (
        <div {...props}>
          {Icon && (
            <div className="size-4 flex items-center justify-center">
              {Icon}
            </div>
          )}
          <LabelWithBreadcrumbs
            label={node.label!}
            breadcrumbs={search?.breadcrumbs}
          />
        </div>
      )
    },
    SubmenuTrigger: ({ node, bind, search }) => {
      const props = bind.getRowProps({})

      const Icon = renderIcon(
        node.icon,
        'size-4 shrink-0 text-muted-foreground group-data-[focused=true]:text-primary',
      )

      return (
        <div {...props}>
          <div className="flex items-center gap-2">
            <div className="size-4 flex items-center justify-center">
              {Icon}
            </div>
            <LabelWithBreadcrumbs
              label={node.label ?? ''}
              breadcrumbs={search?.breadcrumbs}
            />
          </div>
          <TriangleRightIcon className="text-muted-foreground/75 group-data-[menu-state=open]:group-data-[menu-focused=false]:text-foreground/75 group-data-[menu-focused=true]:text-foreground transition-[color] duration-50 ease-out" />
          {/* <span className="absolute top-0 right-0 text-[10px] font-medium"> */}
          {/*   {props['data-action-menu-item-id']} */}
          {/* </span> */}
        </div>
      )
    },
    Empty: () => (
      <div className="flex items-center justify-center h-10 text-muted-foreground">
        No matching options.
      </div>
    ),
  },
})
