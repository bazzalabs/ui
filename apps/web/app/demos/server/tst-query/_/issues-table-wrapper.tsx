'use client'

import type { FiltersState } from '@bazza-ui/filters'
import { parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { IssuesTable } from './issues-table'

const filtersSchema = z.custom<FiltersState>()

export function IssuesTableWrapper() {
  const [filters, setFilters] = useQueryState<FiltersState>(
    'filters',
    parseAsJson(filtersSchema.parse).withDefault([]),
  )

  return <IssuesTable state={{ filters, setFilters }} />
}
