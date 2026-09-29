'use client'

import type {
  ItemDef,
  SuggestionMenuTextTriggerMatch,
} from '@bazza-ui/react/suggestion-menu'
import {
  CodeIcon,
  Heading1Icon,
  ListIcon,
  type LucideIcon,
  QuoteIcon,
} from 'lucide-react'
import * as React from 'react'
import { SuggestionMenu } from '@/registry/ui/suggestion-menu'

const people = [
  'Alice Smith',
  'Alan Turing',
  'Ada Lovelace',
  'Bob Martin',
  'Grace Hopper',
  'Linus Torvalds',
]

const commands: Array<{ name: string; icon: LucideIcon; text: string }> = [
  { name: 'Heading', icon: Heading1Icon, text: '# ' },
  { name: 'Bulleted list', icon: ListIcon, text: '- ' },
  { name: 'Quote', icon: QuoteIcon, text: '> ' },
  { name: 'Code block', icon: CodeIcon, text: '```\n' },
]

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

export default function SuggestionMenuTextarea() {
  const [menu] = React.useState(() =>
    SuggestionMenu.createHandle<SuggestionMenuTextTriggerMatch>(),
  )
  const triggerRef = SuggestionMenu.useTextTrigger(menu, {
    triggers: [{ char: '@', allowSpaces: true }, { char: '/' }],
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

  const mentions = React.useMemo(
    (): ItemDef[] =>
      people.map((name) => ({
        kind: 'item',
        value: name,
        onSelect: () => insert(`@${name} `),
        render: ({ props }) => (
          <SuggestionMenu.Item {...props}>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
              {name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </span>
            {name}
          </SuggestionMenu.Item>
        ),
      })),
    [insert],
  )

  const slashCommands = React.useMemo(
    (): ItemDef[] =>
      commands.map(({ name, icon: Icon, text }) => ({
        kind: 'item',
        value: name,
        onSelect: () => insert(text),
        render: ({ props }) => (
          <SuggestionMenu.Item {...props}>
            <SuggestionMenu.Icon>
              <Icon />
            </SuggestionMenu.Icon>
            {name}
          </SuggestionMenu.Item>
        ),
      })),
    [insert],
  )

  return (
    <div className="w-full max-w-md">
      <textarea
        ref={triggerRef}
        rows={5}
        placeholder="Type @ to mention someone, or / for a command"
        className="[font-feature-settings:'calt'_0] w-full resize-none rounded-lg border bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <SuggestionMenu.Root handle={menu}>
        {({ payload }) => (
          <SuggestionMenu.Portal>
            <SuggestionMenu.Positioner>
              <SuggestionMenu.Popup>
                <SuggestionMenu.Surface
                  content={
                    payload?.trigger.char === '/' ? slashCommands : mentions
                  }
                >
                  <SuggestionMenu.List>
                    <Rows />
                    <SuggestionMenu.Empty />
                  </SuggestionMenu.List>
                </SuggestionMenu.Surface>
              </SuggestionMenu.Popup>
            </SuggestionMenu.Positioner>
          </SuggestionMenu.Portal>
        )}
      </SuggestionMenu.Root>
    </div>
  )
}
