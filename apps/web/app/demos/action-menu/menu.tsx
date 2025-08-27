import type { MenuData, SubmenuNode } from '@bazza-ui/action-menu'
import {
  ProjectPropertiesIcon,
  ProjectStatus,
  ProjectStatusIcon,
  Status,
  StatusIcon,
} from './icons'

const statusMenu: SubmenuNode = {
  kind: 'submenu',
  id: 'status',
  icon: <StatusIcon />,
  label: 'Status',
  title: 'Status',
  inputPlaceholder: 'Status...',
  nodes: [
    {
      kind: 'item',
      id: 'icebox',
      label: 'Icebox',
      icon: <Status.Icebox />,
    },
    {
      kind: 'item',
      id: 'backlog',
      label: 'Backlog',
      icon: <Status.Backlog />,
    },
    {
      kind: 'item',
      id: 'todo',
      label: 'Todo',
      icon: <Status.Todo />,
    },
    {
      kind: 'item',
      id: 'in-progress',
      label: 'In Progress',
      icon: <Status.InProgress />,
    },
    {
      kind: 'item',
      id: 'done',
      label: 'Done',
      icon: <Status.Done />,
    },
  ],
}

const projectStatusMenu: SubmenuNode = {
  kind: 'submenu',
  id: 'project-status',
  icon: <ProjectStatusIcon />,
  title: 'Project status',
  label: 'Project status',
  inputPlaceholder: 'Project status...',
  hideSearchUntilActive: true,
  nodes: [
    {
      kind: 'item',
      id: 'failed',
      label: 'Failed',
      icon: <ProjectStatus.Failed />,
    },
    {
      kind: 'item',
      id: 'backlog',
      label: 'Backlog',
      icon: <ProjectStatus.Backlog />,
    },
    {
      kind: 'item',
      id: 'planned',
      label: 'Planned',
      icon: <ProjectStatus.Planned />,
    },
    {
      kind: 'item',
      id: 'in-progress',
      label: 'In Progress',
      icon: <ProjectStatus.InProgress />,
    },
    {
      kind: 'item',
      id: 'completed',
      label: 'Completed',
      icon: <ProjectStatus.Completed />,
    },
    {
      kind: 'item',
      id: 'canceled',
      label: 'Canceled',
      icon: <ProjectStatus.Canceled />,
    },
  ],
}

const projectPropertiesMenu: SubmenuNode = {
  kind: 'submenu',
  id: 'project-properties',
  icon: <ProjectPropertiesIcon />,
  title: 'Project properties',
  label: 'Project properties',
  inputPlaceholder: 'Project properties...',
  nodes: [projectStatusMenu],
}

export const menuData: MenuData = {
  id: 'issue-properties',
  nodes: [statusMenu, projectPropertiesMenu],
}
