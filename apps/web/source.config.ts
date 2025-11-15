// @ts-nocheck
import { transformerNotationHighlight } from '@shikijs/transformers'
import { type RehypeCodeOptions, rehypeCode } from 'fumadocs-core/mdx-plugins'
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from 'fumadocs-mdx/config'
import rehypeCallouts from 'rehype-callouts'
import z from 'zod'
import { oscuraMidnight } from './lib/oscura/oscura-midnight'
// import { oscuraSunrise } from './lib/oscura/oscura-sunrise'

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema.extend({
      summary: z.string(),
      section: z.string().optional(),
      badge: z.enum(['alpha', 'beta']).optional(),
      image: z.string().optional(),
    }),
  },
})

export const changelog = defineDocs({
  dir: 'content/changelog',
  docs: {
    schema: frontmatterSchema.extend({
      publishedAt: z.coerce.string().transform((str) => String(str)),
      ogImageUrl: z.string().optional(),
      slug: z.string().optional(),
      summary: z.string().optional(),
    }),
  },
})

const rehypeCodeOptions: RehypeCodeOptions = {
  themes: {
    light: 'github-light',
    dark: oscuraMidnight,
    // light: 'github-light',
    // dark: 'github-dark',
  },
  transformers: [transformerNotationHighlight()],
}

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (v) => [
      ...v,
      rehypeCallouts,
      [rehypeCode, rehypeCodeOptions],
    ],
  },
})
