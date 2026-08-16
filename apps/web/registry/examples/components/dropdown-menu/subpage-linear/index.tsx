'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { AssigneeAvatar, FilterIcon, LabelDot, MenuLabel } from './components'
import {
  AssigneeIcon,
  LabelsIcon,
  ProjectLeadIcon,
  ProjectPriority,
  ProjectPriorityIcon,
  ProjectPropertiesIcon,
  ProjectStatus,
  ProjectStatusIcon,
  ProjectStatusType,
  ProjectStatusTypeIcon,
  Status,
  StatusIcon,
} from './icons'

const labelData = [
  { id: 'bug', name: 'Bug', color: 'red' },
  { id: 'enhancement', name: 'Enhancement', color: 'green' },
  { id: 'task', name: 'Task', color: 'blue' },
  { id: 'urgent', name: 'Urgent', color: 'pink' },
  { id: 'low-priority', name: 'Low Priority', color: 'lime' },
  { id: 'frontend', name: 'Frontend', color: 'orange' },
  { id: 'backend', name: 'Backend', color: 'teal' },
  { id: 'database', name: 'Database', color: 'violet' },
  { id: 'api', name: 'API', color: 'red' },
  { id: 'ai-model', name: 'AI Model', color: 'cyan' },
  { id: 'data-pipeline', name: 'Data Pipeline', color: 'amber' },
  { id: 'inference', name: 'Inference', color: 'emerald' },
  { id: 'ai-integration', name: 'AI Integration', color: 'purple' },
  { id: 'ethics', name: 'Ethics', color: 'fuchsia' },
  { id: 'refactor', name: 'Refactor', color: 'lime' },
  { id: 'performance', name: 'Performance', color: 'red' },
  { id: 'security', name: 'Security', color: 'sky' },
  { id: 'testing', name: 'Testing', color: 'yellow' },
  { id: 'documentation', name: 'Documentation', color: 'rose' },
  { id: 'in-progress', name: 'In Progress', color: 'green' },
  { id: 'blocked', name: 'Blocked', color: 'indigo' },
  { id: 'needs-review', name: 'Needs Review', color: 'orange' },
  { id: 'done', name: 'Done', color: 'teal' },
  { id: 'ui', name: 'UI', color: 'red' },
  { id: 'ux', name: 'UX', color: 'sky' },
  { id: 'accessibility', name: 'Accessibility', color: 'red' },
  { id: 'deployment', name: 'Deployment', color: 'emerald' },
  { id: 'infrastructure', name: 'Infrastructure', color: 'purple' },
  { id: 'monitoring', name: 'Monitoring', color: 'pink' },
  { id: 'real-time', name: 'Real-Time', color: 'lime' },
] as const

const projectLabelData = [
  { id: 'pl-1', name: 'Strategic Initiative', color: 'purple' },
  { id: 'pl-2', name: 'Customer Facing', color: 'blue' },
  { id: 'pl-3', name: 'Internal Tooling', color: 'teal' },
  { id: 'pl-4', name: 'Technical Debt', color: 'orange' },
  { id: 'pl-5', name: 'Revenue Impact', color: 'green' },
  { id: 'pl-6', name: 'Cost Reduction', color: 'emerald' },
  { id: 'pl-7', name: 'Compliance', color: 'red' },
  { id: 'pl-8', name: 'Platform', color: 'indigo' },
  { id: 'pl-9', name: 'Infrastructure', color: 'violet' },
  { id: 'pl-10', name: 'Growth', color: 'lime' },
  { id: 'pl-11', name: 'Maintenance', color: 'amber' },
  { id: 'pl-12', name: 'Research', color: 'cyan' },
  { id: 'pl-13', name: 'Partnership', color: 'pink' },
  { id: 'pl-14', name: 'Migration', color: 'sky' },
  { id: 'pl-15', name: 'Deprecation', color: 'rose' },
] as const

