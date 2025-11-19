'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
// Import the generated types metadata
import typesMeta from '@/.types/types-meta.json'
import { cn } from '@/lib/cn'
import Markdown from 'react-markdown'

import type { MetaOutput, PropMeta } from '@/scripts/build-types-meta'
import { HighlightedType } from './highlighted-type'

const typesData = typesMeta as MetaOutput

interface ExpandablePropRowProps {
  prop: PropMeta
  depth?: number
}

/**
 * Remove " | undefined" suffix from type string if property is optional
 */
function cleanTypeString(typeStr: string, required: boolean): string {
  if (!required && typeStr.endsWith(' | undefined')) {
    return typeStr.slice(0, -' | undefined'.length)
  }
  return typeStr
}

/**
 * Simplify type string for inline display
 * - Functions show as "function"
 * - Complex types show simplified version
 */
function simplifyType(typeStr: string): string {
  // Function types
  if (typeStr.includes('=>') || typeStr.match(/^\([^)]*\)\s*:/)) {
    return 'function'
  }

  // React elements
  if (typeStr === 'React.ReactNode' || typeStr === 'ReactNode') {
    return 'ReactNode'
  }
  if (typeStr === 'React.ReactElement' || typeStr === 'ReactElement') {
    return 'ReactElement'
  }

  // Very long types (over 50 chars) - show just the base type
  if (typeStr.length > 50) {
    const match = typeStr.match(/^([A-Za-z_$][A-Za-z0-9_$]*(?:<[^>]+>)?)/)
    if (match) return match[1]
  }

  return typeStr
}

