---
"@bazza-ui/react": patch
"@bazza-ui/filters": patch
---

Build with `tsdown` instead of `tsup`.

- Fixes the CommonJS entry points of `@bazza-ui/react`. `require('@bazza-ui/react/dropdown-menu')` and six other subpaths threw `SyntaxError: Unexpected token ','` because a shared chunk did not parse.
- `@bazza-ui/react` no longer ships `.d.cts` files. Types still resolve through the same `.d.ts` files for both `import` and `require`.
- `@bazza-ui/filters/tanstack-table` now also exports the `CreateTSTColumns` type, the parameter type of `createTSTColumns`.
- The published JavaScript is smaller. Runtime exports are unchanged.
