---
"@bazza-ui/react": patch
---

Replace `DataList` children-as-function render prop with normal children and a
`useDataList()` hook. List content now lives in child components that call
`useDataList()`. This is a breaking change to the `DataList` API.