const assignees = [
  { id: '@kianbazza', name: 'Kian Bazza', username: 'kianbazza' },
  { id: '@shadcn', name: 'shadcn', username: 'shadcn' },
  { id: '@rauchg', name: 'Guillermo Rauch', username: 'rauchg' },
  { id: '@t3dotgg', name: 'Theo Browne', username: 't3dotgg' },
] as const

const statusOptions = [
  { id: 'icebox', label: 'Icebox', icon: <Status.Icebox /> },
  { id: 'backlog', label: 'Backlog', icon: <Status.Backlog /> },
  { id: 'todo', label: 'Todo', icon: <Status.Todo /> },
  { id: 'in-progress', label: 'In Progress', icon: <Status.InProgress /> },
  { id: 'done', label: 'Done', icon: <Status.Done /> },
] as const

const priorityOptions = [
  {
    id: 'no-priority',
    label: 'No priority',
    icon: <ProjectPriority.NoPriority />,
  },
  { id: 'urgent', label: 'Urgent', icon: <ProjectPriority.Urgent /> },
  { id: 'high', label: 'High', icon: <ProjectPriority.High /> },
  { id: 'medium', label: 'Medium', icon: <ProjectPriority.Medium /> },
  { id: 'low', label: 'Low', icon: <ProjectPriority.Low /> },
] as const

const projectStatusOptions = [
  { id: 'failed', label: 'Failed', icon: <ProjectStatus.Failed /> },
  { id: 'backlog', label: 'Backlog', icon: <ProjectStatus.Backlog /> },
  { id: 'planned', label: 'Planned', icon: <ProjectStatus.Planned /> },
  {
    id: 'in-progress',
    label: 'In Progress',
    icon: <ProjectStatus.InProgress />,
  },
  { id: 'completed', label: 'Completed', icon: <ProjectStatus.Completed /> },
  { id: 'canceled', label: 'Canceled', icon: <ProjectStatus.Canceled /> },
] as const

const projectStatusTypeOptions = [
  { id: 'backlog', label: 'Backlog', icon: <ProjectStatusType.Backlog /> },
  { id: 'planned', label: 'Planned', icon: <ProjectStatusType.Planned /> },
  {
    id: 'in-progress',
    label: 'In Progress',
    icon: <ProjectStatusType.InProgress />,
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: <ProjectStatusType.Completed />,
  },
  { id: 'canceled', label: 'Canceled', icon: <ProjectStatusType.Canceled /> },
] as const

function IconItem({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode
  label: string
  onSelect: () => void
}) {
  return (
    <DropdownMenu.Item value={label} keywords={[label]} onSelect={onSelect}>
      <DropdownMenu.Icon>{icon}</DropdownMenu.Icon>
      {label}
    </DropdownMenu.Item>
  )
}

function AssigneeItem({ name, username }: { name: string; username: string }) {
  return (
    <DropdownMenu.Item
      value={name}
      keywords={[name, username]}
      onSelect={() => toast(`Assigned to ${name}`)}
    >
      <DropdownMenu.Icon>
        <AssigneeAvatar name={name} username={username} />
      </DropdownMenu.Icon>
      {name}
    </DropdownMenu.Item>
  )
}

function LabelItem({
  name,
  color,
  checked,
  onCheckedChange,
}: {
  name: string
  color: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <DropdownMenu.CheckboxItem
      id={name}
      keywords={[name]}
      checked={checked}
      onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
    >
      <DropdownMenu.CheckboxItemIndicator />
      <DropdownMenu.Icon>
        <LabelDot color={color} />
      </DropdownMenu.Icon>
      {name}
    </DropdownMenu.CheckboxItem>
  )
}

