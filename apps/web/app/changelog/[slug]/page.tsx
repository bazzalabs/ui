export const dynamic = 'force-static'

import 'rehype-callouts/theme/github'
import { format, parse } from 'date-fns'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { changelogSource } from '@/lib/source'
import { useMDXComponents } from '@/mdx-components'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = (await params).slug
  const page = changelogSource.getPage([slug])

  if (!page) {
    return {}
  }

  const metadata = page.data as {
    title: string
    summary?: string
    publishedAt: string
    ogImageUrl?: string
    slug?: string
    body: React.ComponentType
  }

  return {
    title: metadata.title,
    description: metadata.summary,
    openGraph: {
      title: `${metadata.title} — Changelog`,
      description: metadata.summary,
      type: 'article',
      url: `https://ui.bazza.dev/changelog/${slug}`,
      images: [
        {
          url: metadata.ogImageUrl || '/changelog/og.png',
        },
      ],
    },
    twitter: {
      title: `${metadata.title} — Changelog`,
      description: metadata.summary,
      creator: '@kianbazza',
      card: 'summary_large_image',
      images: [
        {
          url: metadata.ogImageUrl || '/changelog/og.png',
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
  const page = changelogSource.getPage([slug])

  if (!page) {
    notFound()
  }

  const metadata = page.data as {
    title: string
    summary?: string
    publishedAt: string
    ogImageUrl?: string
    slug?: string
    body: React.ComponentType
  }
  const MDX = page.data.body

  const date = metadata.publishedAt as unknown as Date
  const formattedDate = format(date, 'iiii, MMMM do, yyyy')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_4fr_1fr] gap-4 max-w-screen-xl w-full mx-auto border-x border-border border-dashed">
      <div className="-mb-8 mt-12 lg:ml-4 px-4 lg:px-0 col-span-1 h-fit lg:w-fit w-full max-w-screen-md mx-auto">
        {/* <Link
          href="/changelog"
          className="inline-flex items-center gap-1 text-sm group lg:sticky lg:top-20"
        >
          <ChevronLeftIcon className="size-3.5 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform duration-150" />
          <span className="font-mono text-muted-foreground group-hover:text-primary transition-colors duration-150 font-[450]">
            CHANGELOG.md
          </span>
        </Link> */}
      </div>
      <div className="max-w-[50rem] w-full mx-auto border-border/0 border-dashed xl:border-x">
        <div className="border-b border-border/0 border-dashed">
          <div className="px-4 py-12 max-w-screen-md w-full mx-auto border-border/0 border-dashed xl:border-x flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              <span className="font-mono text-muted-foreground tracking-[-0.01em]">
                {formattedDate}
              </span>
              <span className="text-4xl sm:text-5xl font-[550] tracking-[-0.02em] sm:tracking-[-0.025em]">
                {metadata.title}
              </span>
              <Link
                href="https://x.com/kianbazza"
                className="flex items-center gap-2 group *:transition-all *:duration-150 w-fit"
              >
                <Avatar className="group-hover:brightness-115">
                  <AvatarImage src="/bazza.png" />
                  <AvatarFallback>KB</AvatarFallback>
                </Avatar>
                <span className="font-mono text-muted-foreground group-hover:text-primary font-[450] tracking-[-0.01em] translate-y-0.5 text-sm">
                  Kian Bazza
                </span>
              </Link>
            </div>
            <article className="!select-text">
              <MDX components={useMDXComponents()} />
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  return changelogSource.getPages().map((page) => ({
    slug: page.slugs[0],
  }))
}

export const dynamicParams = false
