# @bazza-ui/data-view — Implementation Plan

Headless data view state manager. Manages filters, sort, and named view configurations.
Framework-agnostic core with React bindings via sub-path export.

## Decisions

| Decision | Choice |
|---|---|
| Package name | `@bazza-ui/data-view` |
| Dependency on `@bazza-ui/filters` | Standalone fork — no dependency |
| TanStack Table integration | Dropped |
| Builder new method pattern | Immutable clone |
| Filter action parameters | Full `Column` object |
| Sort model | Multi-column + custom sorts, ordered array |
| Batch actions | Unified — mix filter + sort atomically |
| Serialization | Ships with core |
| Builder validation | Runtime only |
| Operator system | Fully customizable — `OperatorSet` with composition API |
| Data types | Extensible — `defineColumnType<TValue>()` for custom types |
| React separation | Sub-path exports (`@bazza-ui/data-view` core, `@bazza-ui/data-view/react` hook) |
| Icon type in core | `unknown` — no React dependency in core |
| Filter component updates | Separate effort (out of scope) |

## Naming Reference

| Concept | Name |
|---|---|
| Core serializable type | `DataViewState` |
| Hook | `useDataView` |
| Hook return | `DataViewInstance` |
| Hook options | `DataViewOptions` |
| Builder factory | `createColumnBuilder` |
| Builder class | `ColumnBuilder` |
| Sort item union | `SortRule` (`ColumnSort \| CustomSort`) |
| Sort array | `SortState` (`SortRule[]`) |
| Operator collection | `OperatorSet` |
| Operator item | `OperatorDefinition` |
| Operator factory | `defineOperators` |
| Column type | `ColumnType` |
| Column type factory | `defineColumnType` |
| Default operators | `textOperators`, `optionOperators`, etc. |
| Default column types | `textType`, `numberType`, etc. |
| Serialization | `serializeView` / `deserializeView` |

## Package Structure

```
src/
  index.ts                              # Core barrel (framework-agnostic)
  core/
    types.ts                            # All type definitions
    operator-set.ts                     # OperatorSet class + defineOperators
    operator-sets.ts                    # Default operator sets (7 built-in types)
    column-types.ts                     # ColumnType + defineColumnType + 7 built-in types
    operators.ts                        # determineNewOperator + getOperatorSet
    filters.ts                          # Pure filter state operations
    sort.ts                             # Pure sort state operations
    view.ts                             # Pure view state operations
    columns/
      index.ts                          # Column barrel export
      column-builder.ts                 # ColumnBuilder + createColumnBuilder
      column-factory.ts                 # createColumns / createColumn
      column-data-service.ts            # ColumnDataService
  react/
    index.ts                            # React barrel (re-exports core + hook)
    use-data-view.ts                    # useDataView hook
  lib/
    array.ts                            # Array utilities
    helpers.ts                          # Value creators, type guards, filterRow
    i18n.ts                             # Locale translations
    memo.ts                             # Custom memoization
    order-fns.ts                        # Option ordering functions
    type-guards.ts                      # Column/filter type guards
    serialize.ts                        # serializeView / deserializeView
  __tests__/
    operator-set.test.ts                # OperatorSet composition
    operator-sets.test.ts               # Default operator match functions
    column-types.test.ts                # defineColumnType + custom types
    column-builder.test.ts              # Builder: .sortable(), .operators(), .custom()
    sort.test.ts                        # Sort state operations
    view.test.ts                        # View state operations
    data-view.test.tsx                  # Hook (comprehensive, jsdom)
    filter-operations.test.ts           # Filter operations
    serialize.test.ts                   # Serialization round-trips
```

## Entry Points

- `@bazza-ui/data-view` — core (framework-agnostic, no React)
- `@bazza-ui/data-view/react` — re-exports core + `useDataView` hook

React is an **optional** peer dependency.

---

## Phase 1: Fork Filter Logic from `@bazza-ui/filters`

