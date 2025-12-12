// @ts-nocheck
import { transformerNotationHighlight } from '@shikijs/transformers'
import {
  type RehypeCodeOptions,
  type RemarkNpmOptions,
  rehypeCode,
  remarkNpm,
} from 'fumadocs-core/mdx-plugins'
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from 'fumadocs-mdx/config'
import rehypeCallouts from 'rehype-callouts'
import z from 'zod/v4'
import { env } from './lib/env'
import { oscuraMidnight } from './lib/oscura/oscura-midnight'
import { remarkCodeInject } from './lib/remark-code-inject'

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema.extend({
      component: z.string().optional(),
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
    // dark: 'github-dark',
  },
  transformers: [transformerNotationHighlight()],
}

const remarkNpmOptions: RemarkNpmOptions = {
  persist: true,
}

const codeInjectVariables = {
  REGISTRY_URL: env.NEXT_PUBLIC_APP_URL,
  RELEASE_CHANNEL:
    env.NEXT_PUBLIC_RELEASE_TYPE !== 'stable'
      ? `@${env.NEXT_PUBLIC_RELEASE_TYPE}`
      : '',
}

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (v) => [
      ...v,
      rehypeCallouts,
      [rehypeCode, rehypeCodeOptions],
    ],
    remarkPlugins: (v) => [
      ...v,
      [remarkCodeInject, { variables: codeInjectVariables }],
      [remarkNpm, remarkNpmOptions],
    ],
  },
})
