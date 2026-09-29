'use client'

import type {
  ItemDef,
  SuggestionMenuTextTriggerMatch,
} from '@bazza-ui/react/suggestion-menu'
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  InfoIcon,
  ListCollapseIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  type LucideIcon,
  PaperclipIcon,
  QuoteIcon,
  SquareCodeIcon,
  WorkflowIcon,
} from 'lucide-react'
import * as React from 'react'
import { SuggestionMenu } from '@/registry/ui/suggestion-menu'

type Command = {
  name: string
  icon: LucideIcon
  /** Markdown that replaces `/query`. */
  text: string
  shortcut?: string[]
  keywords?: string[]
}

const commands: Command[] = [
  {
    name: 'Heading 1',
    icon: Heading1Icon,
    text: '# ',
    shortcut: ['⌘', '⌥', '1'],
    keywords: ['h1', 'title'],
  },
  {
    name: 'Heading 2',
    icon: Heading2Icon,
    text: '## ',
    shortcut: ['⌘', '⌥', '2'],
    keywords: ['h2'],
  },
  {
    name: 'Heading 3',
    icon: Heading3Icon,
    text: '### ',
    shortcut: ['⌘', '⌥', '3'],
    keywords: ['h3'],
  },
  {
    name: 'Bulleted list',
    icon: ListIcon,
    text: '- ',
    shortcut: ['⌘', '⇧', '8'],
    keywords: ['ul'],
  },
  {
    name: 'Numbered list',
    icon: ListOrderedIcon,
    text: '1. ',
    shortcut: ['⌘', '⇧', '9'],
    keywords: ['ol'],
  },
  {
    name: 'Checklist',
    icon: ListTodoIcon,
    text: '- [ ] ',
    shortcut: ['⌘', '⇧', '7'],
    keywords: ['todo', 'task'],
  },
  {
    name: 'Insert media…',
    icon: ImageIcon,
    text: '![]()',
    keywords: ['image', 'video'],
  },
  {
    name: 'Attach files…',
    icon: PaperclipIcon,
    text: '[]()',
    shortcut: ['⌘', '⇧', 'U'],
    keywords: ['upload'],
  },
  {
    name: 'Code block',
    icon: SquareCodeIcon,
    text: '```\n',
    shortcut: ['⌘', '⇧', '\\'],
  },
  {
    name: 'Diagram',
    icon: WorkflowIcon,
    text: '```mermaid\n',
    keywords: ['mermaid', 'chart'],
  },
  {
    name: 'Collapsible section',
    icon: ListCollapseIcon,
    text: '<details>\n',
    shortcut: ['⌘', '⇧', '6'],
    keywords: ['toggle', 'details'],
  },
  {
    name: 'Blockquote',
    icon: QuoteIcon,
    text: '> ',
    shortcut: ['⌥', '⇧', '.'],
    keywords: ['quote'],
  },
  {
    name: 'Callout',
    icon: InfoIcon,
    text: '> [!NOTE]\n> ',
    keywords: ['note', 'admonition'],
  },
]

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

export default function SuggestionMenuSlashCommands() {
  const [menu] = React.useState(() =>
    SuggestionMenu.createHandle<SuggestionMenuTextTriggerMatch>(),
  )
  const triggerRef = SuggestionMenu.useTextTrigger(menu, {
    triggers: [{ char: '/' }],
  })

  // Replaces the trigger and its query with `text`.
  const insert = React.useCallback(
    (text: string) => {
      const field = menu.host as HTMLTextAreaElement | null
      const match = menu.payload
      if (!field || !match) return
      field.setRangeText(text, match.from, match.to, 'end')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    },
    [menu],
  )

  const content = React.useMemo(
    (): ItemDef[] =>
      commands.map(({ name, icon: Icon, text, shortcut, keywords }) => ({
        kind: 'item',
        value: name,
        keywords,
        onSelect: () => insert(text),
        render: ({ props }) => (
          <SuggestionMenu.Item {...props}>
            <SuggestionMenu.Icon>
              <Icon />
            </SuggestionMenu.Icon>
            <span className="truncate">{name}</span>
            {shortcut && <SuggestionMenu.Shortcut keys={shortcut} />}
          </SuggestionMenu.Item>
        ),
      })),
    [insert],
  )

  return (
    <div className="w-full max-w-md">
      <textarea
        ref={triggerRef}
        rows={4}
        placeholder="Write something… type / for commands"
        className="[font-feature-settings:'calt'_0] w-full resize-none rounded-lg border bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      {/* A "/" that matches nothing is probably a path or a fraction, so the menu gets out of the way. */}
      <SuggestionMenu.Root handle={menu} noResults="close">
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup className="w-64">
              <SuggestionMenu.Surface content={content}>
                <SuggestionMenu.List maxHeight={400}>
                  <Rows />
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </div>
  )
}
