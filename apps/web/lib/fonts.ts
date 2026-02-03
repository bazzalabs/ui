import { Geist_Mono, Inter } from 'next/font/google'

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
