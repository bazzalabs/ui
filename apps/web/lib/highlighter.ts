import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers'
import type { Element, Root } from 'hast'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { JSX } from 'react'
import { Fragment } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import type { BundledLanguage, Highlighter } from 'shiki'
import { createHighlighter } from 'shiki'

// Singleton highlighter instance
let highlighterInstance: Highlighter | null = null
let highlighterPromise: Promise<Highlighter> | null = null

/**
 * Get or create the singleton highlighter instance
 * This ensures we reuse the same highlighter across the entire app for better performance
 */
async function getHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return highlighterInstance
  }

  // If already initializing, return the existing promise
  if (highlighterPromise) {
    return highlighterPromise
  }

  // Create new highlighter instance
  highlighterPromise = createHighlighter({
    themes: ['github-light', 'github-dark', 'github-light-high-contrast'],
    langs: ['typescript', 'javascript', 'tsx', 'jsx', 'json', 'bash', 'sh'],
  })

  highlighterInstance = await highlighterPromise
  return highlighterInstance
}

export async function highlight(code: string, lang: BundledLanguage) {
  const highlighter = await getHighlighter()
  const out = highlighter.codeToHast(code, {
    lang,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    defaultColor: false,
    transformers: [transformerNotationDiff(), transformerNotationHighlight()],
    colorReplacements: {
      '#24292e': 'oklch(0.205 0 0)',
    },
  })

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
  }) as JSX.Element
}

export async function highlightInline(code: string, lang: BundledLanguage) {
  const highlighter = await getHighlighter()
  const hast = highlighter.codeToHast(code, {
    lang,
    themes: { light: 'github-light-high-contrast', dark: 'github-dark' },
    defaultColor: false,
    transformers: [transformerNotationDiff(), transformerNotationHighlight()],
    colorReplacements: {
      '#24292e': 'oklch(0.205 0 0)',
    },
  }) as Root

  // Expect: <root><pre class="shiki ..."><code class="language-...">[tokens]</code></pre></root>
  const pre = hast.children?.[0] as Element | undefined
  const codeEl =
    pre?.type === 'element'
      ? pre.children?.find(
          (n): n is Element => n.type === 'element' && n.tagName === 'code',
        )
      : undefined

  // Synthesize a standalone <code>…</code> (inline-safe).
  const inlineCode: Element = codeEl ?? {
    type: 'element',
    tagName: 'code',
    properties: { className: ['shiki-inline'] },
    children: [],
  }

  // Add an inline-specific class for styling if you like.
  const className = new Set<string>([
    'shiki-inline',
    ...(Array.isArray(inlineCode.properties?.className)
      ? (inlineCode.properties!.className as string[])
      : []),
  ])
  inlineCode.properties = {
    ...(inlineCode.properties ?? {}),
    className: Array.from(className),
  }

  return toJsxRuntime(inlineCode, { Fragment, jsx, jsxs })
}
