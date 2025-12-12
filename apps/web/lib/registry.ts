/**
 * Registry utilities - Client-safe
 *
 * This module contains client-safe registry utilities that don't use Node.js APIs.
 * For server-side functions that read from the filesystem, use `registry.server.ts`.
 */

import type { RegistryEntry, RegistryIndex } from '@/registry/__index__'
import {
  blocks,
  examples,
  getRegistryEntry,
  registry,
  ui,
} from '@/registry/__index__'

// =============================================================================
// Types
// =============================================================================

export interface RegistryItemFile {
  path: string
  content: string
  type: string
  target: string
}

export interface RegistryItem {
  name: string
  type: string
  title?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: RegistryItemFile[]
}

// =============================================================================
// Re-exports from __index__
// =============================================================================

export type { RegistryEntry, RegistryIndex }
export { blocks, examples, getRegistryEntry, registry, ui }

// =============================================================================
// Client-safe Registry Functions
// =============================================================================

/**
 * Get the lazy-loaded component for a registry entry
 * Returns the React.lazy component that can be rendered with Suspense
 */
export function getRegistryComponent(name: string) {
  const entry = getRegistryEntry(name)
  if (!entry) {
    return null
  }
  return entry.component
}

/**
 * Transform registry paths in source code for display
 * Replaces @/registry/... paths with @/components/... for user-friendly display
 */
export function transformRegistryPaths(content: string): string {
  return content
    .replace(/@\/registry\/ui\//g, '@/components/ui/')
    .replace(/@\/registry\/examples\//g, '@/components/examples/')
    .replace(/@\/registry\/blocks\//g, '@/app/')
}

/**
 * Get the filename from a file path
 */
export function getFileName(filePath: string): string {
  const parts = filePath.split('/')
  return parts[parts.length - 1] ?? filePath
}

/**
 * Get the file extension from a file path
 */
export function getFileExtension(filePath: string): string {
  const fileName = getFileName(filePath)
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1) return ''
  return fileName.slice(lastDot + 1)
}

/**
 * Get the language for syntax highlighting based on file extension
 */
export function getLanguageFromPath(
  filePath: string,
): 'typescript' | 'javascript' | 'tsx' | 'jsx' | 'json' | 'bash' {
  const ext = getFileExtension(filePath)
  switch (ext) {
    case 'ts':
      return 'typescript'
    case 'tsx':
      return 'tsx'
    case 'js':
      return 'javascript'
    case 'jsx':
      return 'jsx'
    case 'json':
      return 'json'
    default:
      return 'typescript'
  }
}