> Replicate existing filter functionality under the new namespace.
> All files adapted — no dependency on `@bazza-ui/filters`.

### Tasks

- [ ] **1.1** Fork `lib/array.ts` — `uniq`, `take`, `flatten`, `addUniq`, `removeUniq`, `isAnyOf`, `intersection`, `min`, `max`, `minMax`
- [ ] **1.2** Fork `lib/memo.ts` — custom memoization utility
- [ ] **1.3** Fork `lib/helpers.ts` — `getColumn`, `createNumberFilterValue`, `createBigIntFilterValue`, `createDateFilterValue`, `createDateRange`, `createNumberRange`, `createBigIntRange`, `isColumnOption`, `isColumnOptionArray`, `isStringArray`, `isColumnOptionMap`, `isMinMaxTuple`, `getValidNumber`, `isValidNumber`, `getValidBigInt`
  - Do NOT port `filterRow`/`filterData` yet — these will be rewritten in Phase 2 to use OperatorSet
- [ ] **1.4** Fork `lib/order-fns.ts` — `orderFns` (`count`, `label`), `applyOrderFns`, type guards
- [ ] **1.5** Fork `lib/type-guards.ts` — `isColumnType`, `isTextColumn`, `isOptionColumn`, etc. + filter type guards
- [ ] **1.6** Fork `lib/i18n.ts` — `Locale` type, `t()` function, locale JSON files
- [ ] **1.7** Fork `core/types.ts` — all existing types, adapted:
  - `ColumnDataType` → `BuiltInColumnDataType | (string & {})` (extensible)
  - `FilterModel` → `type: string`, `operator: string`, `values: unknown[]` (loosened)
  - `ColumnConfig` → add `operators?: OperatorSet`, `sortable?: boolean`, `defaultSortDirection?: SortDirection`, `normalizeValues?`, `columnType?: ColumnType`
  - `icon` → `unknown` (not React-specific)
  - Add sort types: `SortDirection`, `ColumnSort`, `CustomSort`, `SortRule`, `SortState`, `CustomSortConfig`
  - Add `DataViewState` type
  - Add new action interfaces: `FilterActions`, `SortActions`, `ViewActions`, `BatchActions`
  - Add `DataViewOptions`, `DataViewInstance`, `DataViewStateUpdaterFn`
  - Remove `FilterOperators` mapped type (operators are now strings)
  - Remove per-type operator union types (`TextFilterOperator`, etc.)
- [ ] **1.8** Fork `core/columns/column-data-service.ts` — `ColumnDataService` class (unchanged)
- [ ] **1.9** Fork `core/columns/column-factory.ts` — `createColumns`, `createColumn` (unchanged)
- [ ] **1.10** Update all import paths to use `.js` extensions (verbatimModuleSyntax)
- [ ] **1.11** Port existing array/order-fns tests
- [ ] **1.12** Verify: `bun run build && bun run type-check && bun run test`

### Notes

- `core/operators.ts` (the current one with `DEFAULT_OPERATORS`, `filterTypeOperatorDetails`, `determineNewOperator`) is NOT forked directly — it gets rewritten in Phase 2
- `core/filters.ts` (the current `filterOperations`) is NOT forked directly — it gets rewritten in Phase 2
- `lib/filter-fns.ts` is NOT forked — match functions move onto `OperatorDefinition` in Phase 2
- TanStack Table integration is NOT forked

---

## Phase 2: Operator System

> Fully customizable operator definitions with composition API.
> Replaces the hard-coded operator constants + per-type filter functions.

### Types

