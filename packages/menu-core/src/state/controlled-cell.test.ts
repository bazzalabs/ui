import { describe, expect, it } from 'vitest'
import { createChangeEventDetails } from '../events/create-event-details.js'
import { cellValue, changeCell, createCell } from './controlled-cell.js'

describe('cellValue', () => {
  it('reads the internal value while uncontrolled', () => {
    expect(cellValue(createCell('internal'))).toBe('internal')
  })

  it('reads the controlled value over the internal one', () => {
    expect(cellValue(createCell(false, true))).toBe(true)
    expect(cellValue(createCell(true, false))).toBe(false)
    expect(cellValue(createCell('internal', ''))).toBe('')
  })
})

describe('changeCell', () => {
  it('calls the consumer, with the details, before it decides the change', () => {
    const order: string[] = []
    const details = {
      get isCanceled() {
        order.push('decide')
        return false
      },
    }
    const next = changeCell(
      createCell(false),
      true,
      details,
      (value, received) => {
        order.push(`consumer ${value}`)
        expect(received).toBe(details)
      },
    )

    expect(order[0]).toBe('consumer true')
    expect(order).toContain('decide')
    expect(cellValue(next)).toBe(true)
  })

  it('leaves the cell unchanged when the consumer cancels', () => {
    const cell = createCell(false)
    const next = changeCell(
      cell,
      true,
      createChangeEventDetails('none'),
      (_value, details) => details.cancel(),
    )

    expect(next).toBe(cell)
  })

  it('leaves a controlled cell unchanged but still asks the consumer', () => {
    const cell = createCell(false, false)
    const seen: boolean[] = []
    const next = changeCell(
      cell,
      true,
      createChangeEventDetails('none'),
      (value) => seen.push(value),
    )

    expect(seen).toEqual([true])
    expect(next).toBe(cell)
    expect(cellValue(next)).toBe(false)
  })

  it('changes the internal value with no consumer', () => {
    const next = changeCell(createCell('a'), 'b')
    expect(next).toEqual({ internal: 'b', controlled: undefined })
  })

  it('returns the same cell when the value is unchanged', () => {
    const cell = createCell('a')
    expect(changeCell(cell, 'a')).toBe(cell)
  })
})
