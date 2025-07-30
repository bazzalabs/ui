#!/usr/bin/env bun

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface PublishOptions {
  packagePath: string
  dryRun?: boolean
  noGitTag?: boolean
  tag?: string
  registry?: string
}

async function publishPackage({
  packagePath,
  dryRun = false,
  noGitTag = false,
  tag = 'latest',
  registry = 'https://registry.npmjs.org/',
}: PublishOptions) {
  console.log(`🚀 Publishing package from ${packagePath}`)

  // Verify package.json exists and is valid
  const packageJsonPath = join(packagePath, 'package.json')
  let packageJson: any
  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  } catch (error) {
    throw new Error(
      `Failed to read package.json from ${packageJsonPath}: ${error}`,
    )
  }

  if (packageJson.private) {
    throw new Error(
      'Cannot publish private package. Set "private": false in package.json',
    )
  }

  console.log(`📦 Package: ${packageJson.name}@${packageJson.version}`)

  // Build the package first
  console.log('🔨 Building package...')
  try {
    execSync('bun run build', {
      cwd: packagePath,
      stdio: 'inherit',
    })
  } catch (error) {
    throw new Error(`Build failed: ${error}`)
  }

  // Run tests
  console.log('🧪 Running tests...')
  try {
    execSync('bun run test', {
      cwd: packagePath,
      stdio: 'inherit',
    })
  } catch (error) {
    console.warn('! Tests failed, but continuing with publish...')
  }

  // Prepare npm publish command
  const publishCmd = [
    'npm publish',
    `--tag ${tag}`,
    `--registry ${registry}`,
    dryRun ? '--dry-run' : '',
  ]
    .filter(Boolean)
    .join(' ')

  console.log(`📤 Publishing with: ${publishCmd}`)

  if (dryRun) {
    console.log('🔍 DRY RUN - Not actually publishing')
  }

  try {
    execSync(publishCmd, {
      cwd: packagePath,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_AUTH_TOKEN: process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN,
      },
    })

    if (!dryRun) {
      console.log(
        `✅ Successfully published ${packageJson.name}@${packageJson.version}`,
      )

      // Tag git commit
      if (!noGitTag) {
        try {
          execSync(`git tag v${packageJson.version}`, { stdio: 'pipe' })
          execSync(`git push origin v${packageJson.version}`, { stdio: 'pipe' })
          console.log(`🏷 Created git tag v${packageJson.version}`)
        } catch (error) {
          console.warn('! Failed to create git tag:', error)
        }
      }
    } else {
      console.log('✅ Dry run completed successfully')
    }
  } catch (error) {
    throw new Error(`Publish failed: ${error}`)
  }
}

async function main() {
  const args = process.argv.slice(2)

  let packagePath = '.'
  let dryRun = false
  let noGitTag = false
  let tag = 'latest'
  let registry = 'https://registry.npmjs.org/'

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--no-git-tag') {
      noGitTag = true
    } else if (arg === '--tag') {
      tag = args[++i] || 'latest'
    } else if (arg === '--registry') {
      registry = args[++i] || registry
    } else if (arg === '--path') {
      packagePath = args[++i] || '.'
    } else if (!arg.startsWith('--')) {
      packagePath = arg
    }
  }

  try {
    await publishPackage({ packagePath, dryRun, noGitTag, tag, registry })
  } catch (error) {
    console.error('❌ Publish failed:', error)
    process.exit(1)
  }
}

// @ts-ignore
if (import.meta.main) {
  main()
}
