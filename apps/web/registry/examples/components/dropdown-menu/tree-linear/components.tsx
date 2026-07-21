'use client'

import type {
  GroupDef,
  GroupRenderParams,
  ItemDef,
  ItemRenderParams,
  NodeDef,
  TreeItemDef,
  TreeItemRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import { DropdownMenu, LabelWithBreadcrumbs } from '@/registry/ui/dropdown-menu'
import { CheckIcon, TeamIcon } from './icons'

type SelectTeam = (team: string) => void

function renderLabel(label: string, context: ItemRenderParams['context']) {
  return (
    <LabelWithBreadcrumbs
      label={label}
      breadcrumbs={context.isDeepSearchResult ? context.breadcrumbs : undefined}
    />
  )
}

function createItemNode(
  label: string,
  selectedTeam: string,
  onSelect: SelectTeam,
): ItemDef {
  return {
    kind: 'item',
    value: label,
    onSelect: () => onSelect(label),
    render: ({ props, context }) => (
      <DropdownMenu.Item {...props}>
        {!context.isDeepSearchResult && (
          <DropdownMenu.Icon>
            <TeamIcon />
          </DropdownMenu.Icon>
        )}
        {renderLabel(label, context)}
        {selectedTeam === label && (
          <CheckIcon className="ml-auto size-4 shrink-0" />
        )}
      </DropdownMenu.Item>
    ),
  }
}

function createTreeItemNode(
  label: string,
  selectedTeam: string,
  onSelect: SelectTeam,
): TreeItemDef {
  return {
    kind: 'tree-item',
    value: label,
    selectable: true,
    onSelect: () => onSelect(label),
    render: ({ props, context }: TreeItemRenderParams) => (
      <DropdownMenu.TreeItem {...props} depth={context.tree?.depth}>
        {context.isDeepSearchResult ? (
          <LabelWithBreadcrumbs
            label={label}
            breadcrumbs={context.breadcrumbs}
          />
        ) : (
          <>
            {context.tree && context.tree.depth > 0 && (
              <DropdownMenu.TreeConnector tree={context.tree} />
            )}
            <DropdownMenu.Icon>
              <TeamIcon />
            </DropdownMenu.Icon>
            <span className="truncate">{label}</span>
          </>
        )}
        {selectedTeam === label && (
          <CheckIcon className="ml-auto size-4 shrink-0" />
        )}
      </DropdownMenu.TreeItem>
    ),
  }
}

function createTeamsGroup(
  label: string,
  nodes: NodeDef[],
  id: string,
): GroupDef {
  return {
    kind: 'group',
    id,
    label,
    nodes,
    render: ({ context, children }: GroupRenderParams) => (
      <DropdownMenu.Group>
        <DropdownMenu.GroupLabel>{context.label}</DropdownMenu.GroupLabel>
        {children}
      </DropdownMenu.Group>
    ),
  }
}

export function buildMenuContent(
  selectedTeam: string,
  setSelectedTeam: SelectTeam,
): NodeDef[] {
  const team = (label: string) => {
    return createTreeItemNode(label, selectedTeam, setSelectedTeam)
  }

  return [
    createTeamsGroup(
      'Your teams',
      [
        {
          ...team('Product & Engineering'),
          nodes: [team('Core builder team'), team('Design team')],
        },
        createItemNode('Website team', selectedTeam, setSelectedTeam),
        createItemNode('Feedback', selectedTeam, setSelectedTeam),
        createItemNode('Quality Assurance', selectedTeam, setSelectedTeam),
      ],
      'your-teams',
    ),
    createTeamsGroup(
      'Other teams',
      [
        createItemNode('Capture team', selectedTeam, setSelectedTeam),
        createItemNode('Documentation', selectedTeam, setSelectedTeam),
        createItemNode(
          'Integrations & Analytics team',
          selectedTeam,
          setSelectedTeam,
        ),
        createItemNode('Demo Build Tracker', selectedTeam, setSelectedTeam),
      ],
      'other-teams',
    ),
  ]
}
