/** Styles that decide where text lands inside a text field. */
const MIRRORED_STYLES = [
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'fontFeatureSettings',
  'fontKerning',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'direction',
  'whiteSpace',
  'wordBreak',
  'overflowWrap',
  'hyphens',
  'fontVariationSettings',
] as const

/**
 * Measures where a character of a text field's value is drawn, in viewport
 * coordinates, by laying the text out in an invisible copy of the field (the
 * "mirror element" technique). Returns `null` when the field isn't in the page.
 */
export function measureTextPosition(
  field: HTMLInputElement | HTMLTextAreaElement,
  index: number,
): DOMRect | null {
  const doc = field.ownerDocument
  const view = doc.defaultView
  if (!view || !field.isConnected) return null

  const style = view.getComputedStyle(field)
  const mirror = doc.createElement('div')
  const mirrorStyle = mirror.style
  for (const property of MIRRORED_STYLES) {
    mirrorStyle[property] = style[property]
  }
  const isInput = field instanceof HTMLInputElement
  mirrorStyle.position = 'absolute'
  mirrorStyle.visibility = 'hidden'
  mirrorStyle.top = '0'
  mirrorStyle.left = '-9999px'
  mirrorStyle.overflow = 'hidden'
  // The width the text wraps in: the field's (fractional) width, minus any
  // scrollbar.
  const borderX =
    Number.parseFloat(style.borderLeftWidth) +
    Number.parseFloat(style.borderRightWidth)
  // Layout width: fractional, and unaffected by transforms or zoom.
  const px = (value: string) => Number.parseFloat(value) || 0
  const borderBoxWidth =
    style.boxSizing === 'border-box'
      ? px(style.width)
      : px(style.width) +
        px(style.paddingLeft) +
        px(style.paddingRight) +
        borderX
  const scrollbar = field.offsetWidth - field.clientWidth - borderX
  mirrorStyle.boxSizing = 'border-box'
  mirrorStyle.width = `${borderBoxWidth - scrollbar}px`
  if (isInput) {
    // An input is one line, centred in its content box.
    mirrorStyle.whiteSpace = 'pre'
    const contentHeight =
      field.clientHeight -
      Number.parseFloat(style.paddingTop) -
      Number.parseFloat(style.paddingBottom)
    mirrorStyle.lineHeight = `${contentHeight}px`
  }

  const value = field.value
  mirror.textContent = value.slice(0, index)
  const marker = doc.createElement('span')
  // A non-empty marker so it has a line box even at the end of the text.
  marker.textContent = value.slice(index, index + 1) || '\u200b'
  mirror.append(marker)
  // The rest of the text, so a word that wraps as a whole wraps here too.
  mirror.append(value.slice(index + 1))
  doc.body.append(mirror)

  try {
    const fieldRect = field.getBoundingClientRect()
    const mirrorRect = mirror.getBoundingClientRect()
    const markerRect = marker.getBoundingClientRect()
    return new DOMRect(
      fieldRect.left + (markerRect.left - mirrorRect.left) - field.scrollLeft,
      fieldRect.top + (markerRect.top - mirrorRect.top) - field.scrollTop,
      markerRect.width,
      markerRect.height,
    )
  } finally {
    mirror.remove()
  }
}
