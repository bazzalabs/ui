import { cache, type ReactNode } from 'react'
import { codeToHtml } from 'shiki'
import { oscuraMidnight } from '@/lib/oscura/oscura-midnight'
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

  const processedSources = await Promise.all(
    sources.map(async (source) => {
      const content = transformPaths
        ? transformRegistryPaths(source.content)
        : source.content
      const fileName = getFileName(source.path)

      return {
        path: source.path,
        fileName,
        content,
        highlighted: await getHighlightedCodeNode(
          content,
          getLanguageFromPath(fileName),
        ),
      }
    }),
  )

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
async function ExamplePreviewCode({
  children,
  lang = 'tsx',
}: ExamplePreviewCodeProps) {
  // If children is a string, render as highlighted code
  if (typeof children === 'string') {
    const code = children.trim()
    return (
      <div data-example-slot="preview-code">
        <ExamplePreviewCodeContent>
          {await getHighlightedCodeNode(code, getLanguageFromPreviewCode(lang))}
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

const highlightCode = cache(async (code: string, language: string) => {
  try {
    return await codeToHtml(code, {
      lang: language,
      themes: {
        light: 'github-light',
        dark: oscuraMidnight,
      },
      defaultColor: false,
    })
  } catch {
    return `${escapeHtml(code)}`
  }
})

async function getHighlightedCodeNode(code: string, language: string) {
  const html = await highlightCode(code, language)
  // biome-ignore lint/security/noDangerouslySetInnerHtml: allowed
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function getLanguageFromPath(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'ts':
      return 'ts'
    case 'tsx':
      return 'tsx'
    case 'js':
      return 'js'
    case 'jsx':
      return 'jsx'
    case 'mdx':
      return 'mdx'
    case 'md':
      return 'md'
    case 'json':
      return 'json'
    case 'css':
      return 'css'
    case 'html':
      return 'html'
    case 'sh':
      return 'bash'
    case 'yml':
    case 'yaml':
      return 'yaml'
    default:
      return 'tsx'
  }
}

function getLanguageFromPreviewCode(
  lang: ExamplePreviewCodeProps['lang'],
): string {
  switch (lang) {
    case 'typescript':
      return 'ts'
    case 'javascript':
      return 'js'
    case 'sh':
      return 'bash'
    default:
      return lang ?? 'plain'
  }
}

function escapeHtml(code: string) {
  return code
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// Compound component pattern
export const Example = Object.assign(ExampleRoot, {
  PreviewCode: ExamplePreviewCode,
  PreviewComponent: ExamplePreviewComponent,
})
