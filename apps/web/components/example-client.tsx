'use client'

import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button'
import { CheckIcon, ClipboardIcon } from 'lucide-react'
import {
  Children,
  isValidElement,
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getRegistryComponent, type RegistryTier } from '@/lib/registry'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export interface ExampleClientProps {
  /**
   * The name of the registry item to preview
   */
  name: string
  /**
   * Docs tier to resolve the example against (falls back to the other tier)
   */
  tier?: RegistryTier
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
   * File names for the tabs
   */
  fileNames: string[]
  /**
   * Raw content for copy functionality
   */
  contents: string[]
  /**
   * Server-rendered code blocks (ExampleCodeContent elements)
   */
  children: ReactNode
  /**
   * Optional compound component children (PreviewCode, PreviewComponent)
   * These are parsed to extract previewCode and previewComponent
   */
  compoundChildren?: ReactNode
}

interface ExampleCodeContentProps {
  fileName: string
  children: ReactNode
}

/**
 * Wrapper component for highlighted code content.
 * This is used to pass server-rendered highlighted code to the client.
 */
export function ExampleCodeContent({ children }: ExampleCodeContentProps) {
  return (
    <div className="overflow-x-auto bg-background">
      <div className="[&_code]:!font-mono [&_code]:text-sm py-4 [&_span.line]:px-4">
        {children}
      </div>
    </div>
  )
}

interface ExamplePreviewCodeContentProps {
  children: ReactNode
}

/**
 * Wrapper component for highlighted preview code content.
 * This is used to pass server-rendered highlighted preview code to the client.
 * Strips margins/borders from MDX code blocks when used inside Example.
 */
function ExamplePreviewCodeContentInner({
  children,
}: ExamplePreviewCodeContentProps) {
  return (
    <div className="overflow-x-auto bg-background [&_figure]:!my-0 [&_figure]:!mb-0 [&_figure]:!rounded-none [&_figure]:!border-0 [&_figure]:!shadow-none">
      {children}
    </div>
  )
}

ExamplePreviewCodeContentInner.displayName = 'ExamplePreviewCodeContent'

export const ExamplePreviewCodeContent = ExamplePreviewCodeContentInner

interface ExamplePreviewComponentContentProps {
  children?: ReactNode
  className?: string
}

/**
 * Wrapper component for custom preview component styling.
 * Allows customizing the preview area container.
 * Children are optional - this is mainly used to pass className.
 */
function ExamplePreviewComponentContentInner({
  children,
  className,
}: ExamplePreviewComponentContentProps) {
  return <div className={className}>{children}</div>
}

ExamplePreviewComponentContentInner.displayName =
  'ExamplePreviewComponentContent'

export const ExamplePreviewComponentContent =
  ExamplePreviewComponentContentInner