```typescript
interface OperatorDefinition {
  id: string
  label: string
  i18nKey?: string
  target: 'single' | 'multiple'
  match?: (cellValue: any, filterValues: any[]) => boolean
  plural?: string       // Transition: 1 → 2+ values
  singular?: string     // Transition: 2+ → 1 values
}

type OperatorDefinitionInput = Omit<OperatorDefinition, 'id'>

class OperatorSet<TId extends string = string> {
  get(id: TId): OperatorDefinition
  all(): OperatorDefinition[]
  ids(): TId[]
  has(id: string): boolean
  getDefault(target: 'single' | 'multiple'): OperatorDefinition

  only<K extends TId>(...ids: K[]): OperatorSet<K>
  without<K extends TId>(...ids: K[]): OperatorSet<Exclude<TId, K>>
  extend<NewId extends string>(defs: Record<NewId, OperatorDefinitionInput>): OperatorSet<TId | NewId>
  replace(id: TId, overrides: Partial<OperatorDefinitionInput>): OperatorSet<TId>
  defaults(config: { single?: TId; multiple?: TId }): OperatorSet<TId>
}

function defineOperators<TId extends string>(
  definitions: Record<TId, OperatorDefinitionInput>,
  config?: { defaultSingle?: TId; defaultMultiple?: TId }
): OperatorSet<TId>
```

### Tasks

- [ ] **2.1** Implement `OperatorSet` class in `core/operator-set.ts`
  - Constructor takes `Map<TId, OperatorDefinition>` + default config
  - All composition methods return new instances (immutable)
  - `getDefault()` auto-selects first single/multiple operator if not explicitly set
  - Validate `plural`/`singular` references point to operators that exist in the set
- [ ] **2.2** Implement `defineOperators()` factory
  - Takes a `Record<TId, OperatorDefinitionInput>`, injects `id` from keys
  - Optional `defaultSingle`/`defaultMultiple` config
  - Returns `OperatorSet<TId>`
- [ ] **2.3** Create default operator sets in `core/operator-sets.ts`
  - `textOperators`: `contains`, `does not contain` — port match logic from current `textFilterFn`
  - `optionOperators`: `is`, `is not`, `is any of`, `is none of` — port from `optionFilterFn`
  - `multiOptionOperators`: `include`, `exclude`, `include any of`, `include all of`, `exclude if any of`, `exclude if all` — port from `multiOptionFilterFn`
  - `numberOperators`: `is`, `is not`, `is greater than`, `is greater than or equal to`, `is less than`, `is less than or equal to`, `is between`, `is not between` — port from `numberFilterFn`
  - `bigIntOperators`: same operators as number, bigint-specific match — port from `bigIntFilterFn`
  - `dateOperators`: `is`, `is not`, `is before`, `is on or after`, `is after`, `is on or before`, `is between`, `is not between` — port from `dateFilterFn`
  - `booleanOperators`: `is`, `is not` — port from `booleanFilterFn`
  - Each operator has `i18nKey`, `target`, `match`, `plural`/`singular` relationships
  - Export `defaultOperatorSets: Record<BuiltInColumnDataType, OperatorSet>`
- [ ] **2.4** Implement `getOperatorSet()` and `determineNewOperator()` in `core/operators.ts`
  - `getOperatorSet(column)`: returns `column.operators ?? defaultOperatorSets[column.type]`
  - `determineNewOperator(operatorSet, oldVals, nextVals, currentOp)`: reads `plural`/`singular` from the set
- [ ] **2.5** Rewrite `core/filters.ts` — pure filter operations using OperatorSet
  - `addFilterValue`: use `getOperatorSet(column).getDefault()` for initial operator
  - `setFilterValue`: use `column.normalizeValues?.()` instead of type switch
  - `determineNewOperator` uses operator set, not global lookup
  - `removeFilterValue`, `setFilterOperator`, `removeFilter`, `removeAllFilters` adapted
- [ ] **2.6** Rewrite `filterRow`/`filterData` in `lib/helpers.ts`
  - Use `operatorSet.get(filter.operator).match()` — no per-type switch statement
