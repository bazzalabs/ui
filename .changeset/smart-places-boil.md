---
"@bazza-ui/select": minor
---

A light API redesign for the `Select` component:

- The compound component pattern is now required for `Select.Trigger` and `Select.Value`
- Moved form-related props to `Select.Root`
- Support a children function for `Select.Value` with access to the selected value + context
