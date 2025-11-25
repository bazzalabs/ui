'use client'

// Import the generated types metadata
import typesMeta from '@/.types/types-meta.json'

import type { MetaOutput } from '@/scripts/build-types-meta'
import { Markdown } from './markdown'

const typesData = typesMeta as MetaOutput

interface TypeSignatureProps {
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
   * Whether to show the package name
   */
  showPackage?: boolean
}

/**
 * Displays the TypeScript signature of a type from the generated metadata
 */
export function TypeSignature({
  name,
  pkg,
  showPackage = false,
}: TypeSignatureProps) {
  // Find the type in the metadata
  let typeMeta: any
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
      <div className="my-4 p-3 border border-destructive/50 rounded-md bg-destructive/10">
        <p className="text-sm text-destructive font-mono">
          Type <code className="font-semibold">{name}</code> not found
          {pkg ? ` in package ${pkg}` : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="my-4 space-y-2">
      {showPackage && packageName && (
        <div className="text-xs text-muted-foreground">{packageName}</div>
      )}
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
      {/*{typeMeta.doc && <Markdown>{typeMeta.doc}</Markdown>}*/}
    </div>
  )
}
