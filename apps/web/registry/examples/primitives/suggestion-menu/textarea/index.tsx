'use client'

import {
  type ItemDef,
  SuggestionMenu,
  type SuggestionMenuTextTriggerMatch,
} from '@bazza-ui/react/suggestion-menu'
import * as React from 'react'

const people = [
  'Alice Smith',
  'Alan Turing',
  'Ada Lovelace',
  'Bob Martin',
  'Grace Hopper',
  'Linus Torvalds',
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
    triggers: [{ char: '@', allowSpaces: true }],
  })

  const content = React.useMemo(
    (): ItemDef[] =>
      people.map((name) => ({
        kind: 'item',
        value: name,
        onSelect: () => {
          // Replace "@query" with the mention.
          const field = menu.host as HTMLTextAreaElement | null
          const match = menu.payload
          if (!field || !match) return
          field.setRangeText(`@${name} `, match.from, match.to, 'end')
          field.dispatchEvent(new Event('input', { bubbles: true }))
        },
        render: ({ props }) => (
          <SuggestionMenu.Item {...props} className={itemClass}>
            {name}
          </SuggestionMenu.Item>
        ),
      })),
    [menu],
  )

  return (
    <div className="w-80">
      <textarea
        ref={triggerRef}
        rows={4}
        placeholder="Type @ to mention someone"
        className="w-full resize-none rounded-none border border-neutral-950 bg-white p-3 text-sm text-neutral-950 outline-hidden placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:focus-visible:outline-white"
      />
      <SuggestionMenu.Root handle={menu}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner className="outline-hidden" sideOffset={4}>
            <SuggestionMenu.Popup className="w-56 border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 outline-hidden dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
              <SuggestionMenu.Surface content={content}>
                <SuggestionMenu.List className="max-h-60 overflow-y-auto py-1">
                  <Rows />
                  <SuggestionMenu.Empty className="px-4 py-2 text-sm text-neutral-500">
                    No one found.
                  </SuggestionMenu.Empty>
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </div>
  )
}

const itemClass =
  'relative z-[1] flex cursor-default items-center py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none before:absolute before:inset-x-1 before:inset-y-0 before:z-[-1] data-disabled:text-neutral-500 data-highlighted:text-white data-highlighted:before:bg-neutral-950 dark:data-disabled:text-neutral-400 dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white'
