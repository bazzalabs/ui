# @bazza-ui/registry-filters

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
