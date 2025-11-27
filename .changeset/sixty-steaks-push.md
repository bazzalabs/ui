---
"@bazza-ui/registry-filters": minor
---

Uncoupled `Filter.Root` from `Filter.Provider`. Users must now wrap their filter component with `Filter.Provider` and pass their filter instance context to the provider directly, instead of through the root component.
