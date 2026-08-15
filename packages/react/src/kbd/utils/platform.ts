'use client'

import * as React from 'react'

type Platform = 'apple' | 'other'

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    platform?: string
  }
}

export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const nav = navigator as NavigatorWithUserAgentData
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent

  return /mac|iphone|ipad|ipod/i.test(platform)
}

/**
 * Returns the current platform while keeping the first client render aligned with
 * SSR. Without an override, this starts as "other" and corrects to "apple" after
 * mount when appropriate, avoiding hydration mismatches.
 */
export function usePlatform(override?: Platform): Platform {
  const [platform, setPlatform] = React.useState<Platform>('other')

  React.useEffect(() => {
    if (override === undefined && isApplePlatform()) {
      setPlatform('apple')
    }
  }, [override])

  return override ?? platform
}
