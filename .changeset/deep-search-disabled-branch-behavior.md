---
'@bazza-ui/react': minor
---

Add `disabledBranchBehavior` to `DeepSearchConfig` (`'exclude' | 'inherit'`, default `'exclude'`) for choosing how descendants of a disabled submenu or subpage participate in deep search. By default they are left out of results while the disabled trigger still appears; `'inherit'` shows them as disabled, non-selectable deep results instead. An explicit `includeInDeepSearch` on the branch def always takes precedence.
