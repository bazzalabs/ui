# The suggestion menu is its own menu family member, not a DropdownMenu mode

A suggestion menu takes its query from a host input it doesn't own, and DOM focus never leaves that host. We ship it as a new member of the menu family, `SuggestionMenu`, a thin shell over the popup-menu engine in the same shape as CommandMenu. It is not a host-focus mode on `DropdownMenu`. The engine needs the same changes either way: a generic "the popup doesn't take focus" flag, exempting the host from outside-press, a non-modal path, and a public way to forward key presses. So a mode would save only a few hundred lines of shell. In return, about half of DropdownMenu's interface would become conditionally invalid in that mode, and every DropdownMenu and ContextMenu user would have to learn those rules.

## Considered Options

- **A host-focus mode on `DropdownMenu.Root`**: no new namespace, but `modal`, `Trigger`, `Input`, `Submenu`, focus zones and Tab, item `shortcut`, and the meaning of `closeOnOutsidePress` all become "valid unless in host mode". Changes to the mode also risk DropdownMenu and ContextMenu, which share its root.
- **Letting `Combobox` accept an external input**: the closest focus model, since focus already stays in its input. But most of Combobox is committed-value state (selection, hidden form inputs, item equality) that a suggestion menu doesn't have, and its `Input` is an element it renders, where a host input is foreign DOM.

## Consequences

The engine's "don't take focus" behaviour, which today checks for Combobox's context by name, becomes a generic flag that Combobox and SuggestionMenu both set. This also removes the engine's import of a member's module.
