import { highlight } from '@/lib/highlighter'
import { getLanguageFromPath, transformRegistryPaths } from '@/lib/registry'
import {
  getRegistryEntryPrimarySource,
  getRegistryEntrySources,
} from '@/lib/registry.server'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export interface ComponentSourceProps {
  /**
   * The name of the registry item to show source for
   */
  name: string
  /**
   * Whether to show all files or just the primary file
   * @default false
   */
  showAllFiles?: boolean
  /**
   * Additional class names for the source container
   */
  className?: string
  /**
   * Whether to transform registry paths for display
   * @default true
   */
  transformPaths?: boolean
}

/**
 * ComponentSource displays syntax-highlighted source code for a registry component.
 * Can show either just the primary file or all files in a tabbed interface.
 */
export async function ComponentSource({
  name,
  showAllFiles = false,
  className,
  transformPaths = true,
}: ComponentSourceProps) {
  if (showAllFiles) {
    return (
      <ComponentSourceAllFiles
        name={name}
        className={className}
        transformPaths={transformPaths}
      />
    )
  }

  return (
    <ComponentSourcePrimary
      name={name}
      className={className}
      transformPaths={transformPaths}
    />
  )
}

async function ComponentSourcePrimary({
  name,
  className,
  transformPaths,
}: {
  name: string
  className?: string
  transformPaths: boolean
}) {
  const source = await getRegistryEntryPrimarySource(name)

  if (!source) {
    return (
      <div
        className={cn(
          'flex min-h-[100px] items-center justify-center rounded-lg border border-dashed p-4',
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">
          Source not found for "{name}".
        </p>
      </div>
    )
  }

  const content = transformPaths
    ? transformRegistryPaths(source.content)
    : source.content
  const lang = getLanguageFromPath(source.path)
  const highlighted = await highlight(content, lang)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-muted/50',
        className,
      )}
    >
      <div className="overflow-x-auto p-4">
        <div className="[&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:text-sm">
          {highlighted}
        </div>
      </div>
    </div>
  )
}

async function ComponentSourceAllFiles({
  name,
  className,
  transformPaths,
}: {
  name: string
  className?: string
  transformPaths: boolean
}) {
  const sources = await getRegistryEntrySources(name)

  if (sources.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-[100px] items-center justify-center rounded-lg border border-dashed p-4',
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">
          No source files found for "{name}".
        </p>
      </div>
    )
  }

  // If only one file, don't show tabs
  if (sources.length === 1) {
    const source = sources[0]!
    const content = transformPaths
      ? transformRegistryPaths(source.content)
      : source.content
    const lang = getLanguageFromPath(source.path)
    const highlighted = await highlight(content, lang)

    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border bg-muted/50',
          className,
        )}
      >
        <div className="border-b bg-muted px-4 py-2">
          <span className="font-mono text-xs text-muted-foreground">
            {getFileName(source.path)}
          </span>
        </div>
        <div className="overflow-x-auto p-4">
          <div className="[&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:text-sm">
            {highlighted}
          </div>
        </div>
      </div>
    )
  }

  // Multiple files - show tabs
  const highlightedSources = await Promise.all(
    sources.map(async (source) => {
      const content = transformPaths
        ? transformRegistryPaths(source.content)
        : source.content
      const lang = getLanguageFromPath(source.path)
      const highlighted = await highlight(content, lang)
      return { ...source, highlighted }
    }),
  )

  const firstFileName = getFileName(highlightedSources[0]!.path)

  return (
    <div
      className={cn('relative overflow-hidden rounded-lg border', className)}
    >
      <Tabs defaultValue={firstFileName} className="w-full">
        <div className="border-b bg-muted px-2">
          <TabsList className="h-auto bg-transparent p-0">
            {highlightedSources.map((source) => {
              const fileName = getFileName(source.path)
              return (
                <TabsTrigger
                  key={source.path}
                  value={fileName}
                  className="rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  {fileName}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>
        {highlightedSources.map((source) => {
          const fileName = getFileName(source.path)
          return (
            <TabsContent
              key={source.path}
              value={fileName}
              className="m-0 mt-0"
            >
              <div className="overflow-x-auto p-4">
                <div className="[&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:text-sm">
                  {source.highlighted}
                </div>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

function getFileName(filePath: string): string {
  const parts = filePath.split('/')
  return parts[parts.length - 1] ?? filePath
}
