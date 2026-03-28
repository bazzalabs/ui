import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  skipValidation: true,
  server: {
    SHOW_PRIVATE_PAGES: z.enum(['true', 'false']).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_RELEASE_TYPE: z
      .enum(['stable', 'canary', 'rc'])
      .default('canary'),
  },
  runtimeEnv: {
    SHOW_PRIVATE_PAGES: process.env.SHOW_PRIVATE_PAGES,
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
          : process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_RELEASE_TYPE: process.env.NEXT_PUBLIC_RELEASE_TYPE ?? 'canary',
  },
})
