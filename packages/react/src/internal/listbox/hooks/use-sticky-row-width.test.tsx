import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../dropdown-menu/index.js'

const ROW_WIDTHS = [120, 340, 200, 90, 260]

// One row carries its own inline sizes, which measurement must put back.
const STYLED_ROW_WIDTH = 200
const STYLED_ROW_STYLE = { width: '150px', maxWidth: '180px' }

function MeasuredMenu() {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup data-testid="popup">
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                {ROW_WIDTHS.map((width) => (
                  <DropdownMenu.Item
                    key={width}
                    value={`row-${width}`}
                    data-measure-width={width}
                    style={
                      width === STYLED_ROW_WIDTH ? STYLED_ROW_STYLE : undefined
                    }
                  >
                    Row {width}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sticky row width measurement', () => {
  it('applies measuring styles to every row before reading any width', async () => {
    // A width read right after a style write forces a synchronous layout.
    // Log both, in order: width reads of rows, and the measuring writes
    // (`width`, `max-width` and the `data-measuring` attribute).
    const log: Array<'write' | 'read'> = []

    const readWidth = (element: HTMLElement) => {
      const width = element.getAttribute('data-measure-width')
      if (width === null) return 0
      log.push('read')
      return Number(width)
    }
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        return readWidth(this)
      },
    )
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        return readWidth(this)
      },
    )

    const setAttribute = Element.prototype.setAttribute
    vi.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (
      this: Element,
      name: string,
      value: string,
    ) {
      if (name === 'data-measuring') log.push('write')
      setAttribute.call(this, name, value)
    })
    // Only a row's own inline style counts: jsdom's `getComputedStyle` also
    // goes through these setters.
    const isRowStyle = (style: CSSStyleDeclaration) =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[data-measure-width]'),
      ).some((row) => row.style === style)
    for (const property of ['width', 'maxWidth'] as const) {
      const descriptor = Object.getOwnPropertyDescriptor(
        CSSStyleDeclaration.prototype,
        property,
      )
      const set = descriptor?.set
      if (!set) throw new Error(`No setter for style.${property}`)
      vi.spyOn(
        CSSStyleDeclaration.prototype,
        property,
        'set',
      ).mockImplementation(function (this: CSSStyleDeclaration, value: string) {
        if (isRowStyle(this)) log.push('write')
        set.call(this, value)
      })
    }
    const removeAttribute = Element.prototype.removeAttribute
    vi.spyOn(Element.prototype, 'removeAttribute').mockImplementation(function (
      this: Element,
      name: string,
    ) {
      if (name === 'data-measuring') log.push('write')
      removeAttribute.call(this, name)
    })

    render(<MeasuredMenu />)

    const popup = screen.getByTestId('popup')
    await waitFor(() => {
      expect(popup.style.getPropertyValue('--row-width')).toBe('341px')
    })

    // Every write that precedes a read starts a forced layout.
    const forcedLayouts = log.filter(
      (entry, index) => entry === 'read' && log[index - 1] === 'write',
    ).length
    expect(log.filter((entry) => entry === 'read').length).toBeGreaterThan(0)
    expect(forcedLayouts).toBe(1)
    for (const row of screen.getAllByRole('option')) {
      expect(row).not.toHaveAttribute('data-measuring')
      const styled =
        row.getAttribute('data-measure-width') === String(STYLED_ROW_WIDTH)
      expect(row.style.width).toBe(styled ? STYLED_ROW_STYLE.width : '')
      expect(row.style.maxWidth).toBe(styled ? STYLED_ROW_STYLE.maxWidth : '')
    }
  })
})
