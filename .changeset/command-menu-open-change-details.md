---
'@bazza-ui/react': minor
---

`CommandMenu.Root`'s `onOpenChange` is now typed with its event details, which it already received: `(open, eventDetails: CommandMenu.Root.ChangeEventDetails) => void`, with the reason (`'imperative-action'` for the `hotkey`, `'escape-key'`, `'outside-press'`, …) and `cancel()` to keep the menu as it is. Handlers that only read `open` still work. The types are exported as `CommandMenuOpenChangeEventDetails` and `CommandMenuOpenChangeReason`.

Add `getDismissExemptElements` to `CommandMenu.Root`: elements outside the menu whose press, or focus moving to them, doesn't close it, read when the event happens. It applies to non-modal menus (`modal={false}`); a modal menu's backdrop takes presses outside it.
