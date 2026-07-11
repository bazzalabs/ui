'use client'

import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export interface ViewMarkdownProps {
  /** URL to the raw markdown content (e.g., `/docs/intro.mdx`) */
  markdownUrl: string
  /** Optional GitHub URL to view/edit the source file */
  githubUrl?: string
}

/**
 * Displays buttons to view raw markdown and copy content.
 * Useful for AI agents and LLM integrations.
 */
export function ViewMarkdown({
  markdownUrl,
  githubUrl: _githubUrl,
}: ViewMarkdownProps) {
  const [_copied, _onCopy] = useCopyButton(async () => {
    const res = await fetch(markdownUrl)
    const text = await res.text()
    await navigator.clipboard.writeText(text)
  })

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={markdownUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'h-7 text-xs text-muted-foreground hover:text-foreground',
        )}
        aria-label="View as markdown"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Markdown</title>
          <path
            d="M22.269 19.385H1.731a1.73 1.73 0 0 1-1.73-1.73V6.345a1.73 1.73 0 0 1 1.73-1.73h20.538a1.73 1.73 0 0 1 1.73 1.73v11.308a1.73 1.73 0 0 1-1.73 1.731zm-16.5-3.462v-4.5l2.308 2.885 2.307-2.885v4.5h2.308V8.078h-2.308l-2.307 2.885-2.308-2.885H3.461v7.847zM21.231 12h-2.308V8.077h-2.307V12h-2.308l3.461 4.039z"
            fill="currentColor"
          ></path>
        </svg>
        View as Markdown
      </a>
      {/*{githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'h-7 text-xs text-muted-foreground hover:text-foreground',
          )}
          aria-label="Edit on GitHub"
        >
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      )}*/}
    </div>
  )
}
