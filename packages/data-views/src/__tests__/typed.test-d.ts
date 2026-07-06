import { expectTypeOf, test } from 'vitest'
import { defineView } from '../core/define-view.js'
import { createEmptyFilters } from '../core/filter-tree.js'
import {
  type ColumnIds,
  createFilterActions,
  type OperatorIdsForType,
  type ValuesForType,
} from '../core/typed.js'

const columns = [
  { id: 'status', type: 'option' },
  { id: 'estimate', type: 'number' },
  { id: 'createdAt', type: 'date' },
] as const

const state = createEmptyFilters()
const actions = createFilterActions(columns)
const view = defineView(columns)

test('column ids are inferred from the columns tuple', () => {
  type Ids = ColumnIds<typeof columns>

  expectTypeOf<Ids>().toEqualTypeOf<'status' | 'estimate' | 'createdAt'>()
  expectTypeOf(actions.remove).parameter(1).toEqualTypeOf<Ids>()
})

test('filter actions correlate operators and values with the selected column', () => {
  actions.add(state, 'status', { operator: 'is', values: ['active'] })
  actions.add(state, 'estimate', { operator: 'is_between', values: [1, 3] })
  actions.add(state, 'createdAt', {
    operator: 'is_before',
    values: [new Date()],
  })

  // @ts-expect-error number columns cannot use text operators
  actions.add(state, 'estimate', { operator: 'contains', values: [1] })

  // @ts-expect-error number columns require number[] values
  actions.setValues(state, 'estimate', ['1'])
})

test('defineView uses the same tuple-keyed column ids', () => {
  view({ sort: [{ columnId: 'estimate', direction: 'asc' }] })

  // @ts-expect-error sort column ids must be present in the tuple
  view({ sort: [{ columnId: 'missing', direction: 'asc' }] })
})

test('custom column data types fall back to string operators and unknown values', () => {
  const customColumns = [{ id: 'payload', type: 'json' }] as const
  const customActions = createFilterActions(customColumns)

  expectTypeOf<
    OperatorIdsForType<(typeof customColumns)[number]['type']>
  >().toEqualTypeOf<string>()
  expectTypeOf<
    ValuesForType<(typeof customColumns)[number]['type']>
  >().toEqualTypeOf<unknown[]>()

  customActions.add(state, 'payload', {
    operator: 'is_deeply_equal_to',
    values: [{ ok: true }, 1, 'raw'],
  })
})
