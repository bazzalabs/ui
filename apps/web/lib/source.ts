// @ts-nocheck
import { loader } from 'fumadocs-core/source'
import { changelog, docs } from '@/.source'

export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  // url: (slugs) => {
  //   // Flatten action-menu URLs: remove intermediate folder names
  //   if (slugs[0] === 'action-menu' && slugs.length > 2) {
  //     // Keep only: docs/action-menu/{page-name}
  //     const output = `/docs/action-menu/${slugs[slugs.length - 1]}`
  //     console.log({
  //       slugs: slugs.join('/'),
  //       output,
  //     })
  //     return output
  //   }
  //   // Default behavior for other docs
  //   return `/docs/${slugs.join('/')}`
  // },
})

export const changelogSource = loader({
  baseUrl: '/changelog',
  source: changelog.toFumadocsSource(),
})
