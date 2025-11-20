export const dynamic = 'force-static'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { docsSource } from '@/lib/source'
import 'rehype-callouts/theme/github'
import { ChevronRightIcon } from 'lucide-react'
import { InlineTOC } from '@/components/inline-toc'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useMDXComponents } from '@/mdx-components'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const slug = (await params).slug || []
  const page = docsSource.getPage(slug)

  if (!page) {
    return {}
  }

  const metadata = page.data as {
    title: string
    summary: string
    section: string
    badge?: 'alpha' | 'beta'
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
  const pageTitle = componentName
    ? `${metadata.title} / ${componentName}`
    : metadata.title

  return {
    title: pageTitle,
    description: metadata.summary,
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
  const page = docsSource.getPage(slug)

  if (!page) {
    notFound()
  }

  const metadata = page.data
  const MDX = page.data.body

  const tableOfContents = metadata.toc

  return (
    <div
      className={cn(
        // 'grid grid-cols-[calc(calc(100svw/3*2)-300px)_auto]',
        'w-full', // 'grid grid-cols-[calc(calc(100svw/3*2)-300px)_min(calc(100svw/3),300px)]',
        'grid grid-cols-[auto_auto_auto]',
      )}
    >
      <div className="max-w-[calc(calc(100svw/3)-300px)] w-full" />
      <div className="col-span-1 px-4 flex flex-col gap-8 w-full max-w-screen-md mx-auto my-4 md:my-8 xl:my-16">
        <SidebarTrigger className="md:hidden fixed top-4 left-6 z-50 bg-secondary drop-shadow-md" />

        <div className="flex flex-col gap-4 mb-8 mt-8 w-full">
          <div className="flex items-start gap-2">
            <span className="text-5xl font-[550] tracking-[-0.025em]">
              {metadata.title}
            </span>
            {metadata.badge === 'alpha' && (
              <Badge className="bg-pink-400 dark:bg-pink-500 text-white leading-none h-5 [&>span]:translate-y-[-0.5px]">
                <span>{metadata.badge}</span>
              </Badge>
            )}
            {metadata.badge === 'beta' && (
              <Badge className="bg-purple-500 dark:bg-purple-600 text-white leading-none h-5 [&>span]:translate-y-[-0.5px]">
                <span>{metadata.badge}</span>
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground">{metadata.summary}</div>
        </div>
        <div className="mb-32 flex-1 w-full">
          <MDX components={useMDXComponents()} />
        </div>
      </div>
      <div className="col-span-1 hidden xl:block">
        <div className="sticky top-0 h-fit pt-4">
          <InlineTOC items={tableOfContents} />
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  return docsSource.getPages().map((page) => ({
    slug: page.slugs,
  }))
}

export const dynamicParams = false
