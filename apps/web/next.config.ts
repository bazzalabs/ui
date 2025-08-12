import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'production' ? '.next' : '.next-dev',
  transpilePackages: ['next-mdx-remote'],
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
      source: '/r/filters',
      destination: '/r/data-table-filter.json',
      permanent: false,
    },
    {
      source: '/r/data-table-filter',
      destination: '/r/data-table-filter.json',
      permanent: false,
    },
    {
      source: '/r/filters/i18n',
      destination: '/r/data-table-filter-i18n.json',
      permanent: false,
    },
    {
      source: '/r/filters/tst',
      destination: '/r/data-table-filter-tst.json',
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

export default nextConfig
