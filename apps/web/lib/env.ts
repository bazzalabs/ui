import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_RELEASE_TYPE: z
      .enum(['stable', 'canary', 'rc'])
      .default('canary'),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
          : process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_RELEASE_TYPE: process.env.NEXT_PUBLIC_RELEASE_TYPE ?? 'canary',
  },
})
