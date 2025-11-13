// @ts-nocheck
import { loader } from 'fumadocs-core/source'
import { changelog, docs } from '@/.source'

export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
})

export const changelogSource = loader({
  baseUrl: '/changelog',
  source: changelog.toFumadocsSource(),
})
