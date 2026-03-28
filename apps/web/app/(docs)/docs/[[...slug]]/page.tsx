import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  type DocsAudience,
  getVisibleDocsPage,
  getVisibleDocsParams,
} from '@/lib/source'
import 'rehype-callouts/theme/github'
import { FlaskConicalIcon, TriangleDashedIcon } from 'lucide-react'
import Link from 'next/link'
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
  const page = getVisibleDocsPage(slug)

  if (!page) {
    return {}
  }

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

  // Extract component name from slug
  const componentSlug = slug[0] // 'action-menu' or 'command-menu'
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
    slug.includes('components')
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

const ExperimentalWarning = () => {
  return (
    <div className="border border-purple-400 dark:border-purple-600 rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20 flex items-center gap-4 mb-8">
      <div className="translate-y-[-1px]">
        <FlaskConicalIcon className="text-purple-400 dark:text-purple-600 size-5" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-purple-600 dark:text-purple-400 text-sm font-[450] leading-none">
          This component is experimental.
        </span>
        <p className="text-sm text-primary">
          Documentation may be incomplete and APIs are subject to change.
        </p>
      </div>
    </div>
  )
}

const ArchivedWarning = () => {
  return (
    <div className="border border-orange-400 dark:border-orange-600 rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20 flex items-center gap-4 mb-8">
      <div className="translate-y-[-1px]">
        <TriangleDashedIcon className="text-orange-400 dark:text-orange-600 size-5 stroke-3" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-orange-500 text-sm font-[450] leading-none">
          This component is archived.
        </span>
        <p className="text-sm text-primary">
          These docs are kept for reference. For new work, prefer the current{' '}
          <Link href="/docs/dropdown-menu" className="underline">
            Dropdown Menu
          </Link>{' '}
          and related menu primitives in `@bazza-ui/react`.
        </p>
      </div>
    </div>
  )
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const slug = (await params).slug || []
  const page = getVisibleDocsPage(slug)

  if (!page) {
    notFound()
  }

  const metadata = page.data
  const MDX = page.data.body

  const tableOfContents = metadata.toc

  return (
    <div className="w-full grid grid-cols-[auto_auto_auto]">
      <div className="max-w-[calc(calc(100svw/3)-300px)] w-full" />
      <div className="col-span-1 px-4 flex flex-col gap-8 w-full max-w-screen-md mx-auto my-4 md:my-8 xl:my-16">
        <SidebarTrigger className="md:hidden fixed top-6 left-6 z-50 bg-secondary drop-shadow-md" />

        <div className="flex flex-col gap-4 mb-8 mt-8 w-full">
          {slug.includes('menu') && !slug.includes('action-menu') && (
            <ExperimentalWarning />
          )}
          {slug.includes('action-menu') && <ArchivedWarning />}
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
        </div>
        <div className="mb-32 flex-1 w-full">
          <MDX components={useMDXComponents()} />
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
  return getVisibleDocsParams()
}

export const dynamicParams = false