- [ ] **2.7** Tests: `operator-set.test.ts`
  - Construction via `defineOperators`
  - `.get()`, `.all()`, `.ids()`, `.has()`, `.getDefault()`
  - `.only()`: restricts to specified operators, type narrows
  - `.without()`: removes specified operators
  - `.extend()`: adds new operators, preserves existing
  - `.replace()`: overrides properties of existing operator
  - `.defaults()`: changes default single/multiple
  - Chaining: `.without(...).extend(...).defaults(...)`
  - Error cases: `.get()` with unknown id, `.only()` with invalid id
- [ ] **2.8** Tests: `operator-sets.test.ts`
  - Port ALL existing filter function tests as match function tests
  - Every default operator's `match` function tested with edge cases
  - Verify `plural`/`singular` relationships are consistent
  - Verify `target` assignments are correct
  - Verify `i18nKey` is set for every operator
- [ ] **2.9** Tests: `filter-operations.test.ts`
  - Port relevant tests from `data-table-filters.test.tsx` (filter operations only)
  - Test `addFilterValue`, `removeFilterValue`, `setFilterValue`, `setFilterOperator`, `removeFilter`, `removeAllFilters`
  - Test operator auto-transitions via `determineNewOperator`
  - Test with default operator sets
  - Test with custom operator sets
- [ ] **2.10** Verify: `bun run build && bun run type-check && bun run test`

---

## Phase 3: Column Types + Column Builder

> Extensible data type system + builder with `.sortable()`, `.operators()`, `.custom()`.

### Types

```typescript
interface ColumnTypeConfig<TValue = unknown> {
  id: string
  operators: OperatorSet
  normalizeValues?: (values: TValue[]) => TValue[]
  serialize?: (value: TValue) => unknown
  deserialize?: (raw: unknown) => TValue
}

interface ColumnType<TValue = unknown> {
  id: string
  operators: OperatorSet
  normalizeValues: (values: TValue[]) => TValue[]
  serialize?: (value: TValue) => unknown
  deserialize?: (raw: unknown) => TValue
}

function defineColumnType<TValue>(config: ColumnTypeConfig<TValue>): ColumnType<TValue>
```

### Tasks

- [ ] **3.1** Implement `ColumnType` + `defineColumnType()` in `core/column-types.ts`
  - `normalizeValues` defaults to identity function if not provided
- [ ] **3.2** Create 7 built-in column types
  - `textType`: operators = `textOperators`, no normalization, no serialization
  - `numberType`: operators = `numberOperators`, normalizeValues = number range sorting
  - `bigIntType`: operators = `bigIntOperators`, normalizeValues = bigint range sorting, serialize/deserialize for BigInt
  - `dateType`: operators = `dateOperators`, normalizeValues = date range sorting, serialize/deserialize for Date
  - `booleanType`: operators = `booleanOperators`
  - `optionType`: operators = `optionOperators`
  - `multiOptionType`: operators = `multiOptionOperators`
  - Export `builtInColumnTypes: Record<BuiltInColumnDataType, ColumnType>`
- [ ] **3.3** Refactor `ColumnBuilder` (rename from `ColumnConfigBuilder`)
  - Rename class: `ColumnConfigBuilder` → `ColumnBuilder`
  - Rename factory: `createColumnConfigHelper` → `createColumnBuilder`
  - Rename interface: `FluentColumnConfigHelper` → `FluentColumnBuilder`
- [ ] **3.4** Add `.sortable()` method (immutable clone)
  - `sortable(options?: { default?: { direction: SortDirection } }): ColumnBuilder<...>`
  - Sets `config.sortable = true`
  - Optionally sets `config.defaultSortDirection`
  - Available on all column types
- [ ] **3.5** Add `.operators()` method (immutable clone)
  - `operators(set: OperatorSet): ColumnBuilder<...>`
  - Stores `OperatorSet` on `config.operators`
  - Available on all column types
