// source.config.ts
import { transformerNotationHighlight } from '@shikijs/transformers'
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from 'fumadocs-mdx/config'
import z from 'zod'

var docs = defineDocs({
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
var changelog = defineDocs({
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
var source_config_default = defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [transformerNotationHighlight()],
    },
  },
})
export { changelog, source_config_default as default, docs }
