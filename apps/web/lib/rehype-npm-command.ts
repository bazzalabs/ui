import { visit } from 'unist-util-visit'
import type { UnistNode, UnistTree } from '@/types/unist'
import { env } from './env'

export function rehypeNpmCommand() {
  return (tree: UnistTree) => {
    visit(tree, (node: UnistNode) => {
      if (node.type !== 'element' || node?.tagName !== 'pre') {
        return
      }

      // npm install.
      if (node.properties?.['__rawString__']?.startsWith('npm install')) {
        const npmCommand = node.properties?.['__rawString__']
        node.properties['__npmCommand__'] = npmCommand
        node.properties['__yarnCommand__'] = npmCommand.replace(
          'npm install',
          'yarn add',
        )
        node.properties['__pnpmCommand__'] = npmCommand.replace(
          'npm install',
          'pnpm add',
        )
        node.properties['__bunCommand__'] = npmCommand.replace(
          'npm install',
          'bun add',
        )
      }

      // npx create-.
      if (node.properties?.['__rawString__']?.startsWith('npx create-')) {
        const npmCommand = node.properties?.['__rawString__']
        node.properties['__npmCommand__'] = npmCommand
        node.properties['__yarnCommand__'] = npmCommand.replace(
          'npx create-',
          'yarn create ',
        )
        node.properties['__pnpmCommand__'] = npmCommand.replace(
          'npx create-',
          'pnpm create ',
        )
        node.properties['__bunCommand__'] = npmCommand.replace(
          'npx',
          'bunx --bun',
        )
      }

      // npm create.
      if (node.properties?.['__rawString__']?.startsWith('npm create')) {
        const npmCommand = node.properties?.['__rawString__']
        node.properties['__npmCommand__'] = npmCommand
        node.properties['__yarnCommand__'] = npmCommand.replace(
          'npm create',
          'yarn create',
        )
        node.properties['__pnpmCommand__'] = npmCommand.replace(
          'npm create',
          'pnpm create',
        )
        node.properties['__bunCommand__'] = npmCommand.replace(
          'npm create',
          'bun create',
        )
      }

      // npx.
      if (
        node.properties?.['__rawString__']?.startsWith('npx') &&
        !node.properties?.['__rawString__']?.startsWith('npx create-')
      ) {
        const npmCommand = node.properties?.['__rawString__']
        node.properties['__npmCommand__'] = npmCommand
        node.properties['__yarnCommand__'] = npmCommand
        node.properties['__pnpmCommand__'] = npmCommand.replace(
          'npx',
          'pnpm dlx',
        )
        node.properties['__bunCommand__'] = npmCommand.replace(
          'npx',
          'bunx --bun',
        )
      }

      // npm run.
      if (node.properties?.['__rawString__']?.startsWith('npm run')) {
        const npmCommand = node.properties?.['__rawString__']
        node.properties['__npmCommand__'] = npmCommand
        node.properties['__yarnCommand__'] = npmCommand.replace(
          'npm run',
          'yarn',
        )
        node.properties['__pnpmCommand__'] = npmCommand.replace(
          'npm run',
          'pnpm',
        )
        node.properties['__bunCommand__'] = npmCommand.replace('npm run', 'bun')
      }

      if (
        node.properties?.['__rawString__']?.includes('https://ui.bazza.dev') &&
        env.NEXT_PUBLIC_APP_URL !== 'https://ui.bazza.dev'
      ) {
        node.properties['__npmCommand__'] = node.properties[
          '__npmCommand__'
        ]?.replace('https://ui.bazza.dev', env.NEXT_PUBLIC_APP_URL)
        node.properties['__yarnCommand__'] = node.properties[
          '__yarnCommand__'
        ]?.replace('https://ui.bazza.dev', env.NEXT_PUBLIC_APP_URL)
        node.properties['__pnpmCommand__'] = node.properties[
          '__pnpmCommand__'
        ]?.replace('https://ui.bazza.dev', env.NEXT_PUBLIC_APP_URL)
        node.properties['__bunCommand__'] = node.properties[
          '__bunCommand__'
        ]?.replace('https://ui.bazza.dev', env.NEXT_PUBLIC_APP_URL)
      }

      if (
        node.properties?.['__rawString__']?.includes('@bazza-ui/filters') &&
        env.NEXT_PUBLIC_APP_URL !== 'https://ui.bazza.dev'
      ) {
        node.properties['__npmCommand__'] = node.properties[
          '__npmCommand__'
        ]?.replace('@bazza-ui/filters', '@bazza-ui/filters@canary')
        node.properties['__yarnCommand__'] = node.properties[
          '__yarnCommand__'
        ]?.replace('@bazza-ui/filters', '@bazza-ui/filters@canary')
        node.properties['__pnpmCommand__'] = node.properties[
          '__pnpmCommand__'
        ]?.replace('@bazza-ui/filters', '@bazza-ui/filters@canary')
        node.properties['__bunCommand__'] = node.properties[
          '__bunCommand__'
        ]?.replace('@bazza-ui/filters', '@bazza-ui/filters@canary')
      }

      if (
        node.properties?.['__rawString__']?.includes('@bazza-ui/action-menu') &&
        env.NEXT_PUBLIC_APP_URL !== 'https://ui.bazza.dev'
      ) {
        node.properties['__npmCommand__'] = node.properties[
          '__npmCommand__'
        ]?.replace('@bazza-ui/action-menu', '@bazza-ui/action-menu@canary')
        node.properties['__yarnCommand__'] = node.properties[
          '__yarnCommand__'
        ]?.replace('@bazza-ui/action-menu', '@bazza-ui/action-menu@canary')
        node.properties['__pnpmCommand__'] = node.properties[
          '__pnpmCommand__'
        ]?.replace('@bazza-ui/action-menu', '@bazza-ui/action-menu@canary')
        node.properties['__bunCommand__'] = node.properties[
          '__bunCommand__'
        ]?.replace('@bazza-ui/action-menu', '@bazza-ui/action-menu@canary')
      }
    })
  }
}