- [ ] **3.6** Add `.custom()` on `FluentColumnBuilder`
  - `custom<TValue>(type: ColumnType<TValue>): ColumnBuilder<TData, string, TValue>`
  - Sets `config.type = type.id`
  - Sets `config.operators = type.operators`
  - Sets `config.normalizeValues = type.normalizeValues`
  - Sets `config.columnType = type`
  - Returns builder with general methods only
- [ ] **3.7** Wire built-in builder methods to set `columnType`
  - `.text()` sets `columnType = textType`, `.number()` sets `columnType = numberType`, etc.
  - This ensures `normalizeValues` and `serialize`/`deserialize` are automatically set
- [ ] **3.8** Tests: `column-types.test.ts`
  - `defineColumnType`: creates ColumnType with correct defaults
  - Built-in types: verify operators, normalizeValues, serialize/deserialize
  - Custom type: create, verify, use through builder
- [ ] **3.9** Tests: `column-builder.test.ts`
  - `.sortable()`: sets config correctly, immutable
  - `.sortable({ default: { direction: 'desc' } })`: sets default direction
  - `.operators()`: accepts OperatorSet, stores on config, immutable
  - `.operators()` override: calling after `.custom()` overrides type's default
  - `.custom()`: correct TVal inference, type-specific methods unavailable
  - Chaining: `.custom(currencyType).id('price').sortable().operators(customOps).build()`
  - Existing methods still work: `.text()`, `.option()`, `.min()`, `.max()`, etc.
- [ ] **3.10** Verify: `bun run build && bun run type-check && bun run test`

---

## Phase 4: Sort + View Operations

> Pure state operations for sort and view management.

### Sort Operations (`core/sort.ts`)

```typescript
const sortOperations = {
  toggleColumnSort(sort: SortState, columnId: string): SortState
  // Cycle: none → desc → asc → none
  // Preserves custom sorts in array

  setCustomSort(sort: SortState, id: string, enabled: boolean): SortState
  // enabled: add/update. disabled: remove.

  setSort(newSort: SortState): SortState
  // Full replacement

  clearSort(): SortState
  // Returns []
}
```

### View Operations (`core/view.ts`)

```typescript
const viewOperations = {
  load(view: DataViewState): DataViewState
  snapshot(current: DataViewState, meta?: { id?: string; name?: string }): DataViewState
  reset(defaultView?: DataViewState): DataViewState
  merge(current: DataViewState, partial: Partial<DataViewState>): DataViewState
}
```

### Tasks

- [ ] **4.1** Implement `sortOperations` in `core/sort.ts`
  - `toggleColumnSort`: find existing ColumnSort → cycle direction → update/add/remove
  - `setCustomSort`: find existing CustomSort → update enabled or add/remove
  - `setSort`: identity (return newSort)
  - `clearSort`: return `[]`
- [ ] **4.2** Implement `viewOperations` in `core/view.ts`
  - `load`: return view as-is
  - `snapshot`: spread current + meta, return new object
  - `reset`: return defaultView or `{ filters: [], sort: [] }`
  - `merge`: replace `filters`/`sort` if provided, preserve if omitted; update `id`/`name` if provided
- [ ] **4.3** Tests: `sort.test.ts`
  - `toggleColumnSort`: none → desc, desc → asc, asc → none
  - `toggleColumnSort`: preserves custom sorts in array
  - `toggleColumnSort`: multi-column (add second column sort)
  - `setCustomSort`: add, update, remove
  - `setCustomSort`: preserves column sorts
  - `setSort`: full replacement
  - `clearSort`: returns empty array
- [ ] **4.4** Tests: `view.test.ts`
  - `load`: returns provided view
  - `snapshot`: captures state with optional metadata
  - `reset`: with default view, without default view
  - `merge`: filters only, sort only, both, id/name, preserves unspecified
  - `merge`: does NOT deep-merge filters array (replaces entirely)
- [ ] **4.5** Verify: `bun run build && bun run type-check && bun run test`

---

## Phase 5: `useDataView` Hook

