// @ts-nocheck

import { changelog, docs } from 'fumadocs-mdx:collections/server'
import { loader } from 'fumadocs-core/source'

export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
})

export const changelogSource = loader({
  baseUrl: '/changelog',
  source: changelog.toFumadocsSource(),
})
