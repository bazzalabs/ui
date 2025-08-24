import type { MenuData, SubmenuNode } from '@bazza-ui/action-menu'
import type { ColumnOption } from '@bazzaui/filters'
import {
  ProjectPropertiesIcon,
  ProjectStatus,
  ProjectStatusIcon,
  Status,
  StatusIcon,
} from './icons'

const statusMenu: SubmenuNode<{ icon?: ColumnOption['icon'] }> = {
  kind: 'submenu',
  id: 'status',
  label: 'Status',
  title: 'Status',
  data: {
    icon: <StatusIcon />,
  },
  nodes: [
    {
      kind: 'item',
      id: 'icebox',
      label: 'Icebox',
      data: {
        label: 'Icebox',
        value: 'icebox',
        icon: <Status.Icebox />,
      },
    },
    {
      kind: 'item',
      id: 'backlog',
      label: 'Backlog',
      data: {
        value: 'backlog',
        label: 'Backlog',
        icon: <Status.Backlog />,
      },
    },
    {
      kind: 'item',
      id: 'todo',
      label: 'Todo',
      data: {
        value: 'todo',
        label: 'Todo',
        icon: <Status.Todo />,
      },
    },
    {
      kind: 'item',
      id: 'in-progress',
      label: 'In Progress',
      data: {
        label: 'In Progress',
        value: 'in-progress',
        icon: <Status.InProgress />,
      },
    },
    {
      kind: 'item',
      id: 'done',
      label: 'Done',
      data: {
        value: 'done',
        label: 'Done',
        icon: <Status.Done />,
      },
    },
  ],
}

const projectStatusMenu: SubmenuNode<{ icon?: ColumnOption['icon'] }> = {
  kind: 'submenu',
  id: 'project-status',
  title: 'Project status',
  label: 'Project status',
  data: {
    icon: <ProjectStatusIcon />,
  },
  nodes: [
    {
      kind: 'item',
      id: 'failed',
      label: 'Failed',
      data: {
        value: 'failed',
        label: 'Failed',
        icon: <ProjectStatus.Failed />,
      },
    },
    {
      kind: 'item',
      id: 'backlog',
      label: 'Backlog',
      data: {
        value: 'backlog',
        label: 'Backlog',
        icon: <ProjectStatus.Backlog />,
      },
    },
    {
      kind: 'item',
      id: 'planned',
      label: 'Planned',
      data: {
        value: 'planned',
        label: 'Planned',
        icon: <ProjectStatus.Planned />,
      },
    },
    {
      kind: 'item',
      id: 'in-progress',
      label: 'In Progress',
      data: {
        value: 'in-progress',
        label: 'In Progress',
        icon: <ProjectStatus.InProgress />,
      },
    },
    {
      kind: 'item',
      id: 'completed',
      label: 'Completed',
      data: {
        value: 'completed',
        label: 'Completed',
        icon: <ProjectStatus.Completed />,
      },
    },
    {
      kind: 'item',
      id: 'canceled',
      label: 'Canceled',
      data: {
        value: 'canceled',
        label: 'Canceled',
        icon: <ProjectStatus.Canceled />,
      },
    },
  ],
}

const projectPropertiesMenu: SubmenuNode = {
  kind: 'submenu',
  id: 'project-properties',
  title: 'Project properties',
  label: 'Project properties',
  data: {
    icon: <ProjectPropertiesIcon />,
  },
  nodes: [projectStatusMenu],
}

export const menuData: MenuData<Pick<ColumnOption, 'icon'>> = {
  id: 'issue-properties',
  nodes: [statusMenu, projectPropertiesMenu],
}
