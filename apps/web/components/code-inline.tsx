// apps/web/components/CodeInline.tsx
import { cn } from '@/lib/utils'

type Props = {
  code: string
  lang?: 'ts' | 'tsx' | 'js' | 'jsx' | 'json' | 'bash' // extend as needed
  className?: string
}

export default function CodeInline({ code, className }: Props) {
  // If empty, render nothing-ish to keep tables tidy
  if (!code) return <code className={className} />
  return <code className={cn('font-mono', className)}>{code}</code>
}
