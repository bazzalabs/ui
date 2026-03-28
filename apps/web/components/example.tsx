import type { ReactNode } from 'react'
import { transformRegistryPaths } from '@/lib/registry'
import { getRegistryEntrySources } from '@/lib/registry.server'
import {
  ExampleClient,
  ExampleCodeContent,
  ExamplePreviewCodeContent,
} from './example-client'

export interface ExampleProps {
  /**
   * The name of the registry item to preview
   */
  name: string
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
   * Whether to transform registry paths for display
   * @default true
   */
  transformPaths?: boolean
  /**
   * Children can include Example.PreviewCode for a collapsible preview snippet
   */
  children?: ReactNode
}

/**
 * Example shows a live component preview with collapsible source code.
 * Similar to Base UI's demo component - preview on top, "Show code" toggle below.
 *
 * Supports an optional preview code snippet via children:
 * ```mdx
 * <Example name="dropdown-menu-basic">
 *   <Example.PreviewCode>
 *     {`const items = ['Edit', 'Delete']`}
 *   </Example.PreviewCode>
 * </Example>
 * ```
 */
async function ExampleRoot({
  name,
  className,
  align = 'center',
  transformPaths = true,
  children,
}: ExampleProps) {
  // Fetch and highlight all source files
  const sources = await getRegistryEntrySources(name)

  const processedSources = sources.map((source) => {
    const content = transformPaths
      ? transformRegistryPaths(source.content)
      : source.content
    const fileName = getFileName(source.path)
    return {
      path: source.path,
      fileName,
      content,
      highlighted: (
        <pre>
          <code>{content}</code>
        </pre>
      ),
    }
  })

  const fileNames = processedSources.map((s) => s.fileName)
  const contents = processedSources.map((s) => s.content)

  return (
    <ExampleClient
      name={name}
      className={className}
      align={align}
      fileNames={fileNames}
      contents={contents}
      compoundChildren={children}
    >
      {processedSources.map((source) => (
        <ExampleCodeContent key={source.path} fileName={source.fileName}>
          {source.highlighted}
        </ExampleCodeContent>
      ))}
    </ExampleClient>
  )
}

function getFileName(filePath: string): string {
  const parts = filePath.split('/')
  return parts[parts.length - 1] ?? filePath
}

export interface ExamplePreviewCodeProps {
  /**
   * Children can be:
   * 1. A fenced code block (rendered as <pre> by MDX) - just wrap it
   * 2. A string template literal - will be highlighted
   */
  children: ReactNode
  /**
   * Language for syntax highlighting (only used when children is a string)
   * @default 'tsx'
   */
  lang?: 'typescript' | 'javascript' | 'tsx' | 'jsx' | 'json' | 'bash' | 'sh'
}

/**
 * Component that wraps a preview code snippet.
 * Used as a child of Example to show a simplified code view when collapsed.
 *
 * Usage with fenced code block (recommended):
 * ```mdx
 * <Example name="my-example">
 *   <Example.PreviewCode>
 *
 *   ```tsx
 *   const foo = 'bar'
 *   ```
 *
 *   </Example.PreviewCode>
 * </Example>
 * ```
 *
 * Usage with template literal:
 * ```mdx
 * <Example name="my-example">
 *   <Example.PreviewCode>
 *     {`const foo = 'bar'`}
 *   </Example.PreviewCode>
 * </Example>
 * ```
 */
function ExamplePreviewCode({
  children,
  lang = 'tsx',
}: ExamplePreviewCodeProps) {
  // If children is a string, render as plain code
  if (typeof children === 'string') {
    const code = children.trim()
    return (
      <div data-example-slot="preview-code">
        <ExamplePreviewCodeContent>
          <pre>
            <code>{code}</code>
          </pre>
        </ExamplePreviewCodeContent>
      </div>
    )
  }

  // Otherwise, assume it's already a rendered code block from MDX
  // Just wrap it in our container
  return (
    <div data-example-slot="preview-code">
      <ExamplePreviewCodeContent>{children}</ExamplePreviewCodeContent>
    </div>
  )
}

export interface ExamplePreviewComponentProps {
  /**
   * Additional class names to apply to the preview container
   */
  className?: string
  /**
   * Children are not rendered - this component is just for passing className
   */
  children?: ReactNode
}

/**
 * Component that allows customizing the preview area styling.
 * The className is extracted and applied to the preview container.
 *
 * Usage:
 * ```mdx
 * <Example name="my-example">
 *   <Example.PreviewComponent className="bg-slate-100 dark:bg-slate-900" />
 * </Example>
 * ```
 */
function ExamplePreviewComponent({ className }: ExamplePreviewComponentProps) {
  return (
    <div data-example-slot="preview-component" data-class-name={className} />
  )
}

// Compound component pattern
export const Example = Object.assign(ExampleRoot, {
  PreviewCode: ExamplePreviewCode,
  PreviewComponent: ExamplePreviewComponent,
})
