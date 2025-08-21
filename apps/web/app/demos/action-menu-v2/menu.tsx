import {
  createActionMenu,
  type MenuData,
  type SubmenuNode,
} from '@bazza-ui/action-menu'
import type { ColumnOption } from '@bazzaui/filters'
import { isValidElement } from 'react'
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

export const FilterMenu = createActionMenu<ColumnOption>({
  renderers: {
    content: ({ children, bind }) => {
      const props = bind.getContentProps({
        className: cn(
          'border bg-popover z-50 rounded-md text-sm shadow-md origin-(--radix-popper-transform-origin) flex flex-col h-full w-full',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          'relative',
        ),
      })

      return (
        <div {...props}>
          {children}
          <span className="absolute top-0 right-0 text-[10px] font-medium">
            {props['data-surface-id']}
          </span>
        </div>
      )
    },
    list: ({ children, bind }) => {
      const props = bind.getListProps({
        className: cn(
          'p-1 flex flex-col w-full max-w-[500px] max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto',
        ),
      })

      return <div {...props}>{children}</div>
    },
    input: ({ bind }) => {
      const props = bind.getInputProps({
        placeholder: 'Filter...',
        className: cn(
          'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 h-9 px-4 placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out border-b',
        ),
      })

      return <input {...props} />
    },
    item: ({ node, bind }) => {
      const props = bind.getRowProps({
        className: cn(
          'group flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm select-none',
          'data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground',
        ),
      })

      const data = node.data!
      const Icon = data.icon

      return (
        <div {...props}>
          {!Icon ? null : isValidElement(Icon) ? Icon : <Icon />}
          <span>{data.label}</span>
        </div>
      )
    },
    submenuTrigger: ({ node, bind }) => {
      const props = bind.getRowProps({
        className: cn(
          "group w-full flex items-center justify-between data-[focused=true]:bg-accent data-[focused=true]:text-accent-foreground relative cursor-default gap-4 rounded-sm px-3 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
          'relative',
        ),
      })

      // const data = node.data!
      // const Icon = data.icon

      return (
        <div {...props}>
          {/* {!Icon ? null : isValidElement(Icon) ? Icon : <Icon />} */}
          <span>{node.title}</span>
          {/* <span>{data.label}</span> */}
          <TriangleRightIcon className="text-muted-foreground group-data-[menu-focused=true]:text-foreground transition-[color] duration-50 ease-out" />
          <span className="absolute top-0 right-0 text-[10px] font-medium">
            {props['data-action-menu-item-id']}
          </span>
        </div>
      )
    },
  },
})

