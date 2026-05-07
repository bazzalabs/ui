'use client'

import * as React from 'react'
import type { VideoPlayerContextValue } from '../types.js'

export const VideoPlayerContext =
  React.createContext<VideoPlayerContextValue | null>(null)

export function useVideoPlayerContext(
  component: string,
): VideoPlayerContextValue {
  const context = React.useContext(VideoPlayerContext)
  if (!context) {
    throw new Error(
      `<VideoPlayer.${component}> must be used within <VideoPlayer.Root>`,
    )
  }
  return context
}
