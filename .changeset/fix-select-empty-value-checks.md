---
"@bazza-ui/react": patch
---

Fix `Select.Value` treating falsy-but-valid values (`0`, `false`, `''`) as empty and showing the placeholder. Select now uses a shared `isValueEmpty` helper so `Select.Value`, `Select.Trigger`, and `Select.Surface` agree on what counts as an empty selection, matching `Combobox`.
