// @ts-nocheck

import { changelog, docs } from 'fumadocs-mdx:collections/server'
import { loader } from 'fumadocs-core/source'
import { env } from './env'

export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
})

export const changelogSource = loader({
  baseUrl: '/changelog',
  source: changelog.toFumadocsSource(),
})

export type DocsAudience = 'public' | 'preview' | 'private'

function getDocsAudience(page: { data?: { audience?: DocsAudience } }) {
  return page.data?.audience ?? 'public'
}

export function shouldShowPrivateDocs() {
  return (
    env.SHOW_PRIVATE_PAGES === 'true' ||
    process.env.NODE_ENV !== 'production' ||
    process.env.VERCEL_ENV === 'preview'
  )
}

function isVisibleDocsPage(page: { data?: { audience?: DocsAudience } }) {
  return shouldShowPrivateDocs() || getDocsAudience(page) !== 'private'
}

export function getVisibleDocsPage(slug: string[]) {
  const page = docsSource.getPage(slug)

  if (!page || !isVisibleDocsPage(page)) {
    return undefined
  }

  return page
}

export function getVisibleDocsPages() {
  return docsSource.getPages().filter(isVisibleDocsPage)
}

export function getVisibleDocsParams() {
  return getVisibleDocsPages().map((page) => ({
    slug: page.slugs,
  }))
}

export function getVisibleDocsUrls() {
  return getVisibleDocsPages().map((page) => page.url)
}

export function getVisiblePrivateDocsUrls() {
  return getVisibleDocsPages()
    .filter((page) => getDocsAudience(page) === 'private')
    .map((page) => page.url)
}
