#!/usr/bin/env bun

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

type BumpType = 'major' | 'minor' | 'patch'

interface ReleaseOptions {
  major?: number
  minor?: number
  packagePath: string
  dryRun: boolean
  noGitTag: boolean
  tag: string
  bump?: BumpType
}

interface CurrentVersion {
  major: number
  minor: number
  patch: string
  full: string
}

function parseCurrentVersion(packagePath: string): CurrentVersion | null {
  try {
    const packageJsonPath = join(packagePath, 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    if (!packageJson.version || packageJson.version === '0.0.0') {
      return null
    }

    const [major, minor, patch] = packageJson.version.split('.')

    return {
      major: Number.parseInt(major),
      minor: Number.parseInt(minor),
      patch: patch,
      full: packageJson.version,
    }
  } catch (error) {
    console.warn(`! Could not parse current version: ${error}`)
    return null
  }
}

function calculateBumpedVersion(
  current: CurrentVersion,
  bumpType: BumpType,
): { major: number; minor: number } {
  switch (bumpType) {
    case 'major':
      return {
        major: current.major + 1,
        minor: 0,
      }

    case 'minor':
      return {
        major: current.major,
        minor: current.minor + 1,
      }

    case 'patch':
      // For patch, we keep same major.minor but generate new patch (handled by generate-version.ts)
      return {
        major: current.major,
        minor: current.minor,
      }

    default:
      throw new Error(`Unknown bump type: ${bumpType}`)
  }
}

async function release({
  major,
  minor,
  packagePath,
  dryRun,
  noGitTag,
  tag,
  bump,
}: ReleaseOptions) {
  console.log(`🚀 Starting release process for ${packagePath}`)

  let finalMajor: number
  let finalMinor: number

  if (bump) {
    console.log(`   Bump type: ${bump}`)

    const current = parseCurrentVersion(packagePath)
    if (!current) {
      throw new Error(
        'Cannot bump version - no current version found. Use --major and --minor to set initial version.',
      )
    }

    console.log(`   Current version: ${current.full}`)

    const bumped = calculateBumpedVersion(current, bump)
    finalMajor = bumped.major
    finalMinor = bumped.minor

    console.log(
      `   Bumping ${bump}: ${current.major}.${current.minor}.* → ${finalMajor}.${finalMinor}.*`,
    )
  } else if (major !== undefined && minor !== undefined) {
    console.log(`   Explicit version: ${major}.${minor}.YYYYMMDDNN`)
    finalMajor = major
    finalMinor = minor
  } else {
    throw new Error(
      'Must specify either --bump <type> or both --major and --minor',
    )
  }

  console.log(`   Final version: ${finalMajor}.${finalMinor}.YYYYMMDDNN`)
  console.log(`   Dry run: ${dryRun}`)
  console.log(`   Tag: ${tag}`)

  try {
    // Step 1: Generate version
    console.log('\n📝 Step 1: Generating version...')
    execSync(
      `bun scripts/generate-version.ts ${finalMajor} ${finalMinor} ${packagePath}`,
      {
        stdio: 'inherit',
      },
    )

    // Step 2: Publish
    console.log('\n📦 Step 2: Publishing...')
    const publishArgs = [
      packagePath,
      dryRun ? '--dry-run' : '',
      noGitTag ? '--no-git-tag' : '',
      `--tag ${tag}`,
    ]
      .filter(Boolean)
      .join(' ')

    execSync(`bun scripts/publish.ts ${publishArgs}`, {
      stdio: 'inherit',
    })

    console.log('\n✅ Release completed successfully!')
  } catch (error) {
    console.error('\n❌ Release failed:', error)
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)

  let major: number | undefined
  let minor: number | undefined
  let packagePath = '.'
  let dryRun = false
  let noGitTag = false
  let tag = 'latest'
  let bump: BumpType | undefined

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--major') {
      major = Number.parseInt(args[++i])
    } else if (arg === '--minor') {
      minor = Number.parseInt(args[++i])
    } else if (arg === '--bump') {
      const bumpValue = args[++i]
      if (!bumpValue || !['major', 'minor', 'patch'].includes(bumpValue)) {
        console.error('❌ Error: --bump must be one of: major, minor, patch')
        process.exit(1)
      }
      bump = bumpValue as BumpType
    } else if (arg === '--path') {
      packagePath = args[++i] || '.'
    } else if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--no-git-tag') {
      noGitTag = true
    } else if (arg === '--tag') {
      tag = args[++i] || 'latest'
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
🚀 Release Script

Usage: 
  bun scripts/release.ts --bump <type> [options]
  bun scripts/release.ts --major <num> --minor <num> [options]

Version Bumping:
  --bump major         Increment major version (e.g., 1.0.* → 2.0.*)
  --bump minor         Increment minor version (e.g., 1.0.* → 1.1.*)
  --bump patch         Increment patch counter for today (e.g., 1.0.20240115000 → 1.0.20240115001)

Explicit Version:
  --major <number>     Major version number
  --minor <number>     Minor version number

Options:
  --path <path>        Path to package directory (default: .)
  --dry-run           Run without actually publishing
  --no-git-tag        Do not create a git tag
  --tag <tag>         NPM dist tag (default: latest)
  --help, -h          Show this help

Examples:
  # Bump patch (increment daily counter)
  bun scripts/release.ts --bump patch

  # Bump minor version (1.0.* → 1.1.YYYYMMDD00)
  bun scripts/release.ts --bump minor

  # Bump major version (1.0.* → 2.0.YYYYMMDD00)  
  bun scripts/release.ts --bump major

  # Explicit version (legacy mode)
  bun scripts/release.ts --major 1 --minor 0

  # Dry run with bump
  bun scripts/release.ts --bump patch --dry-run

  # Specific package path
  bun scripts/release.ts --bump minor --path packages/filters

  # Beta release with bump
  bun scripts/release.ts --bump patch --tag beta

Version Format:
  major.minor.<year><month><day><counter>
  
  Examples:
  - 1.0.2024011500 (first release on Jan 15, 2024)
  - 1.0.2024011501 (second release same day)
  - 1.1.2024011600 (minor bump next day)
`)
      process.exit(0)
    }
  }

  // Validation
  if (bump && (major !== undefined || minor !== undefined)) {
    console.error(
      '❌ Error: Cannot use --bump with --major/--minor. Choose one approach.',
    )
    process.exit(1)
  }

  if (!bump && (major === undefined || minor === undefined)) {
    console.error(
      '❌ Error: Must specify either --bump <type> or both --major and --minor',
    )
    console.error('Use --help for usage information')
    process.exit(1)
  }

  if (major !== undefined && (Number.isNaN(major) || major < 0)) {
    console.error('❌ Error: --major must be a valid non-negative number')
    process.exit(1)
  }

  if (minor !== undefined && (Number.isNaN(minor) || minor < 0)) {
    console.error('❌ Error: --minor must be a valid non-negative number')
    process.exit(1)
  }

  await release({ major, minor, packagePath, dryRun, noGitTag, tag, bump })
}

// @ts-ignore
if (import.meta.main) {
  main()
}
