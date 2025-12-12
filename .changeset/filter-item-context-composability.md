---
"@bazza-ui/registry-filters": minor
---

Improved composability of Filter item components. Child components (`Filter.Subject`, `Filter.Operator`, `Filter.Value`, `Filter.Remove`) now auto-consume `filter`, `column`, `actions`, `strategy`, `locale`, and `entityName` from `FilterItemContext` when used inside `Filter.Item`, eliminating the need to pass these props explicitly.

**Before:**
```tsx
<Filter.Item filter={filter} column={column}>
  <Filter.Subject column={column} />
  <Filter.Operator filter={filter} column={column} actions={actions} />
  <Filter.Value filter={filter} column={column} actions={actions} strategy={strategy} />
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
