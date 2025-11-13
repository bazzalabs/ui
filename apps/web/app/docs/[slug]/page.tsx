export const dynamic = 'force-static'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DashboardTableOfContents } from '@/components/toc'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { docsSource } from '@/lib/source'
import 'rehype-callouts/theme/github'
import { useMDXComponents } from '@/mdx-components'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = (await params).slug
  const page = docsSource.getPage([slug])

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

  return {
    title: metadata.title,
    description: metadata.summary,
    openGraph: {
      title: `${metadata.title} — bazza/ui`,
      description: metadata.summary,
      type: 'article',
      url: `https://ui.bazza.dev/docs/${slug}`,
      images: [
        {
          url: `/og?title=${encodeURIComponent(
            metadata.title,
          )}&description=${encodeURIComponent(metadata.summary)}`,
        },
      ],
    },
    twitter: {
      title: `${metadata.title} — bazza/ui`,
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
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const page = docsSource.getPage([slug])

  if (!page) {
    notFound()
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
  const MDX = page.data.body
  const toc = metadata.toc as any

  return (
    <div className="flex">
      <div className="flex flex-col gap-8 w-full max-w-screen-md mx-auto col-span-1 my-4 md:my-8 xl:my-16 no-scrollbar">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
        </div>

        <div className="flex flex-col gap-4">
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
        <div>
          <MDX components={useMDXComponents()} />
        </div>
      </div>

      <div className="hidden xl:block w-[240px] sticky mt-16 top-16 mr-8 pb-8 h-[calc(100vh-4rem)] overflow-y-auto">
        {toc && <DashboardTableOfContents toc={toc} />}
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  return docsSource.getPages().map((page) => ({
    slug: page.slugs[0],
  }))
}

export const dynamicParams = false
