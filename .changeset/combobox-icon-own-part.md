---
'@bazza-ui/react': patch
---

`Combobox.Icon` is now its own part, so only the combobox's icon toggles the popup and keeps focus in the input. Before, any menu icon rendered anywhere inside a `Combobox.Root` (for example a `DropdownMenu.Icon` nested in a combobox) picked up that behaviour, and a menu popup or list nested inside an `input-embedded` combobox was marked `data-input-embedded` too. `ComboboxIconProps` and `ComboboxIconState` now describe `Combobox.Icon` itself.
