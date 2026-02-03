import { Inter } from 'next/font/google'
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
