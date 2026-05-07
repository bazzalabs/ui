// ============================================================================
// VideoPlayer - Main Entry Point
// ============================================================================
//
// Usage:
// import { VideoPlayer, type VideoPlayerRootProps } from '@bazza-ui/react/video-player'
//
// <VideoPlayer.Root>
//   <VideoPlayer.Video src="..." />
//   <VideoPlayer.Controls>
//     <VideoPlayer.PlayButton />
//     <VideoPlayer.SeekSlider />
//   </VideoPlayer.Controls>
// </VideoPlayer.Root>
//

export type { VideoPlayerRootState } from './components/root/root.js'
// Hook (also available via VideoPlayer.useVideoPlayer)
export { useVideoPlayer } from './hooks/use-video-player.js'
// Namespace export
export * as VideoPlayer from './index.parts.js'
// Types
export type {
  PlaybackIntent,
  PlaybackStatus,
  RenderProp,
  VideoPlayerActions,
  VideoPlayerContextValue,
  VideoPlayerExternalActions,
  VideoPlayerRootProps,
  VideoPlayerState,
  VideoQuality,
  VideoTextTrack,
} from './types.js'
