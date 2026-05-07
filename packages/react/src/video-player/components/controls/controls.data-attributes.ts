export enum ControlsDataAttributes {
  /** Applied when the controls are visible. */
  open = 'data-open',
  /** Applied when the controls are hidden. */
  closed = 'data-closed',
  /** Applied when the player is idle (no user interaction). */
  idle = 'data-idle',
  /** Applied when the video is playing. */
  playing = 'data-playing',
  /** Applied when the video is paused. */
  paused = 'data-paused',
  /** Applied when the video has ended. */
  ended = 'data-ended',
  /** Applied on the first frame when entering. Use for CSS enter animations. */
  startingStyle = 'data-starting-style',
  /** Applied during exit animation. Use for CSS exit animations. */
  endingStyle = 'data-ending-style',
}
