import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const webAppRoot = join(__dirname, '..')
const berkeleyMonoPath = join(
  webAppRoot,
  'assets/fonts/berkeley-mono/BerkeleyMono-Variable.woff2',
)
const fontsOutputPath = join(webAppRoot, 'lib/fonts.ts')

const hasBerkeleyMono = existsSync(berkeleyMonoPath)

const fontsWithBerkeleyMono = `import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

export const inter = Inter({
  style: ['normal', 'italic'],
  axes: ['opsz'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const monoFont = localFont({
  src: '../assets/fonts/berkeley-mono/BerkeleyMono-Variable.woff2',
  style: 'normal',
  variable: '--font-mono',
  display: 'swap',
})

// Backwards compatibility alias
export const berkeleyMono = monoFont
`

const fontsWithGeistMono = `import { Inter, Geist_Mono } from 'next/font/google'

export const inter = Inter({
  style: ['normal', 'italic'],
  axes: ['opsz'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const monoFont = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// Backwards compatibility alias
export const berkeleyMono = monoFont
`

const content = hasBerkeleyMono ? fontsWithBerkeleyMono : fontsWithGeistMono

writeFileSync(fontsOutputPath, content)

console.log(
  `Generated fonts.ts with ${hasBerkeleyMono ? 'Berkeley Mono' : 'Geist Mono (fallback)'}`,
)