> Main React hook managing unified `DataViewState`.
> Lives in `src/react/use-data-view.ts`.

### Signature

```typescript
function useDataView<TData, TColumns, TStrategy, TContext>(
  options: DataViewOptions<TData, TColumns, TStrategy, TContext>
): DataViewInstance<TData, TStrategy, TContext>
```

### Internal State

Single `DataViewState` atom. Filter/sort actions are convenience wrappers over `setView`.

### Tasks

- [ ] **5.1** Implement `useDataView` hook
  - Internal state: `useState<DataViewState>(defaultView ?? { filters: [], sort: [] })`
  - Controlled/uncontrolled detection (same pattern as `useDataTableFilters`)
  - `onViewChange` handler detection: `length <= 1` → dispatch, `length > 1` → custom handler
  - `setView` callback with context support
- [ ] **5.2** Implement `filterActions` on instance
  - `addFilterValue`, `removeFilterValue`, `setFilterValue`, `setFilterOperator`, `removeFilter`, `removeAllFilters`
  - Each wraps `setView` targeting `view.filters` via `filterOperations`
- [ ] **5.3** Implement `sortActions` on instance
  - `setSort`, `toggleColumnSort`, `setCustomSort`, `clearSort`
  - Each wraps `setView` targeting `view.sort` via `sortOperations`
- [ ] **5.4** Implement `viewActions` on instance
  - `load`, `snapshot`, `reset`, `merge`
  - Each uses `viewOperations`
- [ ] **5.5** Implement unified `batch`
  - Single `setView` call, accumulates filter + sort operations
  - `BatchActions` type includes all filter + sort operations (without context param)
- [ ] **5.6** Column creation
  - `useMemo` converting `ColumnConfig[]` → `Column[]` via `createColumns`
  - Inject `options`, `faceted` data (same as current hook)
  - Inject `operators` from ColumnConfig or default for type
  - Inject `normalizeValues` from ColumnConfig or ColumnType
- [ ] **5.7** Implement `createTypedDataView<TContext>()` factory
- [ ] **5.8** Export from `src/react/index.ts`
- [ ] **5.9** Tests: `data-view.test.tsx` (jsdom environment)
  - Uncontrolled mode: default view, all action types
  - Controlled mode: dispatch handler
  - Controlled mode: custom handler with context
  - `filterActions`: all operations, operator auto-transitions
  - `sortActions`: toggle cycling, custom sorts, multi-column
  - `viewActions.load`: replaces entire state
  - `viewActions.snapshot`: captures state
  - `viewActions.reset`: with/without default
  - `viewActions.merge`: partial updates
  - Unified `batch`: atomic filter + sort, single render
  - Column creation: operator set from config, default from type
  - Custom column types through the hook
  - Edge cases: empty state, double-controlled error
- [ ] **5.10** Verify: `bun run build && bun run type-check && bun run test`

---

## Phase 6: Serialization

> `serializeView` / `deserializeView` with custom type support.

### Tasks

- [ ] **6.1** Implement `serializeView` in `lib/serialize.ts`
  - Convert `DataViewState` to URL-safe base64 string
  - Use `columnTypes` map to call `serialize()` on filter values
  - Built-in types: Date → ISO string, BigInt → string
  - Handle `encodeURIComponent`/`decodeURIComponent` for URL safety
- [ ] **6.2** Implement `deserializeView` in `lib/serialize.ts`
  - Reverse of serialize
  - Use `columnTypes` map to call `deserialize()` on filter values
  - Built-in types: ISO string → Date, string → BigInt
  - Graceful error handling for malformed input
- [ ] **6.3** Export `builtInColumnTypes` map for convenience
- [ ] **6.4** Tests: `serialize.test.ts`
  - Round-trip with all built-in filter types
  - Date values survive serialization
  - BigInt values survive serialization
  - Custom column types with serialize/deserialize
  - Empty views
  - Views with sort state
  - Views with id/name metadata
  - Malformed input handling
