import * as React from 'react'

/**
 * Chain of segments for the surface currently displaying rows — the enclosing submenu path at this render position (`node.id ?? slugify(node.value)` per submenu), outermost first. Root is `[]`; empty segments are skipped. Contextual by nature: the same row sees different values depending on where it is displayed (its home surface while browsing vs. an ancestor surface during deep search). See `GetQualifiedRowIdContext.defPath` for the render-independent path.
 */
export const DisplayPathContext = React.createContext<string[]>([])

export function useDisplayPath(): string[] {
  return React.useContext(DisplayPathContext)
}

export function ExtendDisplayPath({
  segment,
  children,
}: {
  segment: string
  children: React.ReactNode
}) {
  const parent = useDisplayPath()
  const path = React.useMemo(
    () => (segment ? [...parent, segment] : parent),
    [parent, segment],
  )

  return (
    <DisplayPathContext.Provider value={path}>
      {children}
    </DisplayPathContext.Provider>
  )
}