export function ExampleClient({
  name,
  tier,
  className,
  align = 'center',
  fileNames,
  contents,
  children,
  compoundChildren,
}: ExampleClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isStuck, setIsStuck] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const Component = useMemo(
    () => getRegistryComponent(name, tier),
    [name, tier],
  )

  // Parse compound children to extract previewCode and previewComponent
  const { previewCode, previewComponent } = useMemo(() => {
    let previewCode: ReactNode = null
    let previewComponent: ReactNode = null

    Children.forEach(compoundChildren, (child) => {
      if (!isValidElement(child)) return

      // Check for data-example-slot attribute on wrapper divs
      const props = child.props as { 'data-example-slot'?: string }
      const slot = props['data-example-slot']

      if (slot === 'preview-code') {
        previewCode = child
      } else if (slot === 'preview-component') {
        previewComponent = child
      }
    })

    return { previewCode, previewComponent }
  }, [compoundChildren])

  // Detect when button becomes sticky using IntersectionObserver
  useEffect(() => {
    if (!isOpen) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not visible, button is stuck
        setIsStuck(!entry?.isIntersecting)
      },
      { threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isOpen])

  // Convert children to array for indexing
  const codeBlocks = Children.toArray(children)
  const hasPreviewCode = !!previewCode

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

  const firstFileName = fileNames[0] ?? 'index.tsx'
  const hasMultipleFiles = fileNames.length > 1

  return (
    <div className={cn('my-6', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Preview area */}
        <PreviewArea align={align} previewComponent={previewComponent}>
          <Suspense fallback={<ExampleSkeleton />}>
            <Component />
          </Suspense>
        </PreviewArea>

        {/* Preview code section - shown when collapsed and previewCode is provided */}
        {!isOpen && hasPreviewCode && (
          <div className="rounded-b-lg border border-t">
            {previewCode}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 border-t bg-muted/50 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Show full code
              </button>
            </CollapsibleTrigger>
          </div>
        )}

        {/* Toggle button - shown at top when collapsed and NO preview code */}
        {!isOpen && !hasPreviewCode && (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-b-lg border border-t-0 bg-muted/50 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Show code
            </button>
          </CollapsibleTrigger>
        )}

        {/* Collapsible code section */}
        <CollapsibleContent>
          <div className="border-x border-t-0">
            {hasMultipleFiles ? (
              <Tabs defaultValue={firstFileName} className="w-full">
                <div className="flex items-center justify-between border-b bg-muted/50 px-2">
                  <TabsList className="h-auto bg-transparent p-0">
                    {fileNames.map((fileName) => (
                      <TabsTrigger
                        key={fileName}
                        value={fileName}
                        className="rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
                      >
                        {fileName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <CopyButton content={contents[0] ?? ''} />
                </div>
                {fileNames.map((fileName, index) => (
                  <TabsContent
                    key={fileName}
                    value={fileName}
                    className="m-0 mt-0"
                  >
                    {codeBlocks[index]}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <>
                <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {firstFileName}
                  </span>
                  <CopyButton content={contents[0] ?? ''} />
                </div>
                {codeBlocks[0]}
              </>
            )}
          </div>
          {/* Sentinel element to detect when button becomes sticky */}
          <div ref={sentinelRef} className="h-0" />
          {/* Sticky hide code button - outside the border container so it can be sticky */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                'sticky bottom-0 z-10 flex w-full items-center justify-center gap-2 border-x border-b bg-background/95 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground backdrop-blur-sm supports-[backdrop-filter]:bg-background/80',
                isStuck ? 'rounded-none border-t' : 'rounded-b-lg',
              )}
            >
              {hasPreviewCode ? 'Collapse code' : 'Hide code'}
            </button>
          </CollapsibleTrigger>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function CopyButton({ content }: { content: string }) {
  const [checked, onClick] = useCopyButton(() => {
    void navigator.clipboard.writeText(content)
  })

  return (
    <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={checked ? 'Copied' : 'Copy code'}
      onClick={onClick}
    >
      {checked ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <ClipboardIcon className="h-4 w-4" />
      )}
    </button>
  )
}

function ExampleSkeleton() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

interface PreviewAreaProps {
  align: 'start' | 'center' | 'end'
  previewComponent: ReactNode
  children: ReactNode
}

/**
 * Preview area that renders the component.
 * If previewComponent is provided, uses its own base styles + custom className.
 * Otherwise uses default styles.
 */
function PreviewArea({ align, previewComponent, children }: PreviewAreaProps) {
  // Extract className from previewComponent's data-class-name attribute
  const customClassName = useMemo(() => {
    if (!previewComponent || !isValidElement(previewComponent)) return undefined
    const props = previewComponent.props as { 'data-class-name'?: string }
    return props['data-class-name']
  }, [previewComponent])

  const hasPreviewComponent = !!previewComponent

  // PreviewComponent has its own base styles, custom className extends/overrides
  if (hasPreviewComponent) {
    return (
      <div
        className={cn(
          'w-full py-2 rounded-t-lg border border-b-0',
          customClassName,
        )}
      >
        {children}
      </div>
    )
  }

  // Default preview area styles
  return (
    <div
      className={cn(
        'flex min-h-[200px] w-full items-center justify-center rounded-t-lg border border-b-0 p-8',
        {
          'justify-start': align === 'start',
          'justify-center': align === 'center',
          'justify-end': align === 'end',
        },
      )}
    >
      {children}
    </div>
  )
}