const statusMenu: SubmenuNode = {
  kind: 'submenu',
  id: 'status',
  label: 'Status',
  title: 'Status',
  nodes: [
    {
      kind: 'item',
      id: 'icebox',
      label: 'Icebox',
      data: {
        label: 'Icebox',
        value: 'icebox',
        icon: (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle
              cx="7"
              cy="7"
              r="6"
              fill="none"
              stroke="#26b5ce"
              strokeWidth="1.5"
              strokeDasharray="1.4 1.74"
              strokeDashoffset="0.65"
            ></circle>
            <circle
              cx="7"
              cy="7"
              r="2"
              fill="none"
              stroke="#26b5ce"
              strokeWidth="4"
              strokeDasharray="12.189379495928398 24.378758991856795"
              strokeDashoffset="12.189379495928398"
              transform="rotate(-90 7 7)"
            ></circle>
          </svg>
        ),
      },
    },
    {
      kind: 'item',
      id: 'backlog',
      label: 'Backlog',
      data: {
        value: 'backlog',
        label: 'Backlog',
        icon: (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle
              className="stroke-muted-foreground"
              cx="7"
              cy="7"
              r="6"
              fill="none"
              strokeWidth="1.5"
              strokeDasharray="1.4 1.74"
              strokeDashoffset="0.65"
            ></circle>
            <circle
              className="stroke-muted-foreground"
              cx="7"
              cy="7"
              r="2"
              fill="none"
              strokeWidth="4"
              strokeDasharray="12.189379495928398 24.378758991856795"
              strokeDashoffset="12.189379495928398"
              transform="rotate(-90 7 7)"
            ></circle>
          </svg>
        ),
      },
    },
    {
      kind: 'item',
      id: 'todo',
      label: 'Todo',
      data: {
        value: 'todo',
        label: 'Todo',
        icon: (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle
              cx="7"
              cy="7"
              r="6"
              fill="none"
              strokeWidth="1.5"
              strokeDasharray="3.14 0"
              strokeDashoffset="-0.7"
              className="stroke-muted-foreground"
            ></circle>
            <circle
              cx="7"
              cy="7"
              r="2"
              fill="none"
              strokeWidth="4"
              className="stroke-muted-foreground"
              strokeDasharray="12.189379495928398 24.378758991856795"
              strokeDashoffset="12.189379495928398"
              transform="rotate(-90 7 7)"
            ></circle>
          </svg>
        ),
      },
    },
    {
      kind: 'item',
      id: 'in-progress',
      label: 'In Progress',
      data: {
        label: 'In Progress',
        value: 'in-progress',
        icon: (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle
              cx="7"
              cy="7"
              r="6"
              fill="none"
              stroke="lch(80% 90 85)"
              strokeWidth="1.5"
              strokeDasharray="3.14 0"
              strokeDashoffset="-0.7"
            ></circle>
            <circle
              cx="7"
              cy="7"
              r="2"
              fill="none"
              stroke="lch(80% 90 85)"
              strokeWidth="4"
              strokeDasharray="12.189379495928398 24.378758991856795"
              strokeDashoffset="6.094689747964199"
              transform="rotate(-90 7 7)"
            ></circle>
          </svg>
        ),
      },
    },
    {
      kind: 'item',
      id: 'done',
      label: 'Done',
      data: {
        value: 'done',
        label: 'Done',
        icon: (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle
              cx="7"
              cy="7"
              r="6"
              fill="none"
              stroke="lch(48% 59.31 288.43)"
              strokeWidth="1.5"
              strokeDasharray="3.14 0"
              strokeDashoffset="-0.7"
            ></circle>
            <circle
              cx="7"
              cy="7"
              r="3"
              fill="none"
              stroke="lch(48% 59.31 288.43)"
              strokeWidth="6"
              strokeDasharray="18.84955592153876 37.69911184307752"
              strokeDashoffset="0"
              transform="rotate(-90 7 7)"
            ></circle>
            <path
              stroke="none"
              className="fill-popover"
              d="M10.951 4.24896C11.283 4.58091 11.283 5.11909 10.951 5.45104L5.95104 10.451C5.61909 10.783 5.0809 10.783 4.74896 10.451L2.74896 8.45104C2.41701 8.11909 2.41701 7.5809 2.74896 7.24896C3.0809 6.91701 3.61909 6.91701 3.95104 7.24896L5.35 8.64792L9.74896 4.24896C10.0809 3.91701 10.6191 3.91701 10.951 4.24896Z"
            ></path>
          </svg>
        ),
      },
    },
  ],
}

const projectStatusMenu: SubmenuNode = {
  kind: 'submenu',
  id: 'project-status',
  title: 'Project status',
  label: 'Project status',
  nodes: [
    {
      kind: 'item',
      id: 'failed',
      label: 'Failed',
    },
    {
      kind: 'item',
      id: 'backlog',
      label: 'Backlog',
    },
    {
      kind: 'item',
      id: 'planned',
      label: 'Planned',
    },
    {
      kind: 'item',
      id: 'in-progress',
      label: 'In Progress',
    },
    {
      kind: 'item',
      id: 'completed',
      label: 'Completed',
    },
    {
      kind: 'item',
      id: 'canceled',
      label: 'Canceled',
    },
  ],
}

const projectPropertiesMenu: SubmenuNode = {
  kind: 'submenu',
  id: 'project-properties',
  title: 'Project properties',
  label: 'Project properties',
  nodes: [projectStatusMenu],
}

export const menuData: MenuData<ColumnOption> = {
  id: 'issue-properties',
  nodes: [statusMenu, projectPropertiesMenu],
}
