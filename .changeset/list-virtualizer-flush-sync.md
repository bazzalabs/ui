---
'@bazza-ui/react': patch
---

`useListVirtualizer`: stop forcing `useFlushSync: false` — scroll-driven range changes now flush synchronously (react-virtual's default), eliminating blank-window flashes during fast scrolling. New `useFlushSync` option as an escape hatch.
