---
"@bazza-ui/react": minor
---

Support a clearable `null` item in `Select` and `Combobox` (Base UI parity). Rendering `<Select.Item value={null}>` (or describing it via `items` as `{ value: null, label }`) adds an option that clears the selection when chosen; its label is used as the trigger/input placeholder, and it shows as selected while there is no value. `Select.Item`/`Combobox.Item` now accept `value={null}`, and `onValueChange` may receive `null` when the selection is cleared.
