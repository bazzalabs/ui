---
'@bazza-ui/react': patch
---

Toggling a checkbox item through its indicator (`CheckboxItemIndicator`'s `state.toggle()`) now sets the range selection anchor, so a later shift-click ranges from that item.