- [ ] **6.5** Verify: `bun run build && bun run type-check && bun run test`

---

## Phase 7: Integration + Polish

> Final quality checks and cleanup.

### Tasks

- [ ] **7.1** Complete barrel exports in `src/index.ts` (core)
- [ ] **7.2** Complete barrel exports in `src/react/index.ts`
- [ ] **7.3** Run `bun run check:fix` (Biome lint + format)
- [ ] **7.4** Run full test suite from monorepo root: `bun run test`
- [ ] **7.5** Run full build from monorepo root: `bun run build`
- [ ] **7.6** Run type-check from monorepo root: `bun run type-check`
- [ ] **7.7** Verify tree-shaking: importing from `@bazza-ui/data-view` does not pull in React
- [ ] **7.8** Add changeset for initial version

---

## Out of Scope

- `<Filter />` component updates (separate effort)
- TanStack Table integration
- Documentation site updates
- Migration guide from `@bazza-ui/filters`
- i18n additions for sort-related UI strings

---

## Consumer Usage Examples

### Basic (React)

```typescript
import {
  useDataView,
  createColumnBuilder,
  textOperators,
} from '@bazza-ui/data-view/react'

type Issue = { title: string; status: string; createdAt: Date }

const cb = createColumnBuilder<Issue>()

const columns = [
  cb.text().id('title').accessor((r) => r.title).displayName('Title')
    .sortable().build(),
  cb.option().id('status').accessor((r) => r.status).displayName('Status')
    .options([...]).operators(optionOperators.only('is', 'is any of')).build(),
  cb.date().id('createdAt').accessor((r) => r.createdAt).displayName('Created')
    .sortable({ default: { direction: 'desc' } }).build(),
] as const

const instance = useDataView({
  strategy: 'client',
  data: issues,
  columnsConfig: columns,
  defaultView: {
    filters: [],
    sort: [{ type: 'column', columnId: 'createdAt', direction: 'desc' }],
  },
})

// instance.filters, instance.sort, instance.view
// instance.filterActions.addFilterValue(...)
// instance.sortActions.toggleColumnSort('title')
// instance.viewActions.snapshot({ name: 'My saved view' })
// instance.batch((actions) => { actions.removeAllFilters(); actions.clearSort() })
```

### Custom Operators

```typescript
import { textOperators } from '@bazza-ui/data-view'

const extendedTextOps = textOperators.extend({
  'starts with': {
    label: 'starts with',
    target: 'single',
    match: (cell, [query]) => cell.toLowerCase().startsWith(query.toLowerCase()),
  },
})

cb.text().id('name').accessor((r) => r.name).displayName('Name')
  .operators(extendedTextOps).build()
```

### Custom Data Type

```typescript
import { defineColumnType, defineOperators } from '@bazza-ui/data-view'

const currencyType = defineColumnType<{ amount: number; currency: string }>({
  id: 'currency',
  operators: defineOperators({
    'equals': {
      label: 'equals',
      target: 'single',
      match: (cell, [val]) => cell.amount === val.amount && cell.currency === val.currency,
    },
    'is greater than': {
      label: 'is greater than',
      target: 'single',
      match: (cell, [val]) => cell.amount > val.amount,
    },
  }),
  serialize: (v) => ({ a: v.amount, c: v.currency }),
  deserialize: (raw: any) => ({ amount: raw.a, currency: raw.c }),
})

cb.custom(currencyType).id('price').accessor((r) => r.price).displayName('Price').build()
```

### Server-side (Non-React)

```typescript
import { filterOperations, sortOperations, serializeView } from '@bazza-ui/data-view'

// Pure state operations — no React needed
const filters = filterOperations.addFilterValue([], column, ['active'])
const sort = sortOperations.toggleColumnSort([], 'createdAt')
const encoded = serializeView({ filters, sort })
// Send `encoded` to the server as a query param
```