export function ExpandablePropRow({ prop, depth = 0 }: ExpandablePropRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasExpandedType = prop.expandedType && prop.expandedType.length > 0
  const indent = depth * 16 // 16px per depth level
  const cleanedType = cleanTypeString(prop.type, prop.required)
  const simplifiedType = simplifyType(cleanedType)
  const hasDetails =
    prop.description || cleanedType !== simplifiedType || hasExpandedType

  return (
    <>
      {/* Collapsed Row */}
      {/** biome-ignore lint/a11y/noStaticElementInteractions: ignore */}
      <div
        className={cn(
          'grid grid-cols-subgrid col-span-3 group hover:bg-muted/50 border-b border-border',
          hasDetails && 'cursor-pointer',
        )}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <div className="px-4 py-2">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${indent}px` }}
          >
            <div
              className={cn(
                'p-0.5 rounded transition-colors',
                !hasDetails && 'invisible',
              )}
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </div>
            <code className="rounded-sm bg-blue-300/25 dark:text-primary text-blue-700 dark:bg-blue-600/50 px-[0.35rem] py-[0.2rem] text-sm font-mono">
              {prop.name}
              {!prop.required && '?'}
            </code>
          </div>
        </div>
        <div className="px-4 py-2">
          <span className="rounded-sm bg-muted px-[0.35rem] py-[0.2rem] text-sm inline-block">
            <HighlightedType code={simplifiedType} className="font-mono" />
          </span>
        </div>
        <div className="px-4 py-2">
          {prop.default ? (
            <code className="rounded-sm bg-muted px-[0.35rem] py-[0.2rem] text-sm font-mono">
              {prop.default}
            </code>
          ) : (
            <span className="text-muted-foreground/50 text-xs select-none">
              —
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details Row */}
      {isExpanded && (
        <div className="grid grid-cols-subgrid col-span-3 bg-muted border-b border-border pl-7">
          {/* Second column spans remaining columns */}
          <div className="px-4 py-3 col-span-3 space-y-3 [&>div]:[&>div]:even:ml-2 grid grid-cols-subgrid">
            {/* Property Name */}
            <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
              <div className="font-semibold text-muted-foreground flex-shrink-0">
                Property
              </div>
              <div className="col-span-2 ">
                <code className="bg-inherit py-1 font-mono break-words min-w-0">
                  {prop.name}
                </code>
              </div>
            </div>

            {/* Required */}
            <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
              <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                Required
              </div>
              <div className="col-span-2">
                {prop.required ? (
                  <span className="text-sm px-2 py-0.5 rounded-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    Yes
                  </span>
                ) : (
                  <span className="text-sm px-2 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    Optional
                  </span>
                )}
              </div>
            </div>

            {/* Default */}
            {prop.default && (
              <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
                <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                  Default
                </div>
                <div className="col-span-2">
                  <code className="bg-inherit py-1 font-mono text-sm break-words min-w-0">
                    {prop.default}
                  </code>
                </div>
              </div>
            )}

            {/* Description */}
            {prop.description && (
              <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
                <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                  Description
                </div>
                <div className="col-span-2 text-muted-foreground break-words min-w-0">
                  <Markdown
                    components={{
                      code: ({ children }) => (
                        // 'relative rounded-sm bg-muted px-1 py-0.5 font-mono text-sm border inset-shadow-xs font-[450]',

                        <code className="rounded-sm bg-muted px-1 py-0.5 border inset-shadow-xs font-[450] font-mono text-sm break-words min-w-0">
                          {children}
                        </code>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 last-of-type:mb-0">{children}</p>
                      ),
                      ul: ({
                        className,
                        ...props
                      }: React.HTMLAttributes<HTMLUListElement>) => (
                        <ul
                          className={cn(
                            'my-6 ml-6 list-disc [&>li>ul]:my-2 [&>li>ul]:ml-4',
                            className,
                          )}
                          {...props}
                        />
                      ),
                      li: ({
                        className,
                        ...props
                      }: React.HTMLAttributes<HTMLLIElement>) => (
                        <li className={cn('mt-1', className)} {...props} />
                      ),
                    }}
                  >
                    {prop.description}
                  </Markdown>
                </div>
              </div>
            )}

            {/* Type */}
            <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
              <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                Type
              </div>
              <div className="col-span-2 rounded-sm bg-inherit py-1 text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                <HighlightedType
                  code={cleanedType}
                  formattedCode={prop.formattedType}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Reference Link */}
            {prop.referencePath && (
              <div className="grid grid-cols-subgrid col-span-3 gap-4 text-sm items-start min-w-0">
                <div className="col-span-1 font-semibold text-muted-foreground flex-shrink-0">
                  Reference
                </div>
                <Link
                  href={`#${prop.referencePath}`}
                  className="col-span-2 text-blue-600 dark:text-blue-400 hover:underline text-sm break-words"
                >
                  View {prop.referencePath} →
                </Link>
              </div>
            )}

            {/* Nested Properties */}
            {hasExpandedType &&
              prop.expandedType &&
              prop.expandedType.length > 0 && (
                <div className="grid grid-cols-[120px_1fr] gap-4 text-sm items-start min-w-0">
                  <div className="font-semibold text-muted-foreground flex-shrink-0">
                    Properties
                  </div>
                  <div className="space-y-2 min-w-0">
                    {prop.expandedType.map((expandedProp) => (
                      <div
                        key={expandedProp.name}
                        className="text-xs break-words font-mono"
                      >
                        <code className="text-blue-600 dark:text-blue-400 font-mono">
                          {expandedProp.name}
                          {!expandedProp.required && '?'}
                        </code>
                        <span className="text-muted-foreground mx-2">:</span>
                        <HighlightedType
                          code={cleanTypeString(
                            expandedProp.type,
                            expandedProp.required,
                          )}
                          formattedCode={expandedProp.formattedType}
                          className="inline"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  )
}

interface TypeTableAutoProps {
  /**
   * Type name to display (e.g., "MenuDef")
   */
  type: string
  /**
   * Package name (e.g., "@bazza-ui/menu")
   * If not provided, will search all packages
   */
  pkg?: string
}

/**
 * Automatically renders a property table for a type from the generated metadata
 */
export function TypeTableAuto({ type, pkg }: TypeTableAutoProps) {
  // Find the type in the metadata
  let typeMeta

  if (pkg) {
    typeMeta = typesData[pkg]?.types?.[type]
  } else {
    // Search all packages
    for (const pkgData of Object.values(typesData)) {
      if (pkgData.types[type]) {
        typeMeta = pkgData.types[type]
        break
      }
    }
  }

  if (!typeMeta || !typeMeta.props || typeMeta.props.length === 0) {
    return (
      <div className="my-6 p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <p className="text-sm text-destructive">
          Type <code className="font-mono font-semibold">{type}</code> not found
          or has no properties
          {pkg ? ` in package ${pkg}` : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="my-6 border border-border rounded-md overflow-hidden">
      <div className="w-full text-sm grid grid-cols-[35%_30%_35%]">
        {/* Header */}
        <div className="grid grid-cols-subgrid col-span-3 bg-neutral-100 dark:bg-neutral-900 border-b border-border">
          <div className="px-4 py-3 font-mono font-semibold">Property</div>
          <div className="px-4 py-3 font-mono font-semibold">Type</div>
          <div className="px-4 py-3 font-mono font-semibold">Default</div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-subgrid col-span-3 bg-white dark:bg-black">
          {typeMeta.props.map((prop) => (
            <ExpandablePropRow key={prop.name} prop={prop} />
          ))}
        </div>
      </div>
    </div>
  )
}
