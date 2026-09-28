---
'@bazza-ui/react': patch
---

Fix function `className` and `style` props being ignored on most parts. Parts such as `Select.Trigger`, `Select.Item`, `Combobox.Input`, `DropdownMenu.Item`, `Kbd.Root` and the rest of the menu parts now call the function with the part's state and apply the result. Before, the function reached the DOM as-is: the element got no class and React logged a warning, and a function `style` threw in development. Positioners, `Backdrop`, `ContextMenu.Trigger` and the video player sliders no longer silently drop a function `style` when adding their own styles. `SeekSlider` also keeps its CSS variables when given a `style`.
