export enum MuteButtonDataAttributes {
  /** Applied when explicitly muted via toggle. */
  muted = 'data-muted',
  /** Applied when either muted or volume === 0. */
  volumeOff = 'data-volume-off',
  /** Applied when volume > 0 and not muted. */
  volumeOn = 'data-volume-on',
  /** Applied when not muted and volume < 0.5. */
  volumeLow = 'data-volume-low',
  /** Applied when not muted and volume >= 0.5. */
  volumeHigh = 'data-volume-high',
}
