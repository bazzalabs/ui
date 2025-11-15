import { type DataTableFilterActions, type Locale, t } from '@bazza-ui/filters'
import { FilterXIcon } from 'lucide-react'
import { type ComponentPropsWithoutRef, memo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type FilterVariant, useFilterVariant } from '../context'

interface FilterActionsProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, 'onClick' | 'variant'> {
  hasFilters: boolean
  actions?: DataTableFilterActions
  locale?: Locale
  variant?: ComponentPropsWithoutRef<typeof Button>['variant']
  filterVariant?: FilterVariant
}

export const FilterActions = memo(__FilterActions)
function __FilterActions({
  hasFilters,
  actions,
  locale = 'en',
  className,
  variant = 'destructive',
  filterVariant: filterVariantProp,
  ...props
}: FilterActionsProps) {
  const contextVariant = useFilterVariant()
  const filterVariant = filterVariantProp ?? contextVariant

  return (
    <Button
      data-slot="filter-actions"
      data-state={hasFilters ? 'visible' : 'hidden'}
      className={cn('h-7 !px-2', !hasFilters && 'hidden', className)}
      variant={variant}
      onClick={actions?.removeAllFilters}
      {...props}
    >
      <FilterXIcon />
      <span className="hidden md:block">{t('clear', locale)}</span>
    </Button>
  )
}
