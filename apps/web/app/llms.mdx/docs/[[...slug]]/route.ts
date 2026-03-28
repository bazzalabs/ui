import { notFound } from 'next/navigation'
import { getVisibleDocsPage, getVisibleDocsParams } from '@/lib/source'

export const revalidate = false

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params
  const page = getVisibleDocsPage(slug ?? [])
  if (!page) notFound()

  // Get the raw MDX content using fumadocs getText API
  const content = await page.data.getText('raw')

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}

export function generateStaticParams() {
  return getVisibleDocsParams()
}
