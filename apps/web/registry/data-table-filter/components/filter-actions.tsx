import { type DataTableFilterActions, type Locale, t } from '@bazzaui/filters'
import { FilterXIcon } from 'lucide-react'
import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterActionsProps {
  hasFilters: boolean
  actions?: DataTableFilterActions
  locale?: Locale
}

export const FilterActions = memo(__FilterActions)
function __FilterActions({
  hasFilters,
  actions,
  locale = 'en',
}: FilterActionsProps) {
  return (
    <Button
      className={cn('h-7 !px-2', !hasFilters && 'hidden')}
      variant="destructive"
      onClick={actions?.removeAllFilters}
    >
      <FilterXIcon />
      <span className="hidden md:block">{t('clear', locale)}</span>
    </Button>
  )
}
