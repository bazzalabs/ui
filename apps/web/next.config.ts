import { createMDX } from 'fumadocs-mdx/next'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'production' ? '.next' : '.next-dev',
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: {
    remotePatterns: [
      new URL(
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/**',
      ),
    ],
  },
  redirects: async () => [
    {
      source: '/chat',
      destination: 'https://discord.gg/KJatePVVxu',
      permanent: false,
    },
    {
      source: '/docs',
      destination: '/docs/intro',
      permanent: false,
    },
    {
      source: '/feedback',
      destination: 'https://bazzaui.userjot.com',
      permanent: false,
    },
    {
      source: '/filters',
      destination: '/docs/data-table-filter',
      permanent: false,
    },
    {
      source: '/changelog',
      destination: '/changelog/latest',
      permanent: false,
    },
    {
      source: '/changelog/latest',
      destination: '/changelog/2025-05-05-v0.2',
      permanent: false,
    },
  ],
}

const withMDX = createMDX({})

export default withMDX(nextConfig)
