---
"@bazza-ui/registry-filters": minor
---

Improved type safety across filter components using type guards from `@bazza-ui/filters`:

- `filter-menu.tsx`: Replaced string comparisons with type guards (`isTextColumn`, `isOptionColumn`, etc.) and added proper type predicates for filter finding
- `filter-operator.tsx`: Replaced switch statement with type guards for consistency
- `filter-subject.tsx`: Now uses `isBooleanColumn` type guard
- `filter-value-number-controller.tsx`: Removed `as any` casts by creating a typed wrapper for debounced callbacks
- `option-menu.ts` / `multi-option-menu.ts`: Replaced `any` types with proper interfaces (`CreateOptionMenuProps`, `CreateOptionMenuResult`, etc.)
- `text-menu.ts`: Created `TextFilterItemData` interface instead of incomplete `FilterModel<'text'>` casts
- Added new type exports for menu creation utilities
