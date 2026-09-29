---
'@bazza-ui/react': patch
---

`VideoPlayer.VolumeSlider`, `VideoPlayer.SeekSlider`, `VideoPlayer.SeekSliderTrack`, `VideoPlayer.SeekSliderProgress` and `VideoPlayer.SeekSliderThumb` now pass their other props (such as `className`, `disabled` and `data-*` attributes) to the element when a `render` function is given. They were dropped before.
