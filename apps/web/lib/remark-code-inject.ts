import type { Code, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

export interface RemarkCodeInjectOptions {
  /** Key-value pairs to inject into code blocks */
  variables: Record<string, unknown>
  /** Pattern to match. Default: /\{\{([\w.]+)\}\}/g for {{VAR_NAME}} or {{env.VAR}} syntax */
  pattern?: RegExp
}

/**
 * Get a value from a nested object using dot notation
 * @example getValue({ env: { APP_URL: 'https://example.com' } }, 'env.APP_URL') // 'https://example.com'
 */
const getValue = (
  obj: Record<string, unknown>,
  path: string,
): string | undefined => {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)

  return typeof value === 'string' ? value : undefined
}

/**
 * Remark plugin that injects variables into code block content.
 *
 * @example
 * // In source.config.ts
 * import { remarkCodeInject } from '@/lib/remark-code-inject'
 *
 * remarkPlugins: [
 *   [remarkCodeInject, {
 *     variables: {
 *       APP_URL: 'https://bazza.dev',
 *       env: { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL }
 *     }
 *   }]
 * ]
 *
 * @example
 * // In MDX
 * ```npm
 * npx shadcn-ui@latest add {{APP_URL}}/r/filters
 * ```
 *
 * // Or with dot notation
 * ```npm
 * npx shadcn-ui@latest add {{env.NEXT_PUBLIC_APP_URL}}/r/filters
 * ```
 */
export const remarkCodeInject: Plugin<[RemarkCodeInjectOptions], Root> = (
  options,
) => {
  const { variables, pattern = /\{\{([\w.]+)\}\}/g } = options

  return (tree) => {
    visit(tree, 'code', (node: Code) => {
      if (!node.value) return

      node.value = node.value.replace(pattern, (match, key: string) => {
        const value = getValue(variables, key)
        return value ?? match // Keep original if not found
      })
    })
  }
}
