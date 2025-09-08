// apps/web/components/CodeInline.tsx
import { highlightInline } from '@/lib/highlighter'

type Props = {
  code: string
  lang?: 'ts' | 'tsx' | 'js' | 'jsx' | 'json' | 'bash' // extend as needed
  className?: string
}

export default async function CodeInline({
  code,
  lang = 'ts',
  className,
}: Props) {
  // If empty, render nothing-ish to keep tables tidy
  if (!code) return <code className={className} />
  const el = await highlightInline(code, lang)
  return <span className={className}>{el}</span>
}
