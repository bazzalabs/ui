import Link from 'next/link'
import { DOCS_TIERS, type DocsTier } from '@/lib/source'
import { cn } from '@/lib/utils'

type DocsTierSwitcherProps = {
  tiers: DocsTier[]
  activeTier: DocsTier | undefined
  slugs: string[]
}

const labels = {
  components: 'Component',
  primitives: 'Primitive',
} satisfies Record<DocsTier, string>

export function DocsTierSwitcher({
  tiers,
  activeTier,
  slugs,
}: DocsTierSwitcherProps) {
  if (tiers.length === 1) {
    const tier = tiers[0]!

    return (
      <span className="text-xs font-medium border rounded-md px-2 py-0.5 text-muted-foreground w-fit">
        {labels[tier]}
      </span>
    )
  }

  return (
    <div className="flex w-fit items-center gap-4">
      {DOCS_TIERS.filter((tier) => tiers.includes(tier)).map((tier) => (
        <Link
          key={tier}
          href={`/docs/${tier}/${slugs.join('/')}`}
          className={cn(
            'border-b-2 px-1 pb-1 text-sm font-medium',
            activeTier === tier
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {labels[tier]}
        </Link>
      ))}
    </div>
  )
}
