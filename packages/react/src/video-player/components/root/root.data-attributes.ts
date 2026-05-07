export enum RootDataAttributes {
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
  /** Applied when the audio is muted. */
  muted = 'data-muted',
  /** Applied when the player is idle (no user interaction). */
  idle = 'data-idle',
}
