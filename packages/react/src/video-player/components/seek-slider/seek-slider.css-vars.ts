export enum SeekSliderCssVars {
  /** Current playback progress as a percentage (e.g., "45%"). */
  progress = '--seek-progress',
  /** Buffered progress as a percentage (e.g., "80%"). */
  buffered = '--seek-buffered',
  /** Current playback time in seconds. */
  currentTime = '--seek-current-time',
  /** Total video duration in seconds. */
  duration = '--seek-duration',
  /** Hover position as a percentage (e.g., "60%"). Only set when hovering. */
  hoverProgress = '--seek-hover-progress',
  /** Hover time in seconds. Only set when hovering. */
  hoverTime = '--seek-hover-time',
}
