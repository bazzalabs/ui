---
"@bazza-ui/react": minor
---

Add `Header` and `Footer` focus-zone parts to DropdownMenu and ContextMenu. Zones let you place custom interactive content above/below the item list with correct focus management: Tab/Shift+Tab move between the search input/list and zones, arrow keys rove within a zone, ArrowUp/ArrowDown at zone boundaries re-enter the list, and Escape closes the menu. The list exposes `data-zone-focused` while a zone holds focus so the preserved item highlight can be dimmed via CSS.
