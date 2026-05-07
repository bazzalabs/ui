export enum OverlayDataAttributes {
  /** Applied when the overlay is visible. */
  open = 'data-open',
  /** Applied when the overlay is hidden. */
  closed = 'data-closed',
  /** Applied when the video is playing. */
  playing = 'data-playing',
  /** Applied when the video is paused. */
  paused = 'data-paused',
  /** Applied when the video has ended. */
  ended = 'data-ended',
  /** Applied when the video is buffering/loading. */
  waiting = 'data-waiting',
  /** Applied when the video is seeking to a new position. */
  seeking = 'data-seeking',
  /** Applied when the player is in fullscreen mode. */
  fullscreen = 'data-fullscreen',
  /** Applied when the video is in picture-in-picture mode. */
  pip = 'data-pip',
  /** Applied on the first frame when entering. Use for CSS enter animations. */
  startingStyle = 'data-starting-style',
  /** Applied during exit animation. Use for CSS exit animations. */
  endingStyle = 'data-ending-style',
}
