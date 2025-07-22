#!/usr/bin/env bun

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface VersionConfig {
  major: number
  minor: number
  packagePath: string
}

/**
 * Generates a custom semver version: major.minor.<year><month><day><counter>
 *
 * Why this format?
 * - Automated builds need unique versions
 * - Build tags aren't comparable, so don't work for npm
 * - Previous format (with hour/minute) exceeded 32-bit limit in Bun
 * - Current format allows 100 releases per day and works until ~year 4050
 */
async function generateVersion({
  major,
  minor,
  packagePath,
}: VersionConfig): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  // Get today's date prefix
  const datePrefix = `${year}${month}${day}`

  // Find existing versions for today
  const counter = await getTodaysVersionCounter(datePrefix, packagePath)
  const paddedCounter = String(counter).padStart(2, '0')

  const version = `${major}.${minor}.${datePrefix}${paddedCounter}`

  console.log(`Generated version: ${version}`)
  console.log(`  Date: ${year}-${month}-${day}`)
  console.log(`  Counter: ${counter}`)

  return version
}

async function getTodaysVersionCounter(
  datePrefix: string,
  packagePath: string,
): Promise<number> {
  try {
    // Get the package name from package.json
    const packageJson = JSON.parse(
      readFileSync(join(packagePath, 'package.json'), 'utf-8'),
    )
    const packageName = packageJson.name

    // Query npm for existing versions
    const npmViewCmd = `npm view ${packageName} versions --json`
    const result = execSync(npmViewCmd, { encoding: 'utf-8', stdio: 'pipe' })
    const versions: string[] = JSON.parse(result)

    // Find versions from today
    const todaysVersions = versions
      .filter((v) => {
        const parts = v.split('.')
        return parts[2]?.startsWith(datePrefix)
      })
      .map((v) => {
        const parts = v.split('.')
        const patch = parts[2] || '0'
        const counterStr = patch.slice(datePrefix.length)
        return Number.parseInt(counterStr) || 0
      })
      .sort((a, b) => b - a) // Descending order

    // Return next counter (highest + 1, or 0 if none exist)
    return todaysVersions.length > 0 ? todaysVersions[0] + 1 : 0
  } catch (error) {
    console.log(
      'No existing versions found or package not published yet, starting with counter 0',
    )
    return 0
  }
}

async function updatePackageJson(
  packagePath: string,
  version: string,
): Promise<void> {
  const packageJsonPath = join(packagePath, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  packageJson.version = version
  packageJson.private = false // Ensure it's publishable

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
  console.log(`Updated ${packageJsonPath} with version ${version}`)
}

async function main() {
  const args = process.argv.slice(2)
  const [majorStr, minorStr, packagePath = '.'] = args

  if (!majorStr || !minorStr) {
    console.error(
      'Usage: bun scripts/generate-version.ts <major> <minor> [package-path]',
    )
    console.error(
      'Example: bun scripts/generate-version.ts 1 0 packages/filters',
    )
    process.exit(1)
  }

  const major = Number.parseInt(majorStr)
  const minor = Number.parseInt(minorStr)

  if (isNaN(major) || isNaN(minor)) {
    console.error('Major and minor must be valid numbers')
    process.exit(1)
  }

  try {
    const version = await generateVersion({ major, minor, packagePath })
    await updatePackageJson(packagePath, version)

    // Output the version for use in CI/CD
    console.log(`::set-output name=version::${version}`)
  } catch (error) {
    console.error('Error generating version:', error)
    process.exit(1)
  }
}

// @ts-ignore
if (import.meta.main) {
  main()
}
