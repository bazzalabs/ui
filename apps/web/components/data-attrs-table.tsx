'use client'

import Markdown from 'react-markdown'
import typesMeta from '@/.types/types-meta.json'
import { cn } from '@/lib/cn'
import type { EnumMemberMeta, MetaOutput } from '@/scripts/build-types-meta'

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
 * Renders a table of data attributes from an enum in the generated metadata
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

  if (!enumMeta?.members || enumMeta.members.length === 0) {
    return (
      <div className="my-6 p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <p className="text-sm text-destructive">
          Data attributes enum{' '}
          <code className="font-mono font-semibold">{type}</code> not found or
          has no members
          {pkg ? ` in package ${pkg}` : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="my-6 border border-border rounded-md overflow-hidden">
      <div className="w-full text-sm">
        {/* Header */}
        <div className="grid grid-cols-[35%_65%] bg-neutral-100 dark:bg-neutral-900 border-b border-border">
          <div className="px-4 py-3 font-mono font-semibold">Attribute</div>
          <div className="px-4 py-3 font-mono font-semibold">Description</div>
        </div>

        {/* Body */}
        <div className="bg-white dark:bg-black">
          {enumMeta.members.map((member) => (
            <div
              key={member.name}
              className={cn(
                'grid grid-cols-[35%_65%] border-b border-border last:border-b-0',
                'hover:bg-muted/50 transition-colors',
              )}
            >
              <div className="px-4 py-2 flex items-start">
                <code className="rounded-sm bg-emerald-300/25 dark:text-emerald-300 text-emerald-700 dark:bg-emerald-600/40 px-[0.35rem] py-[0.2rem] text-sm font-mono">
                  {member.value}
                </code>
              </div>
              <div className="px-4 py-2 text-muted-foreground">
                {member.description ? (
                  <Markdown
                    components={{
                      code: ({ children }) => (
                        <code className="rounded-sm bg-muted px-1 py-0.5 border inset-shadow-xs font-[450] font-mono text-sm">
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
                  <div className="mt-1">
                    <span className="text-xs text-muted-foreground/70">
                      Value:{' '}
                    </span>
                    <code className="text-xs font-mono text-muted-foreground">
                      {member.valueType}
                    </code>
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
