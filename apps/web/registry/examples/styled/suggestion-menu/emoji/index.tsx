'use client'

import type {
  ItemDef,
  SuggestionMenuTextTriggerMatch,
} from '@bazza-ui/react/suggestion-menu'
import * as React from 'react'
import { SuggestionMenu } from '@/registry/ui/suggestion-menu'

// [shortcode, emoji, keywords]
const emoji: Array<[string, string, string[]?]> = [
  ['smile', '😄', ['happy', 'joy']],
  ['smiley', '😃', ['happy']],
  ['grin', '😁', ['happy']],
  ['joy', '😂', ['laugh', 'tears']],
  ['wink', '😉'],
  ['blush', '😊', ['happy']],
  ['heart_eyes', '😍', ['love']],
  ['thinking', '🤔', ['hmm']],
  ['sweat_smile', '😅', ['relief']],
  ['smirk', '😏'],
  ['sob', '😭', ['cry', 'sad']],
  ['scream', '😱', ['shock']],
  ['sunglasses', '😎', ['cool']],
  ['upside_down', '🙃'],
  ['eyes', '👀', ['look']],
  ['thumbsup', '👍', ['+1', 'yes', 'approve']],
  ['thumbsdown', '👎', ['-1', 'no']],
  ['clap', '👏', ['applause']],
  ['raised_hands', '🙌', ['celebrate']],
  ['pray', '🙏', ['thanks', 'please']],
  ['wave', '👋', ['hello', 'bye']],
  ['muscle', '💪', ['strong']],
  ['heart', '❤️', ['love']],
  ['sparkles', '✨', ['shiny', 'new']],
  ['fire', '🔥', ['hot', 'lit']],
  ['tada', '🎉', ['party', 'celebrate']],
  ['rocket', '🚀', ['ship', 'launch']],
  ['star', '⭐'],
  ['zap', '⚡', ['fast']],
  ['bug', '🐛'],
  ['white_check_mark', '✅', ['done', 'yes']],
  ['x', '❌', ['no', 'wrong']],
  ['warning', '⚠️', ['caution']],
  ['construction', '🚧', ['wip']],
  ['memo', '📝', ['note', 'write']],
  ['bulb', '💡', ['idea']],
  ['lock', '🔒', ['secure']],
  ['coffee', '☕', ['break']],
  ['snail', '🐌', ['slow']],
  ['skull', '💀', ['dead']],
]

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

export default function SuggestionMenuEmoji() {
  const [menu] = React.useState(() =>
    SuggestionMenu.createHandle<SuggestionMenuTextTriggerMatch>(),
  )
  // One character after ":" before the menu opens, so a lone colon stays quiet.
  const triggerRef = SuggestionMenu.useTextTrigger(menu, {
    triggers: [{ char: ':', minLength: 1 }],
  })

  // Replaces the trigger and its query with `text`.
  const insert = React.useCallback(
    (text: string) => {
      const field = menu.host as HTMLInputElement | null
      const match = menu.payload
      if (!field || !match) return
      field.setRangeText(text, match.from, match.to, 'end')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    },
    [menu],
  )

  const content = React.useMemo(
    (): ItemDef[] =>
      emoji.map(([shortcode, char, keywords]) => ({
        kind: 'item',
        value: shortcode,
        keywords,
        onSelect: () => insert(char),
        render: ({ props }) => (
          <SuggestionMenu.Item {...props}>
            <span
              aria-hidden
              className="w-4 shrink-0 text-center text-base leading-none"
            >
              {char}
            </span>
            <span className="truncate">:{shortcode}:</span>
          </SuggestionMenu.Item>
        ),
      })),
    [insert],
  )

  return (
    <div className="w-full max-w-md">
      <input
        ref={triggerRef}
        placeholder="Send a message… type : and a word for emoji"
        className="[font-feature-settings:'calt'_0] h-9 w-full rounded-lg border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <SuggestionMenu.Root handle={menu} noResults="close">
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup className="w-56">
              <SuggestionMenu.Surface content={content}>
                <SuggestionMenu.List maxHeight={264}>
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
