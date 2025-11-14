import { type NextRequest, NextResponse } from 'next/server'
import {
  detectEnvironment,
  parseRegistrySlug,
  type RegistryTag,
  readRegistryItem,
  transformRegistryItem,
} from '@/lib/registry-utils'

export const runtime = 'nodejs'

/**
 * GET handler for registry items
 * Supports:
 *   - /r/action-menu
 *   - /r/action-menu.json
 *   - /r/action-menu@canary
 *   - /r/action-menu@canary.json
 *   - /r/action-menu@rc
 *   - /r/action-menu@stable
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  try {
    const { slug } = await params
    const parsed = parseRegistrySlug(slug)
    const currentEnv = detectEnvironment()

    // Determine which tag to use
    let effectiveTag: RegistryTag = currentEnv

    // Handle tag override logic
    if (parsed.tag && parsed.tag !== currentEnv) {
      // Non-stable sites don't support @stable tag
      if (currentEnv !== 'stable' && parsed.tag === 'stable') {
        return NextResponse.json(
          {
            error: `Stable tag is not supported on ${currentEnv} deployment`,
            message: `The ${currentEnv} site only serves ${currentEnv} releases. Please use the production site (bazza-ui.com) for stable releases.`,
          },
          { status: 400 },
        )
      }

      // Stable site: redirect to appropriate deployment for non-stable tags
      if (currentEnv === 'stable') {
        const redirectUrls: Record<Exclude<RegistryTag, 'stable'>, string> = {
          canary: 'https://canary.bazza-ui.com',
          rc: 'https://rc.bazza-ui.com',
        }

        const redirectBaseUrl =
          redirectUrls[parsed.tag as Exclude<RegistryTag, 'stable'>]
        if (redirectBaseUrl) {
          const redirectUrl = `${redirectBaseUrl}/r/${parsed.name}${
            parsed.hasJsonExtension ? '.json' : ''
          }`
          return NextResponse.redirect(redirectUrl, { status: 307 })
        }
      }

      // For cross-environment requests on non-stable sites (e.g., @rc on canary)
      // Return an error since we can't determine the redirect URL
      return NextResponse.json(
        {
          error: 'Cross-environment request not supported',
          message: `Cannot serve @${parsed.tag} releases from ${currentEnv} deployment. Please use the appropriate deployment URL.`,
        },
        { status: 400 },
      )
    }

    // Use the requested tag or default to current environment
    if (parsed.tag) {
      effectiveTag = parsed.tag
    }

    // Read the base registry item
    const item = readRegistryItem(parsed.name)

    if (!item) {
      return NextResponse.json(
        {
          error: 'Registry item not found',
          message: `The component "${parsed.name}" does not exist in the registry.`,
        },
        { status: 404 },
      )
    }

    // Transform the item based on the effective tag
    const transformedItem = transformRegistryItem(item, effectiveTag)

    // Return JSON response with appropriate cache headers
    return NextResponse.json(transformedItem, {
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 hour on CDN, but allow stale-while-revalidate for 24 hours
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Registry route error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while processing the registry request.',
      },
      { status: 500 },
    )
  }
}
