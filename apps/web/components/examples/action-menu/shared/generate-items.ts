import { randomUUID } from 'node:crypto'
import type { ItemDef } from '@bazza-ui/action-menu'

export function generateItems(count: number) {
  const emojis = ['🍎', '🍌', '🍊', '🍍', '🍓', '🍇', '🍉', '🥝', '🍒', '🍑']
  const final = Array.from({ length: count }, (_, i) => {
    const n = i + 1
    const uuid = crypto.randomUUID()
    const id = `${uuid}`
    return {
      kind: 'item',
      id,
      label: `Item ${n.toString().padStart(6, '0')}`,
      icon: emojis[i % emojis.length],
      // optionally add keywords for search:
      keywords: [`#${n}`, `idx:${i}`],
    } satisfies ItemDef
  })

  return final
}
