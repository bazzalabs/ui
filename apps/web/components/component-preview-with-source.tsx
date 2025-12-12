'use client'

import { Suspense, useMemo } from 'react'
import { getRegistryComponent } from '@/lib/registry'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export interface ComponentPreviewWithSourceProps {
  /**
   * The name of the registry item to preview
   */
  name: string
  /**
   * Optional description to show above the preview
   */
  description?: string
  /**
   * Additional class names for the container
   */
  className?: string
  /**
   * Alignment of the component within the preview area
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end'
  /**
   * The pre-rendered source code (passed from server component)
   */
  sourceCode?: React.ReactNode
  /**
   * The default tab to show
   * @default 'preview'
   */
  defaultTab?: 'preview' | 'code'
}

/**
 * ComponentPreviewWithSource shows a tabbed interface with Preview and Code tabs.
 * The preview shows the live component, and the code tab shows syntax-highlighted source.
 */
export function ComponentPreviewWithSource({
  name,
  description,
  className,
  align = 'center',
  sourceCode,
  defaultTab = 'preview',
}: ComponentPreviewWithSourceProps) {
  const Component = useMemo(() => getRegistryComponent(name), [name])

  if (!Component) {
    return (
      <div
        className={cn(
          'flex min-h-[350px] w-full items-center justify-center rounded-lg border border-dashed p-8',
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">
          Component "{name}" not found in registry.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('group relative', className)}>
      {description && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="preview"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Preview
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Code
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-0 border-none p-0">
          <div
            className={cn(
              'flex min-h-[350px] w-full items-center justify-center rounded-b-lg border border-t-0 p-8',
              {
                'justify-start': align === 'start',
                'justify-center': align === 'center',
                'justify-end': align === 'end',
              },
            )}
          >
            <Suspense fallback={<ComponentPreviewSkeleton />}>
              <Component />
            </Suspense>
          </div>
        </TabsContent>
        <TabsContent value="code" className="mt-0 border-none p-0">
          <div className="overflow-hidden rounded-b-lg border border-t-0 bg-muted/50">
            {sourceCode ? (
              <div className="overflow-x-auto p-4">
                <div className="[&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:text-sm">
                  {sourceCode}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">
                  Source code not available.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ComponentPreviewSkeleton() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
