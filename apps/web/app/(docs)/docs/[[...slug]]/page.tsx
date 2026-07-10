import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  type DocsAudience,
  getTieredDocsParams,
  resolveDocsRequest,
} from '@/lib/source'
import 'rehype-callouts/theme/github'
import { DocsTierSwitcher } from '@/components/docs-tier-switcher'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ViewMarkdown } from '@/components/view-markdown'
import { useMDXComponents } from '@/mdx-components'
import { InlineTOCContainer } from './inline-toc-container'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const slug = (await params).slug || []
  const resolved = resolveDocsRequest(slug)

  if (!resolved) {
    return {}
  }

  const page = resolved.page

  const metadata = page.data as {
    title: string
    summary: string
    section: string
    badge?: 'alpha' | 'beta'
    audience: DocsAudience
    image?: string
    body: React.ComponentType
    toc: unknown
  }

  const baseSlugs = resolved.tier ? slug.slice(1) : slug

  // Extract component name from slug
  const componentSlug = baseSlugs[0] // e.g. 'dropdown-menu'
  const componentName = componentSlug
    ? componentSlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : ''

  // Build the title with component name
  let pageTitle: string

  if (
    (componentName && metadata.title === componentName) ||
    baseSlugs.includes('components')
  ) {
    pageTitle = metadata.title
  } else if (componentName) {
    pageTitle = `${metadata.title} / ${componentName}`
  } else {
    pageTitle = metadata.title
  }

  return {
    title: pageTitle,
    description: metadata.summary,
    robots:
      metadata.audience === 'private'
        ? {
            index: false,
            follow: false,
          }
        : undefined,
    other: {
      audience: metadata.audience,
    },
    openGraph: {
      title: `${pageTitle} — bazza/ui`,
      description: metadata.summary,
      type: 'article',
      url: `https://ui.bazza.dev/docs/${slug.join('/')}`,
      images: [
        {
          url: `/og?title=${encodeURIComponent(
            metadata.title,
          )}&description=${encodeURIComponent(metadata.summary)}`,
        },
      ],
    },
    twitter: {
      title: `${pageTitle} — bazza/ui`,
      description: metadata.summary,
      creator: '@kianbazza',
      card: 'summary_large_image',
      images: [
        {
          url: `/og?title=${encodeURIComponent(
            metadata.title,
          )}&description=${encodeURIComponent(metadata.summary)}`,
        },
      ],
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const slug = (await params).slug || []
  const resolved = resolveDocsRequest(slug)

  if (!resolved) {
    notFound()
  }

  const page = resolved.page

  const metadata = page.data
  const MDX = page.data.body

  const tableOfContents = metadata.toc

  return (
    <div className="w-full grid grid-cols-[auto_auto_auto]">
      <div className="max-w-[calc(calc(100svw/3)-300px)] w-full" />
      <div className="col-span-1 px-4 flex flex-col gap-8 w-full max-w-screen-md mx-auto my-4 md:my-8 xl:my-16">
        <SidebarTrigger className="md:hidden fixed top-6 left-6 z-50 bg-secondary drop-shadow-md" />

        <div className="flex flex-col gap-4 mb-8 mt-8 w-full">
          <div className="flex items-end justify-between gap-2">
            <span className="text-5xl font-[550] tracking-[-0.025em]">
              {metadata.title}
            </span>
            <ViewMarkdown
              markdownUrl={`${page.url}.mdx`}
              githubUrl={`https://github.com/bazzadev/ui/blob/main/apps/web/content/docs/${page.path}`}
            />
          </div>
          <div className="text-muted-foreground">{metadata.summary}</div>
          {resolved.page.data.tiers ? (
            <DocsTierSwitcher
              tiers={resolved.page.data.tiers}
              activeTier={resolved.tier}
              slugs={resolved.page.slugs}
            />
          ) : null}
        </div>
        <div className="mb-32 flex-1 w-full">
          <MDX components={useMDXComponents(resolved.tier)} />
        </div>
      </div>
      <div className="col-span-1 hidden xl:block">
        <div className="sticky top-8 pt-2">
          <InlineTOCContainer items={tableOfContents} />
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  return getTieredDocsParams()
}

export const dynamicParams = false
