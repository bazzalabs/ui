import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers'
import type { Element, Root } from 'hast'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { JSX } from 'react'
import { Fragment } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import type { BundledLanguage } from 'shiki/bundle/web'
import { codeToHast } from 'shiki/bundle/web'

export async function highlight(code: string, lang: BundledLanguage) {
  const out = await codeToHast(code, {
    lang,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
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
  const hast = (await codeToHast(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    transformers: [transformerNotationDiff(), transformerNotationHighlight()],
    colorReplacements: {
      '#24292e': 'oklch(0.205 0 0)',
    },
  })) as Root

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
