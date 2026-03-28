'use client'

import Markdown from 'react-markdown'
import typesMeta from '@/.types/types-meta.json'
import { cn } from '@/lib/cn'
import type { EnumMemberMeta, MetaOutput } from '@/scripts/build-types-meta'
import { HighlightedType } from './highlighted-type'

const typesData = typesMeta as MetaOutput

interface DataAttrsTableProps {
  /**
   * The enum name to display (e.g., "DropdownMenuTriggerDataAttributes")
   */
  type: string
  /**
   * Package name (e.g., "@bazza-ui/react")
   * If not provided, will search all packages
   */
  pkg?: string
}

/**
 * Renders a table of data attributes from an enum in the generated metadata.
 * Automatically filters out the 'slot' member (bazzaui-* identifiers) since
 * those are displayed separately via <PartHeading>.
 */
export function DataAttrsTable({ type, pkg }: DataAttrsTableProps) {
  // Find the enum in the metadata
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

  // Filter out the 'slot' member (shown in PartHeading instead)
  const dataAttrMembers = enumMeta?.members?.filter(
    (m) => !(m.name === 'slot' && m.value.startsWith('bazzaui-')),
  )

  if (!dataAttrMembers || dataAttrMembers.length === 0) {
    // No data attributes to show (either not found, or only had a slot member)
    return null
  }

  return (
    <div className="my-6 border border-border rounded-md overflow-hidden">
      <div className="w-full text-sm">
        {/* Header */}
        <div className="grid grid-cols-[35%_65%] bg-neutral-100 dark:bg-neutral-900 border-b border-border">
          <div className="px-4 py-3 font-medium">Attribute</div>
          <div className="px-4 py-3 font-medium">Description</div>
        </div>

        {/* Body */}
        <div className="bg-white dark:bg-black **:text-[13px]">
          {dataAttrMembers.map((member) => (
            <div
              key={member.name}
              className={cn(
                'grid grid-cols-[35%_65%] border-b border-border last:border-b-0 items-center',
                'hover:bg-muted/50 transition-colors',
              )}
            >
              <div className="px-4 py-2 flex items-start">
                <code className="rounded-sm bg-emerald-300/25 dark:text-emerald-300 text-emerald-700 dark:bg-emerald-600/40 px-[0.35rem] py-[0.2rem] font-mono">
                  {member.value}
                </code>
              </div>
              <div className="px-4 text-muted-foreground py-2">
                {member.description ? (
                  <Markdown
                    components={{
                      code: ({ children }) => (
                        <code className="rounded-sm bg-muted px-1 py-0.5 border inset-shadow-xs font-[450] font-mono text-[13px]">
                          {children}
                        </code>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 last-of-type:mb-0">{children}</p>
                      ),
                    }}
                  >
                    {member.description}
                  </Markdown>
                ) : (
                  <span className="text-muted-foreground/50 text-xs select-none">
                    —
                  </span>
                )}
                {member.valueType && (
                  <div className="mt-2">
                    <HighlightedType code={member.valueType} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
