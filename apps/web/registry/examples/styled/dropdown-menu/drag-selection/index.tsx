'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

const columns = [
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'owner', label: 'Owner' },
  { value: 'priority', label: 'Priority' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'labels', label: 'Labels' },
  { value: 'estimate', label: 'Estimate' },
  { value: 'due-date', label: 'Due date' },
  { value: 'project', label: 'Project' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'cycle', label: 'Cycle' },
  { value: 'team', label: 'Team' },
  { value: 'creator', label: 'Creator' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'parent', label: 'Parent issue' },
  { value: 'sub-issues', label: 'Sub-issues' },
  { value: 'blocked-by', label: 'Blocked by' },
  { value: 'blocking', label: 'Blocking' },
  { value: 'comments', label: 'Comments' },
  { value: 'attachments', label: 'Attachments' },
  { value: 'links', label: 'Links' },
  { value: 'branch', label: 'Branch' },
  { value: 'pull-request', label: 'Pull request' },
  { value: 'started', label: 'Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'sla', label: 'SLA' },
  { value: 'customer', label: 'Customer' },
  { value: 'identifier', label: 'Identifier' },
]

export default function DropdownMenuDragSelection() {
  const [visible, setVisible] = React.useState<string[]>([
    'name',
    'status',
    'assignee',
  ])

  return (
    <DropdownMenu.Root dragSelection="rubber-band">
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Columns
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input hideUntilActive />
              <DropdownMenu.List>
                <DropdownMenu.CheckboxGroup
                  value={visible}
                  onValueChange={setVisible}
                >
                  <DropdownMenu.GroupLabel>
                    Visible columns
                  </DropdownMenu.GroupLabel>
                  {columns.map((column) => (
                    <DropdownMenu.CheckboxItem
                      key={column.value}
                      value={column.value}
                    >
                      <DropdownMenu.CheckboxItemIndicator />
                      {column.label}
                    </DropdownMenu.CheckboxItem>
                  ))}
                </DropdownMenu.CheckboxGroup>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
