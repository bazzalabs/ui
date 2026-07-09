---
"@bazza-ui/react": patch
---

`Combobox.Clear` now forwards a consumer-provided `onPointerDown` handler instead of silently dropping it, while still preventing the button from stealing focus from the input.
