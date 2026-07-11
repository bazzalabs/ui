/**
 * Registry utilities - Server-only
 *
 * This module contains server-side registry utilities that use Node.js APIs.
 * These functions can only be used in Server Components or API routes.
 */

import 'server-only'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getRegistryEntry, type RegistryTier } from '@/registry/__index__'
import type { RegistryItem } from './registry'

// =============================================================================
// Server-only Registry Functions
// =============================================================================

/**
 * Get registry item metadata from the pre-built JSON files
 * This is used server-side to get file contents, dependencies, etc.
 */
export async function getRegistryItem(
  name: string,
): Promise<RegistryItem | null> {
  try {
    const filePath = join(process.cwd(), 'public', 'r', 'base', `${name}.json`)
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as RegistryItem
  } catch {
    return null
  }
}

/**
 * Get the source code for a registry file
 * Reads directly from the filesystem (server-side only)
 */
export async function getRegistryFileSource(
  filePath: string,
): Promise<string | null> {
  try {
    const fullPath = join(process.cwd(), filePath)
    return readFileSync(fullPath, 'utf-8')
  } catch {
    return null
  }
}

/**
 * Get all source files for a registry entry
 * Returns an array of { path, content } objects
 */
export async function getRegistryEntrySources(
  name: string,
  tier?: RegistryTier,
): Promise<Array<{ path: string; content: string }>> {
  const entry = getRegistryEntry(name, tier)
  if (!entry) {
    return []
  }

  const sources: Array<{ path: string; content: string }> = []

  for (const filePath of entry.files) {
    const content = await getRegistryFileSource(filePath)
    if (content) {
      sources.push({ path: filePath, content })
    }
  }

  return sources
}

/**
 * Get the primary source file for a registry entry
 * For examples, this is typically the main component file
 * For blocks, this is the page.tsx file
 */
export async function getRegistryEntryPrimarySource(
  name: string,
  tier?: RegistryTier,
): Promise<{ path: string; content: string } | null> {
  const entry = getRegistryEntry(name, tier)
  if (!entry || entry.files.length === 0) {
    return null
  }

  const primaryPath = entry.files[0]
  if (!primaryPath) {
    return null
  }

  const content = await getRegistryFileSource(primaryPath)

  if (!content) {
    return null
  }

  return { path: primaryPath, content }
}
