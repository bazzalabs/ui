---
"@bazza-ui/react": patch
---

Fix `VideoPlayer.SeekSlider` not seeking on click or drag when `SeekSliderThumb` is drawn with `render`. The thumb's render prop replaced Base UI's ref with the forwarded one, so the slider never registered the thumb and ignored pointer presses. `SeekSlider`, `SeekSliderTrack`, `SeekSliderProgress`, `SeekSliderThumb` and `VolumeSlider` also keep their JSX children when drawn with `render`; they used to drop them. The `ref` in `SeekSliderTrack`, `SeekSliderProgress` and `SeekSliderThumb` render props is now optional, which matches what Base UI passes.