function SubmenuSurface({
  placeholder,
  hideUntilActive,
  children,
}: {
  placeholder: string
  hideUntilActive?: boolean
  children: React.ReactNode
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Positioner>
        <DropdownMenu.Popup>
          <DropdownMenu.Surface>
            <DropdownMenu.Input
              placeholder={placeholder}
              hideUntilActive={hideUntilActive}
            />
            <DropdownMenu.List>
              <DropdownMenu.Empty />
              {children}
            </DropdownMenu.List>
          </DropdownMenu.Surface>
        </DropdownMenu.Popup>
      </DropdownMenu.Positioner>
    </DropdownMenu.Portal>
  )
}

export default function DropdownMenuSubpageLinear() {
  const [selectedLabelIds, setSelectedLabelIds] = React.useState(
    () => new Set(['bug', 'task', 'urgent']),
  )
  const [selectedProjectLabelIds, setSelectedProjectLabelIds] = React.useState(
    () => new Set(['pl-1', 'pl-3', 'pl-5']),
  )

  const toggleLabel = (
    id: string,
    checked: boolean,
    project: boolean,
    name: string,
  ) => {
    const setSelectedIds = project
      ? setSelectedProjectLabelIds
      : setSelectedLabelIds
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
    toast(
      `${checked ? 'Added' : 'Removed'} ${project ? 'project label' : 'label'}: ${name}`,
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" size="sm" />}>
        <FilterIcon />
        Filter
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Subpage pageId="ai-filter">
              <DropdownMenu.Surface>
                <DropdownMenu.Input />
                <DropdownMenu.List>
                  <DropdownMenu.Item>Hi</DropdownMenu.Item>
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Subpage>

            <DropdownMenu.Surface>
              <DropdownMenu.Input placeholder="Search filters..." />
              <DropdownMenu.List>
                <DropdownMenu.Empty />

                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger>
                    <MenuLabel icon={<StatusIcon />} label="Status" />
                  </DropdownMenu.SubmenuTrigger>
                  <SubmenuSurface placeholder="Status...">
                    {statusOptions.map((option) => (
                      <IconItem
                        key={option.id}
                        icon={option.icon}
                        label={option.label}
                        onSelect={() =>
                          toast(`Changed status to ${option.label}.`)
                        }
                      />
                    ))}
                  </SubmenuSurface>
                </DropdownMenu.Submenu>

                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger>
                    <MenuLabel icon={<AssigneeIcon />} label="Assignee" />
                  </DropdownMenu.SubmenuTrigger>
                  <SubmenuSurface placeholder="Assignee...">
                    {assignees.map((assignee) => (
                      <AssigneeItem
                        key={assignee.id}
                        name={assignee.name}
                        username={assignee.username}
                      />
                    ))}
                  </SubmenuSurface>
                </DropdownMenu.Submenu>

                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger>
                    <MenuLabel
                      icon={<ProjectPriorityIcon />}
                      label="Priority"
                    />
                  </DropdownMenu.SubmenuTrigger>
                  <SubmenuSurface placeholder="Priority...">
                    {priorityOptions.map((option) => (
                      <IconItem
                        key={option.id}
                        icon={option.icon}
                        label={option.label}
                        onSelect={() =>
                          toast(`Changed priority to ${option.label}.`)
                        }
                      />
                    ))}
                  </SubmenuSurface>
                </DropdownMenu.Submenu>

                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger>
                    <MenuLabel icon={<LabelsIcon />} label="Labels" />
                  </DropdownMenu.SubmenuTrigger>
                  <SubmenuSurface placeholder="Labels...">
                    {labelData.map((label) => (
                      <LabelItem
                        key={label.id}
                        name={label.name}
                        color={label.color}
                        checked={selectedLabelIds.has(label.id)}
                        onCheckedChange={(checked) =>
                          toggleLabel(label.id, checked, false, label.name)
                        }
                      />
                    ))}
                  </SubmenuSurface>
                </DropdownMenu.Submenu>

                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger>
                    <MenuLabel
                      icon={<ProjectPropertiesIcon />}
                      label="Project properties"
                    />
                  </DropdownMenu.SubmenuTrigger>
                  <SubmenuSurface placeholder="Project properties...">
                    <DropdownMenu.Submenu>
                      <DropdownMenu.SubmenuTrigger>
                        <MenuLabel
                          icon={<ProjectStatusIcon />}
                          label="Project status"
                        />
                      </DropdownMenu.SubmenuTrigger>
                      <SubmenuSurface
                        placeholder="Project status..."
                        hideUntilActive
                      >
                        {projectStatusOptions.map((option) => (
                          <IconItem
                            key={option.id}
                            icon={option.icon}
                            label={option.label}
                            onSelect={() =>
                              toast(
                                `Changed project status to ${option.label}.`,
                              )
                            }
                          />
                        ))}
                      </SubmenuSurface>
                    </DropdownMenu.Submenu>

                    <DropdownMenu.Submenu>
                      <DropdownMenu.SubmenuTrigger>
                        <MenuLabel
                          icon={<ProjectStatusTypeIcon />}
                          label="Project status type"
                        />
                      </DropdownMenu.SubmenuTrigger>
                      <SubmenuSurface placeholder="Project status type...">
                        {projectStatusTypeOptions.map((option) => (
                          <IconItem
                            key={option.id}
                            icon={option.icon}
                            label={option.label}
                            onSelect={() =>
                              toast(
                                `Changed project status type to ${option.label}.`,
                              )
                            }
                          />
                        ))}
                      </SubmenuSurface>
                    </DropdownMenu.Submenu>

                    <DropdownMenu.Submenu>
                      <DropdownMenu.SubmenuTrigger>
                        <MenuLabel
                          icon={<ProjectPriorityIcon />}
                          label="Project priority"
                        />
                      </DropdownMenu.SubmenuTrigger>
                      <SubmenuSurface placeholder="Project priority...">
                        {priorityOptions.map((option) => (
                          <IconItem
                            key={option.id}
                            icon={option.icon}
                            label={option.label}
                            onSelect={() =>
                              toast(
                                `Changed project priority to ${option.label}.`,
                              )
                            }
                          />
                        ))}
                      </SubmenuSurface>
                    </DropdownMenu.Submenu>

                    <DropdownMenu.Submenu>
                      <DropdownMenu.SubmenuTrigger>
                        <MenuLabel
                          icon={<LabelsIcon />}
                          label="Project labels"
                        />
                      </DropdownMenu.SubmenuTrigger>
                      <SubmenuSurface placeholder="Project labels...">
                        {projectLabelData.map((label) => (
                          <LabelItem
                            key={label.id}
                            name={label.name}
                            color={label.color}
                            checked={selectedProjectLabelIds.has(label.id)}
                            onCheckedChange={(checked) =>
                              toggleLabel(label.id, checked, true, label.name)
                            }
                          />
                        ))}
                      </SubmenuSurface>
                    </DropdownMenu.Submenu>

                    <DropdownMenu.Submenu>
                      <DropdownMenu.SubmenuTrigger>
                        <MenuLabel
                          icon={<ProjectLeadIcon />}
                          label="Project lead"
                        />
                      </DropdownMenu.SubmenuTrigger>
                      <SubmenuSurface placeholder="Project lead...">
                        {assignees.map((assignee) => (
                          <DropdownMenu.Item
                            key={assignee.id}
                            value={assignee.name}
                            keywords={[assignee.name, assignee.username]}
                            onSelect={() =>
                              toast(`Set project lead to ${assignee.name}`)
                            }
                          >
                            <DropdownMenu.Icon>
                              <AssigneeAvatar
                                name={assignee.name}
                                username={assignee.username}
                              />
                            </DropdownMenu.Icon>
                            {assignee.name}
                          </DropdownMenu.Item>
                        ))}
                      </SubmenuSurface>
                    </DropdownMenu.Submenu>
                  </SubmenuSurface>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
