import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { env } from './env'

export type RegistryTag = 'canary' | 'stable' | 'rc'

export interface ParsedRegistrySlug {
  name: string
  tag: RegistryTag | null
  hasJsonExtension: boolean
}

export interface RegistryItem {
  $schema?: string
  name: string
  type: string
  title?: string
  author?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files?: Array<{
    path: string
    content?: string
    type: string
    target: string
  }>
}

/**
 * Parses a registry slug to extract component name and optional tag
 * Examples:
 *   - "action-menu" → { name: "action-menu", tag: null, hasJsonExtension: false }
 *   - "action-menu.json" → { name: "action-menu", tag: null, hasJsonExtension: true }
 *   - "action-menu@canary" → { name: "action-menu", tag: "canary", hasJsonExtension: false }
 *   - "action-menu@canary.json" → { name: "action-menu", tag: "canary", hasJsonExtension: true }
 */
export function parseRegistrySlug(slug: string[]): ParsedRegistrySlug {
  const fullSlug = slug.join('/')

  // Check if it ends with .json
  const hasJsonExtension = fullSlug.endsWith('.json')
  const withoutExtension = hasJsonExtension ? fullSlug.slice(0, -5) : fullSlug

  // Check for @tag suffix
  const tagMatch = withoutExtension.match(/^(.+)@(canary|stable|rc)$/)

  if (tagMatch) {
    return {
      name: tagMatch[1]!,
      tag: tagMatch[2] as RegistryTag,
      hasJsonExtension,
    }
  }

  return {
    name: withoutExtension,
    tag: null,
    hasJsonExtension,
  }
}

/**
 * Detects the current deployment environment
 * Returns the appropriate tag based on the NEXT_PUBLIC_RELEASE_TYPE environment variable
 */
export function detectEnvironment(): RegistryTag {
  return env.NEXT_PUBLIC_RELEASE_TYPE
}

/**
 * Gets the base URL for the current environment
 */
export function getBaseUrl(): string {
  const appUrl = env.NEXT_PUBLIC_APP_URL

  // Use the environment's APP_URL
  if (appUrl) {
    return appUrl
  }

  // Fallback to localhost
  return 'http://localhost:3000'
}

/**
 * Transforms dependencies by adding version tags to @bazza-ui packages
 * Example:
 *   - "@bazza-ui/filters" with tag "canary" → "@bazza-ui/filters@canary"
 *   - "date-fns" with tag "canary" → "date-fns" (unchanged)
 */
export function transformDependencies(
  dependencies: string[] | undefined,
  tag: RegistryTag,
): string[] | undefined {
  if (!dependencies) return dependencies

  // Don't add tags for stable releases
  if (tag === 'stable') {
    return dependencies
  }

  return dependencies.map((dep) => {
    // Only transform @bazza-ui packages
    if (dep.startsWith('@bazza-ui/')) {
      // Remove any existing tag
      const baseDep = dep.split('@').slice(0, 2).join('@')
      return `${baseDep}@${tag}`
    }
    return dep
  })
}

/**
 * Checks if a registry dependency is a custom component (exists in our registry)
 * vs a standard shadcn component
 */
export function isCustomRegistryItem(name: string): boolean {
  try {
    const registryDir = join(process.cwd(), 'public', 'r', 'base')
    const files = readdirSync(registryDir)
    return files.includes(`${name}.json`)
  } catch {
    // If registry dir doesn't exist yet or can't be read, return false
    return false
  }
}

/**
 * Transforms registryDependencies by rewriting custom registry items to full URLs
 * Standard shadcn components remain as simple strings
 *
 * Example:
 *   - "button" → "button" (standard shadcn component)
 *   - "action-menu" → "https://bazza-ui.com/r/action-menu" (custom component)
 */
export function transformRegistryDependencies(
  registryDependencies: string[] | undefined,
  baseUrl: string,
): string[] | undefined {
  if (!registryDependencies) return registryDependencies

  return registryDependencies.map((dep) => {
    // Check if this is one of our custom registry items
    if (isCustomRegistryItem(dep)) {
      return `${baseUrl}/r/${dep}`
    }
    // Keep standard shadcn components as-is
    return dep
  })
}

/**
 * Gets the file path for a registry item
 */
export function getRegistryFilePath(name: string): string {
  return join(process.cwd(), 'public', 'r', 'base', `${name}.json`)
}

/**
 * Reads and parses a registry item from the public/r/base directory
 */
export function readRegistryItem(name: string): RegistryItem | null {
  try {
    const filePath = getRegistryFilePath(name)
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as RegistryItem
  } catch {
    return null
  }
}

/**
 * Transforms a registry item based on the requested tag and environment
 */
export function transformRegistryItem(
  item: RegistryItem,
  tag: RegistryTag,
): RegistryItem {
  const baseUrl = getBaseUrl()

  return {
    ...item,
    dependencies: transformDependencies(item.dependencies, tag),
    registryDependencies: transformRegistryDependencies(
      item.registryDependencies,
      baseUrl,
    ),
  }
}
