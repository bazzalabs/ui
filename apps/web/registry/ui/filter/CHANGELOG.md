# @bazza-ui/registry-filters

## 0.2.0-canary.3

### Minor Changes

- [#222](https://github.com/bazzalabs/ui/pull/222) [`5f47618`](https://github.com/bazzalabs/ui/commit/5f476182eda80b46083e6ccb0d8a58bd060795b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Change `Filter.ClearAll` button to `outline` variant, use custom icon

- [#222](https://github.com/bazzalabs/ui/pull/222) [`5f47618`](https://github.com/bazzalabs/ui/commit/5f476182eda80b46083e6ccb0d8a58bd060795b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Improved composability of Filter item components. Child components (`Filter.Subject`, `Filter.Operator`, `Filter.Value`, `Filter.Remove`) now auto-consume `filter`, `column`, `actions`, `strategy`, `locale`, and `entityName` from `FilterItemContext` when used inside `Filter.Item`, eliminating the need to pass these props explicitly.

  **Before:**

  ```tsx
  <Filter.Item filter={filter} column={column}>
    <Filter.Subject column={column} />
    <Filter.Operator filter={filter} column={column} actions={actions} />
    <Filter.Value
      filter={filter}
      column={column}
      actions={actions}
      strategy={strategy}
    />
    <Filter.Remove filter={filter} actions={actions} />
  </Filter.Item>
  ```

  **After:**

  ```tsx
  <Filter.Item filter={filter} column={column}>
    <Filter.Subject />
    <Filter.Operator />
    <Filter.Value />
    <Filter.Remove />
  </Filter.Item>
  ```

  Props can still be passed explicitly to override context values or when using components standalone.

- [#222](https://github.com/bazzalabs/ui/pull/222) [`5f47618`](https://github.com/bazzalabs/ui/commit/5f476182eda80b46083e6ccb0d8a58bd060795b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Reduced border radius for `default` variant `Filter.Item` from `rounded-2xl` to `rounded-md` to match button radius

- [#222](https://github.com/bazzalabs/ui/pull/222) [`5f47618`](https://github.com/bazzalabs/ui/commit/5f476182eda80b46083e6ccb0d8a58bd060795b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Added border between `Filter.Item` sub-components

- [#222](https://github.com/bazzalabs/ui/pull/222) [`5f47618`](https://github.com/bazzalabs/ui/commit/5f476182eda80b46083e6ccb0d8a58bd060795b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Uncoupled `Filter.Root` from `Filter.Provider`. Users must now wrap their filter component with `Filter.Provider` and pass their filter instance context to the provider directly, instead of through the root component.

- [#222](https://github.com/bazzalabs/ui/pull/222) [`5f47618`](https://github.com/bazzalabs/ui/commit/5f476182eda80b46083e6ccb0d8a58bd060795b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Rename `Filter.Block` to `Filter.Item` for clarity and design-agnostic name.

### Patch Changes

- [#226](https://github.com/bazzalabs/ui/pull/226) [`7672bbe`](https://github.com/bazzalabs/ui/commit/7672bbe8ad5ceba94bfdd001cad9da5982758281) Thanks [@kianbazza](https://github.com/kianbazza)! - Resolved an issue where checking/unchecking options in option/multi-option menus would update the filter state but would not update the UI (e.g. item checkbox does not change)

- [#222](https://github.com/bazzalabs/ui/pull/222) [`5f47618`](https://github.com/bazzalabs/ui/commit/5f476182eda80b46083e6ccb0d8a58bd060795b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix spacing issues for `Filter.Subject` and `Filter.Value` display components

- [#222](https://github.com/bazzalabs/ui/pull/222) [`5f47618`](https://github.com/bazzalabs/ui/commit/5f476182eda80b46083e6ccb0d8a58bd060795b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Fixed height issue with `Filter.Subject`; it now fills the parent container's height

- [#222](https://github.com/bazzalabs/ui/pull/222) [`5f47618`](https://github.com/bazzalabs/ui/commit/5f476182eda80b46083e6ccb0d8a58bd060795b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Resolved text overflow issue when showing filter menu items for text columns

## 0.2.0-canary.2

### Minor Changes

- [#224](https://github.com/bazzalabs/ui/pull/224) [`6d2e230`](https://github.com/bazzalabs/ui/commit/6d2e2308938e445b16235c696f4d893126b2d324) Thanks [@kianbazza](https://github.com/kianbazza)! - Empty changeset -- testing versioning.

## 0.2.0-canary.1

### Minor Changes

- [#221](https://github.com/bazzalabs/ui/pull/221) [`328de23`](https://github.com/bazzalabs/ui/commit/328de233490337d303f10f0bca81dec5f086bc78) Thanks [@kianbazza](https://github.com/kianbazza)! - Empty changeset to test CI.

## 0.2.0-canary.0

### Minor Changes

- [#217](https://github.com/bazzalabs/ui/pull/217) [`0455c17`](https://github.com/bazzalabs/ui/commit/0455c176b2ef9cab40ed29dcb35fe58b4bb35804) Thanks [@kianbazza](https://github.com/kianbazza)! - - Removed the `<Filter />` compound component in favour of explicit composition by consumers.
  - Refactored and general cleanup
  - Cleaned up references to the old "DataTableFilters" name.

- [#219](https://github.com/bazzalabs/ui/pull/219) [`16cea15`](https://github.com/bazzalabs/ui/commit/16cea15838b46cb6f087bd5854e7c1b60f62c6a6) Thanks [@kianbazza](https://github.com/kianbazza)! - Improved type safety across filter components using type guards from `@bazza-ui/filters`:
  - `filter-menu.tsx`: Replaced string comparisons with type guards (`isTextColumn`, `isOptionColumn`, etc.) and added proper type predicates for filter finding
  - `filter-operator.tsx`: Replaced switch statement with type guards for consistency
  - `filter-subject.tsx`: Now uses `isBooleanColumn` type guard
  - `filter-value-number-controller.tsx`: Removed `as any` casts by creating a typed wrapper for debounced callbacks
  - `option-menu.ts` / `multi-option-menu.ts`: Replaced `any` types with proper interfaces (`CreateOptionMenuProps`, `CreateOptionMenuResult`, etc.)
  - `text-menu.ts`: Created `TextFilterItemData` interface instead of incomplete `FilterModel<'text'>` casts
  - Added new type exports for menu creation utilities
