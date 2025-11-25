'use client'

// Import the generated types metadata
import typesMeta from '@/.types/types-meta.json'
import { computeTypeDiff } from '@/lib/type-diff'
import type { MetaOutput, PropMeta } from '@/scripts/build-types-meta'

// Import the ExpandablePropRow from type-table-auto
import { ExpandablePropRow } from './type-table-auto'

const typesData = typesMeta as MetaOutput

interface TypeDiffProps {
  /**
   * Base type name (e.g., "BaseItemDef")
   */
  baseType: string
  /**
   * Derived type name (e.g., "MenuItemDef")
   */
  derivedType: string
  /**
   * Package name (if both types are in the same package)
   * Takes precedence over basePackage and derivedPackage if provided
   * Alias: 'package'
   */
  pkg?: string
  /**
   * Alias for pkg
   */
  package?: string
  /**
   * Package name for base type (optional, will search all packages if not provided)
   */
  basePackage?: string
  /**
   * Package name for derived type (optional, will search all packages if not provided)
   */
  derivedPackage?: string
}

/**
 * Component that shows only the properties that are different/new in the derived type
 * compared to the base type. Displays as a regular type table.
 */
export function TypeDiff({
  baseType,
  derivedType,
  pkg,
  package: packageAlias,
  basePackage,
  derivedPackage,
}: TypeDiffProps) {
  // Use pkg/package if provided, otherwise use individual package names
  const packageName = pkg ?? packageAlias
  const finalBasePackage = packageName ?? basePackage
  const finalDerivedPackage = packageName ?? derivedPackage

  // Find the base type in metadata
  let baseTypeMeta: any
  if (finalBasePackage) {
    baseTypeMeta = typesData[finalBasePackage]?.types?.[baseType]
  } else {
    for (const pkgData of Object.values(typesData)) {
      if (pkgData.types[baseType]) {
        baseTypeMeta = pkgData.types[baseType]
        break
      }
    }
  }

  // Find the derived type in metadata
  let derivedTypeMeta: any
  if (finalDerivedPackage) {
    derivedTypeMeta = typesData[finalDerivedPackage]?.types?.[derivedType]
  } else {
    for (const pkgData of Object.values(typesData)) {
      if (pkgData.types[derivedType]) {
        derivedTypeMeta = pkgData.types[derivedType]
        break
      }
    }
  }

  if (!baseTypeMeta || !derivedTypeMeta) {
    return (
      <div className="my-6 p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <p className="text-sm text-destructive">
          {!baseTypeMeta && (
            <>
              Base type{' '}
              <code className="font-mono font-semibold">{baseType}</code> not
              found
              {finalBasePackage ? ` in package ${finalBasePackage}` : ''}
            </>
          )}
          {!derivedTypeMeta && (
            <>
              {!baseTypeMeta && <br />}
              Derived type{' '}
              <code className="font-mono font-semibold">{derivedType}</code> not
              found
              {finalDerivedPackage ? ` in package ${finalDerivedPackage}` : ''}
            </>
          )}
        </p>
      </div>
    )
  }

  const baseProps = baseTypeMeta.props || []
  const derivedProps = derivedTypeMeta.props || []

  const diff = computeTypeDiff(baseProps, derivedProps)

  // Only show added and modified properties, preserving original order from derivedProps
  const differentPropNames = new Set([
    ...diff.added.map((p) => p.name),
    ...diff.modified.map((p) => p.name),
  ])

  const propsToShow = derivedProps.filter((prop) =>
    differentPropNames.has(prop.name),
  )

  if (propsToShow.length === 0) {
    return (
      <div className="my-6 p-4 border border-border rounded-md bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <code className="font-mono font-semibold">{derivedType}</code> has no
          additional or modified properties compared to{' '}
          <code className="font-mono font-semibold">{baseType}</code>
        </p>
      </div>
    )
  }

  // Render using the same grid structure as TypeTableAuto but with filtered props
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
          {propsToShow.map((prop) => (
            <ExpandablePropRow key={prop.name} prop={prop} />
          ))}
        </div>
      </div>
    </div>
  )
}
