'use client'

import typesMeta from '@/.types/types-meta.json'

export function TypeDebug({ pkg, type }: { pkg: string; type: string }) {
  const data = typesMeta as any

  return (
    <div className="p-4 bg-muted rounded-md font-mono text-xs overflow-auto">
      <div>Package: {pkg}</div>
      <div>Type: {type}</div>
      <div>Package exists: {String(!!data[pkg])}</div>
      <div>
        Types in package: {data[pkg] ? Object.keys(data[pkg].types).length : 0}
      </div>
      <div>Type exists: {String(!!data[pkg]?.types?.[type])}</div>
      {data[pkg]?.types?.[type] && (
        <>
          <div>Has props: {String(!!data[pkg].types[type].props)}</div>
          <div>Props count: {data[pkg].types[type].props?.length ?? 0}</div>
        </>
      )}
      <details className="mt-4">
        <summary>All types in {pkg}</summary>
        <pre className="mt-2">
          {JSON.stringify(Object.keys(data[pkg]?.types ?? {}), null, 2)}
        </pre>
      </details>
    </div>
  )
}
