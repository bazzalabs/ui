// ============================================================================
// VideoPlayer Composable Parts
// ============================================================================
//
// Import like: import * as VideoPlayer from './video-player/index.parts.js'
//
// Usage:
// <VideoPlayer.Root>
//   <VideoPlayer.Video src="..." />
//   <VideoPlayer.Controls>
//     <VideoPlayer.PlayButton />
//     <VideoPlayer.SeekSlider />
//     <VideoPlayer.TimeDisplay />
//   </VideoPlayer.Controls>
// </VideoPlayer.Root>
//

export { BufferedIndicator } from './components/buffered-indicator/buffered-indicator.js'
export { CaptionsDataAttributes } from './components/captions/captions.data-attributes.js'
export { Captions } from './components/captions/captions.js'
// Captions
export { CaptionsButton } from './components/captions-button/captions-button.js'
export {
  CaptionsMenu,
  CaptionsMenuItem,
} from './components/captions-menu/captions-menu.js'
export { ControlsDataAttributes } from './components/controls/controls.data-attributes.js'
export { Controls } from './components/controls/controls.js'
// Display Controls
export { FullscreenButton } from './components/fullscreen-button/fullscreen-button.js'
export { MuteButton } from './components/mute-button/mute-button.js'
export { OverlayDataAttributes } from './components/overlay/overlay.data-attributes.js'
export { Overlay } from './components/overlay/overlay.js'
export { PictureInPictureButton } from './components/picture-in-picture-button/picture-in-picture-button.js'
// Playback Controls
export { PlayButton } from './components/play-button/play-button.js'
// Playback Rate
export { PlaybackRateButton } from './components/playback-rate-button/playback-rate-button.js'
export {
  PlaybackRateMenu,
  PlaybackRateMenuItem,
} from './components/playback-rate-menu/playback-rate-menu.js'
// Layout
export { Portal } from './components/portal/portal.js'
export { Poster } from './components/poster/poster.js'
// Quality
export {
  QualityMenu,
  QualityMenuItem,
} from './components/quality-menu/quality-menu.js'
// Data Attributes & CSS Variables
export { RootDataAttributes } from './components/root/root.data-attributes.js'
// Core
export { VideoPlayerRoot as Root } from './components/root/root.js'
export { SeekSliderCssVars } from './components/seek-slider/seek-slider.css-vars.js'
export { SeekSliderDataAttributes } from './components/seek-slider/seek-slider.data-attributes.js'
export {
  SeekSlider,
  SeekSliderBuffered,
  SeekSliderControl,
  SeekSliderHover,
  SeekSliderPreviewThumb,
  SeekSliderPreviewTooltip,
  SeekSliderPreviewTooltipPopup,
  SeekSliderPreviewTooltipPortal,
  SeekSliderPreviewTooltipPositioner,
  SeekSliderProgress,
  SeekSliderThumb,
  SeekSliderTrack,
} from './components/seek-slider/seek-slider.js'
export { SeekSliderPreviewThumbDataAttributes } from './components/seek-slider/seek-slider-preview-thumb.data-attributes.js'
export { ThumbnailDataAttributes } from './components/thumbnail/thumbnail.data-attributes.js'
export { Thumbnail } from './components/thumbnail/thumbnail.js'
export { TimeDisplayDataAttributes } from './components/time-display/time-display.data-attributes.js'
export { TimeDisplay } from './components/time-display/time-display.js'
export { Track } from './components/track/track.js'
export { Video } from './components/video/video.js'
export { VolumeSliderCssVars } from './components/volume-slider/volume-slider.css-vars.js'
export { VolumeSliderDataAttributes } from './components/volume-slider/volume-slider.data-attributes.js'
// Audio Controls
export {
  VolumeSlider,
  VolumeSliderControl,
  VolumeSliderRange,
  VolumeSliderThumb,
  VolumeSliderTrack,
} from './components/volume-slider/volume-slider.js'
export {
  type TransitionStatus,
  type UseTransitionStatusOptions,
  type UseTransitionStatusReturn,
  useTransitionStatus,
} from './hooks/use-transition-status.js'
// Hooks
export { useVideoPlayer } from './hooks/use-video-player.js'
// Types
export type {
  PlaybackIntent,
  PlaybackStatus,
  RenderProp,
  TrackInfo,
  VideoPlayerActions,
  VideoPlayerContextValue,
  VideoPlayerRootProps,
  VideoPlayerState,
  VideoQuality,
  VideoTextTrack,
} from './types.js'
