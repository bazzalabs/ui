export enum SeekSliderPreviewThumbDataAttributes {
  /** Applied when the preview thumb is visible (hovering over slider). */
  open = 'data-open',
  /** Applied when the preview thumb is hidden (not hovering). */
  closed = 'data-closed',
  /** Applied on the first frame when entering. Use for CSS enter animations. */
  startingStyle = 'data-starting-style',
  /** Applied during exit animation. Use for CSS exit animations. */
  endingStyle = 'data-ending-style',
}
