'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
// Import the generated types metadata
import typesMeta from '@/.types/types-meta.json'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/cn'

import type { MetaOutput, PropMeta, TypeMeta } from '@/scripts/build-types-meta'
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
    if (match) return match[1]!
  }

  return typeStr
}

function ExpandablePropRow({ prop, depth = 0 }: ExpandablePropRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasExpandedType = prop.expandedType && prop.expandedType.length > 0
  const indent = depth * 16 // 16px per depth level
  const cleanedType = cleanTypeString(prop.type, prop.required)
  const simplifiedType = simplifyType(cleanedType)
  const hasDetails =
    prop.description || cleanedType !== simplifiedType || hasExpandedType

  return (
    <>
      <TableRow
        className={cn(
          'group hover:bg-muted/50',
          hasDetails && 'cursor-pointer',
        )}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <TableCell>
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
            <code className="rounded-sm bg-blue-300/25 dark:text-primary text-blue-700 dark:bg-blue-600/50 px-[0.35rem] py-[0.2rem] text-sm">
              {prop.name}
              {!prop.required && '?'}
            </code>
          </div>
        </TableCell>
        <TableCell>
          <code className="rounded-sm bg-muted px-[0.35rem] py-[0.2rem] text-xs">
            {simplifiedType}
          </code>
        </TableCell>
        <TableCell>
          {prop.default ? (
            <code className="rounded-sm bg-muted px-[0.35rem] py-[0.2rem] text-xs">
              {prop.default}
            </code>
          ) : (
            <span className="text-muted-foreground/50 text-xs">—</span>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded Details Row */}
      {isExpanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={3} className="p-0 !overflow-visible">
            <div
              className="px-4 py-3 space-y-3 max-w-full"
              style={{ paddingLeft: `${indent + 40}px` }}
            >
              {/* Property Name */}
              <div className="grid grid-cols-[120px_1fr] gap-4 text-sm items-start min-w-0">
                <div className="font-semibold text-muted-foreground flex-shrink-0">
                  Property
                </div>
                <code className="rounded-sm bg-background px-2 py-1 font-mono break-words min-w-0">
                  {prop.name}
                </code>
              </div>

              {/* Type */}
              <div className="grid grid-cols-[120px_1fr] gap-4 text-sm items-start min-w-0">
                <div className="font-semibold text-muted-foreground flex-shrink-0">
                  Type
                </div>
                <div className="rounded-sm bg-background px-2 py-1 text-xs whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                  <HighlightedType code={cleanedType} className="font-mono" />
                </div>
              </div>

              {/* Required */}
              <div className="grid grid-cols-[120px_1fr] gap-4 text-sm items-start min-w-0">
                <div className="font-semibold text-muted-foreground flex-shrink-0">
                  Required
                </div>
                <div>
                  {prop.required ? (
                    <span className="text-xs px-2 py-0.5 rounded-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                      Yes
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      Optional
                    </span>
                  )}
                </div>
              </div>

              {/* Default */}
              {prop.default && (
                <div className="grid grid-cols-[120px_1fr] gap-4 text-sm items-start min-w-0">
                  <div className="font-semibold text-muted-foreground flex-shrink-0">
                    Default
                  </div>
                  <code className="rounded-sm bg-background px-2 py-1 font-mono text-xs break-words min-w-0">
                    {prop.default}
                  </code>
                </div>
              )}

              {/* Description */}
              {prop.description && (
                <div className="grid grid-cols-[120px_1fr] gap-4 text-sm items-start min-w-0">
                  <div className="font-semibold text-muted-foreground flex-shrink-0">
                    Description
                  </div>
                  <div className="text-muted-foreground break-words min-w-0">
                    {prop.description}
                  </div>
                </div>
              )}

              {/* Reference Link */}
              {prop.referencePath && (
                <div className="grid grid-cols-[120px_1fr] gap-4 text-sm items-start min-w-0">
                  <div className="font-semibold text-muted-foreground flex-shrink-0">
                    Reference
                  </div>
                  <Link
                    href={`#${prop.referencePath}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-words"
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
                          <code className="text-blue-600 dark:text-blue-400">
                            {expandedProp.name}
                            {!expandedProp.required && '?'}
                          </code>
                          <span className="text-muted-foreground mx-2">:</span>
                          <HighlightedType
                            code={cleanTypeString(
                              expandedProp.type,
                              expandedProp.required,
                            )}
                            className="inline"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

interface TypeReferenceProps {
  /**
   * Type name to display (e.g., "MenuDef")
   */
  name: string
  /**
   * Package name (e.g., "@bazza-ui/menu")
   * If not provided, will search all packages
   */
  pkg?: string
  /**
   * Whether to show the full type signature
   */
  showSignature?: boolean
}

/**
 * Component that displays a type reference from the generated types metadata
 */
export function TypeReference({
  name,
  pkg,
  showSignature = true,
}: TypeReferenceProps) {
  // Find the type in the metadata
  let typeMeta: TypeMeta | undefined
  let packageName: string | undefined

  if (pkg) {
    typeMeta = typesData[pkg]?.types?.[name]
    packageName = pkg
  } else {
    // Search all packages
    for (const [pkgName, pkgData] of Object.entries(typesData)) {
      if (pkgData.types[name]) {
        typeMeta = pkgData.types[name]
        packageName = pkgName
        break
      }
    }
  }

  if (!typeMeta) {
    return (
      <div className="my-6 p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <p className="text-sm text-destructive">
          Type <code className="font-mono font-semibold">{name}</code> not found
          {pkg ? ` in package ${pkg}` : ' in any package'}
        </p>
      </div>
    )
  }

  return (
    <div className="my-6 space-y-4">
      {/* Type Header */}
      <div className="flex items-baseline gap-2">
        <h3
          className="text-lg font-semibold font-mono"
          id={`${packageName}.${name}`}
        >
          {name}
        </h3>
        {packageName && (
          <span className="text-sm text-muted-foreground">{packageName}</span>
        )}
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
          {typeMeta.kind}
        </span>
      </div>

      {/* Documentation */}
      {typeMeta.doc && (
        <p className="text-sm text-muted-foreground">{typeMeta.doc}</p>
      )}

      {/* Type Signature */}
      {showSignature && (
        <div className="p-3 bg-muted/50 rounded-md font-mono text-sm overflow-x-auto">
          <code>
            {typeMeta.kind} {name}
            {typeMeta.typeParams && (
              <>
                {'<'}
                {typeMeta.typeParams
                  .map((tp) => {
                    let param = tp.name
                    if (tp.constraint) param += ` extends ${tp.constraint}`
                    if (tp.default) param += ` = ${tp.default}`
                    return param
                  })
                  .join(', ')}
                {'>'}
              </>
            )}
            {typeMeta.definition && ` = ${typeMeta.definition}`}
          </code>
        </div>
      )}

      {/* Properties Table */}
      {typeMeta.props && typeMeta.props.length > 0 && (
        <div className="border border-border rounded-md overflow-hidden">
          <Table className="w-full text-sm table-fixed">
            <TableHeader className="bg-neutral-100 dark:bg-neutral-900">
              <TableRow>
                <TableHead className="w-[35%] font-mono">Property</TableHead>
                <TableHead className="w-[30%] font-mono">Type</TableHead>
                <TableHead className="w-[35%] font-mono">Default</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white dark:bg-black">
              {typeMeta.props.map((prop) => (
                <ExpandablePropRow key={prop.name} prop={prop} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
