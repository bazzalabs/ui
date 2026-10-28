---
'@bazza-ui/react': minor
---

Add `forceOrderMinScore` to data-first node defs (items, link items, tree items, radio and checkbox items, submenus, subpages). A row whose search score is below it sorts by score, as if it had no `forceOrder`, and still shows. Use it to lead with a row only when it matches well: with `forceOrder: -1, forceOrderMinScore: 0.5`, a "System" theme option leads for "sys" but no longer outranks "Settle" for "sett". `forceScore`, when set, is the score compared. Without it, `forceOrder` applies to every match as before.
