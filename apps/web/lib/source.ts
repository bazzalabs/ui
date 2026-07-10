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

export const DOCS_TIERS = ['components', 'primitives'] as const
export type DocsTier = (typeof DOCS_TIERS)[number]

function getDocsTiers(page): DocsTier[] | undefined {
  return page.data?.tiers
}

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

/**
 * Resolves a docs *page route* slug.
 * - `/docs/<tier>/<rest...>` (rest non-empty) → the page at `<rest...>`,
 *   only if that page declares that tier in frontmatter `tiers`.
 * - Any other slug → the page at that slug, only if it does NOT declare
 *   `tiers` (tiered pages are served exclusively at tier-prefixed URLs).
 * The llms.mdx route intentionally does NOT use this — it serves raw slugs.
 */
export function resolveDocsRequest(slug: string[]) {
  const [first, ...rest] = slug
  if (first && rest.length > 0 && DOCS_TIERS.includes(first)) {
    const page = getVisibleDocsPage(rest)
    if (page && getDocsTiers(page)?.includes(first)) {
      return { page, tier: first as DocsTier }
    }
    return undefined
  }
  const page = getVisibleDocsPage(slug)
  if (!page || getDocsTiers(page)) return undefined
  return { page, tier: undefined as DocsTier | undefined }
}

/** Params for the docs *page* route: tiered pages expand to one param per tier, no raw entry. */
export function getTieredDocsParams() {
  return getVisibleDocsPages().flatMap((page) => {
    const tiers = getDocsTiers(page)
    if (tiers?.length)
      return tiers.map((tier) => ({ slug: [tier, ...page.slugs] }))
    return [{ slug: page.slugs }]
  })
}

export function getVisibleDocsUrls() {
  return getVisibleDocsPages().flatMap((page) => {
    const tiers = getDocsTiers(page)
    if (tiers?.length)
      return tiers.map((tier) => `/docs/${tier}/${page.slugs.join('/')}`)
    return [page.url]
  })
}

export function getVisiblePrivateDocsUrls() {
  return getVisibleDocsPages()
    .filter((page) => getDocsAudience(page) === 'private')
    .flatMap((page) => {
      const tiers = getDocsTiers(page)
      if (tiers?.length)
        return tiers.map((tier) => `/docs/${tier}/${page.slugs.join('/')}`)
      return [page.url]
    })
}
