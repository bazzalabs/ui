import { rewritePath } from 'fumadocs-core/negotiation'
import { type NextRequest, NextResponse } from 'next/server'

const { rewrite: rewriteLLM } = rewritePath(
  '/docs{/*path}.mdx',
  'llms.mdx/docs{/*path}',
)

export function middleware(request: NextRequest) {
  const path = rewriteLLM(request.nextUrl.pathname)

  if (path) {
    return NextResponse.rewrite(new URL(path, request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Only run on docs paths ending with .mdx
  matcher: '/docs/:path*.mdx',
}
