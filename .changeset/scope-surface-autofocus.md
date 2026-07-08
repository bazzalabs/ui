---
"@bazza-ui/react": patch
---

Menu auto-focus (surface open and keyboard submenu open) now targets only the library's own Input part (via `data-popup-menu-input`) instead of any `<input>` inside the popup, so custom inputs rendered by consumers can no longer hijack initial focus.
