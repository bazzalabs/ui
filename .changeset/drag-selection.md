---
'@bazza-ui/react': minor
---

Add drag selection to the dropdown menu, context menu, and command menu. Set `dragSelection="keep"` or `dragSelection="rubber-band"` on the root, then press a checkbox item with a mouse or pen and drag across others to set them all to the pressed item's new state. Rows preview while dragging (`data-pending`) and commit once on release; Escape cancels.
