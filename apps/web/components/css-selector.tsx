'use client'

import { CheckIcon, CopyIcon, SquareDashedMousePointerIcon } from 'lucide-react'
import * as React from 'react'
import typesMeta from '@/.types/types-meta.json'
import type { EnumMemberMeta, MetaOutput } from '@/scripts/build-types-meta'

const typesData = typesMeta as MetaOutput

interface CssSelectorProps {
  /**
   * The DataAttributes enum name to extract the slot from
   * (e.g., "DropdownMenuTriggerDataAttributes")
   */
  type: string
  /**
   * Package name (e.g., "@bazza-ui/react")
   * If not provided, will search all packages
   */
  pkg?: string
}

/**
 * Extracts the slot identifier from a DataAttributes enum
 */
function getSlotIdentifier(type: string, pkg?: string): string | null {
  let enumMeta:
    | { members?: EnumMemberMeta[]; enumCategory?: string }
    | undefined

  if (pkg) {
    enumMeta = typesData[pkg]?.types?.[type] as typeof enumMeta
  } else {
    // Search all packages
    for (const pkgData of Object.values(typesData)) {
      const found = pkgData.types[type] as typeof enumMeta
      if (found) {
        enumMeta = found
        break
      }
    }
  }

  if (!enumMeta?.members) {
    return null
  }

  // Find the slot member (member named 'slot' with value starting with 'bazzaui-')
  const slotMember = enumMeta.members.find(
    (m) => m.name === 'slot' && m.value.startsWith('bazzaui-'),
  )

  return slotMember?.value ?? null
}

/**
 * Displays the CSS selector for a component part.
 * Similar in style to BaseUIReference.
 *
 * @example
 * <CssSelector type="DropdownMenuTriggerDataAttributes" />
 */
export function CssSelector({ type, pkg }: CssSelectorProps) {
  const slot = getSlotIdentifier(type, pkg)
  const [copied, setCopied] = React.useState(false)

  if (!slot) {
    return null
  }

  const selector = `[${slot}]`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(selector)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2 mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
      <SquareDashedMousePointerIcon className="size-6 text-violet-500" />
      <span>CSS selector</span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-md bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-2 py-0.5 font-mono text-sm border border-violet-200 dark:border-violet-800 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors cursor-pointer"
      >
        {selector}
        {copied ? (
          <CheckIcon className="size-3 text-green-600 dark:text-green-400" />
        ) : (
          <CopyIcon className="size-3 opacity-50" />
        )}
      </button>
    </div>
  )
}
