---
'@bazza-ui/react': patch
---

Menu, command menu, select, and combobox search now matches the words of a query in any order. A tree row shown as "Navattic › New project" is found by "navattic new" as well as "new navattic", and each word still matches fuzzily ("nav proj"). Single-word searches score and rank as before. `defaultFilter` carries the new behaviour; `commandScore` is unchanged.
