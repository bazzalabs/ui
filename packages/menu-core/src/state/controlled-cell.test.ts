import { describe, expect, it } from 'vitest'
import { createChangeEventDetails } from '../events/create-event-details.js'
import { currentTask } from '../platform/task.js'
import {
  type CellRequest,
  type ControlledCell,
  cellValue,
  changeCell,
  controlledBy,
  createCell,
  isNoopRequest,
  markRequested,
  notifyCell,
  propCell,
  requestCell,
  settledResult,
  settleRequest,
} from './controlled-cell.js'

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

const TASK = {}
const LATER = {}
const EVENT = { type: 'keydown' }

/** A request for `value`, asked in `task` with `event`. */
function request<T>(
  value: T,
  { task = TASK, event }: { task?: object; event?: unknown } = {},
): CellRequest<T> {
  return { value, task, event }
}

/** Asks `cell` for `next`; `cancel` cancels the details. */
function ask<T>(
  cell: ControlledCell<T>,
  next: T,
  {
    task = TASK,
    event,
    cancel = false,
  }: { task?: object; event?: unknown; cancel?: boolean } = {},
) {
  const seen: T[] = []
  const { cell: nextCell, result } = requestCell(
    cell,
    request(next, { task, event }),
    createChangeEventDetails('none'),
    (value, details) => {
      seen.push(value)
      if (cancel) details.cancel()
    },
  )
  return { cell: nextCell, result, seen }
}

describe('requestCell', () => {
  it('calls the consumer, with the details, before it decides the change', () => {
    const order: string[] = []
    const details = {
      get isCanceled() {
        order.push('decide')
        return false
      },
    }
    const { cell } = requestCell(
      createCell(false),
      request(true),
      details,
      (value, received) => {
        order.push(`consumer ${value}`)
        expect(received).toBe(details)
      },
    )

    expect(order[0]).toBe('consumer true')
    expect(order).toContain('decide')
    expect(cellValue(cell)).toBe(true)
  })

  it('applies a change to an uncontrolled cell, keeping it until settled', () => {
    const { cell, result, seen } = ask(createCell(false), true)
    expect(result).toBe('applied')
    expect(seen).toEqual([true])
    expect(cellValue(cell)).toBe(true)
    expect(cell.request?.value).toBe(true)
    expect(settleRequest(cell).request).toBe(undefined)
  })

  it('leaves the cell as it was when the consumer cancels', () => {
    const before = createCell(false)
    const { cell, result } = ask(before, true, { cancel: true })
    expect(result).toBe('canceled')
    expect(cell).toBe(before)
  })

  it('keeps a change a prop controls as its request, without applying it', () => {
    const { cell, result, seen } = ask(createCell(false, false), true, {
      event: EVENT,
    })
    expect(result).toBe('controlled')
    expect(seen).toEqual([true])
    expect(cellValue(cell)).toBe(false)
    expect(cell.request).toEqual({ value: true, task: TASK, event: EVENT })
  })

  it('keeps what else the caller records with the request', () => {
    const cell = createCell<boolean, CellRequest<boolean> & { reason: string }>(
      false,
      false,
    )
    const { cell: next } = requestCell(
      cell,
      { ...request(true), reason: 'trigger-press' },
      createChangeEventDetails('none'),
      undefined,
    )
    expect(next.request?.reason).toBe('trigger-press')
  })

  it('keeps the earlier request when the consumer cancels a controlled one', () => {
    const pending = ask(createCell(false, false), true).cell
    const { cell, result } = ask(pending, false, { cancel: true })
    expect(result).toBe('canceled')
    expect(cell).toBe(pending)
  })

  describe('noop', () => {
    it('asks nobody for the value the cell already has', () => {
      for (const cell of [createCell(true), createCell(false, true)]) {
        const { result, seen, cell: next } = ask(cell, true)
        expect(result).toBe('noop')
        expect(seen).toEqual([])
        expect(next).toBe(cell)
      }
    })

    it('asks nobody for the change already requested in this task', () => {
      const pending = ask(createCell(false, false), true).cell
      const { result, seen } = ask(pending, true)
      expect(result).toBe('noop')
      expect(seen).toEqual([])
    })

    it('asks nobody for the change already requested with this event, in any task', () => {
      const pending = ask(createCell(false, false), true, { event: EVENT }).cell
      const { result, seen } = ask(pending, true, { task: LATER, event: EVENT })
      expect(result).toBe('noop')
      expect(seen).toEqual([])
    })

    it('asks again for the change requested in an earlier task, or with another event', () => {
      const pending = ask(createCell(false, false), true, { event: EVENT }).cell
      for (const event of [undefined, { type: 'keydown' }]) {
        const { result, seen } = ask(pending, true, { task: LATER, event })
        expect(result).toBe('controlled')
        expect(seen).toEqual([true])
      }
    })

    it('asks for a reversal before the prop arrives, even to the current value', () => {
      const pending = ask(createCell(false, false), true, { event: EVENT }).cell
      for (const task of [TASK, LATER]) {
        const { result, seen, cell } = ask(pending, false, {
          task,
          event: EVENT,
        })
        expect(result).toBe('controlled')
        expect(seen).toEqual([false])
        expect(cell.request?.value).toBe(false)
      }
    })

    it('reads a change marked while the consumer decides, uncontrolled too', () => {
      const cell: ControlledCell<boolean> = markRequested(
        createCell(true),
        request(false),
      )
      // Asked again from inside the callback: a repeat
      expect(isNoopRequest(cell, request(false))).toBe(true)
      // The other way: a reversal
      expect(isNoopRequest(cell, request(true))).toBe(false)
    })
  })
})

describe('settledResult', () => {
  it('reads a change the cell took', () => {
    expect(settledResult(createCell(true), true)).toBe('applied')
    expect(settledResult(createCell(false, true), true)).toBe('applied')
    const pending = markRequested(createCell(false, false), request(true))
    expect(settledResult(pending, true)).toBe('controlled')
  })

  it('reads a change taken back as canceled', () => {
    expect(settledResult(createCell(false), true)).toBe('canceled')
    const reversed = markRequested(createCell(true, true), request(false))
    expect(settledResult(reversed, true)).toBe('canceled')
  })
})

describe('controlledBy', () => {
  it('takes the prop, keeping the request until it settles', () => {
    const pending = ask(createCell(false, false), true).cell
    const cell = controlledBy(pending, true)
    expect(cellValue(cell)).toBe(true)
    expect(cell.request).toBe(pending.request)
    expect(settleRequest(cell).request).toBe(undefined)
  })

  it('returns the same cell for the same prop, or none', () => {
    const cell = createCell(false, true)
    expect(controlledBy(cell, true)).toBe(cell)
    expect(controlledBy(cell, undefined)).toBe(cell)
  })
})

describe('notifyCell', () => {
  const details = () => createChangeEventDetails('item-press')

  it('asks the consumer for every change, the value the cell has included', () => {
    const calls: boolean[] = []
    const cell = createCell(false)
    const first = notifyCell(cell, true, details(), (next) => calls.push(next))
    expect(first.result).toBe('applied')
    expect(cellValue(first.cell)).toBe(true)
    const again = notifyCell(first.cell, true, details(), (next) =>
      calls.push(next),
    )
    expect(again.result).toBe('applied')
    expect(again.cell).toBe(first.cell)
    expect(calls).toEqual([true, true])
    expect(again.cell.request).toBe(undefined)
  })

  it('leaves the cell as it is when canceled or controlled', () => {
    const cell = createCell(false)
    const canceled = notifyCell(cell, true, details(), (_next, d) => d.cancel())
    expect(canceled).toEqual({ cell, result: 'canceled' })
    const controlled = createCell(false, false)
    const taken = notifyCell(controlled, true, details(), undefined)
    expect(taken).toEqual({ cell: controlled, result: 'controlled' })
  })
})

describe('propCell', () => {
  it('takes the prop, and drops it again', () => {
    const cell = createCell(false)
    const controlled = propCell(cell, true)
    expect(cellValue(controlled)).toBe(true)
    expect(propCell(controlled, true)).toBe(controlled)
    const dropped = propCell(controlled, undefined)
    expect(dropped.controlled).toBe(undefined)
    expect(cellValue(dropped)).toBe(false)
  })
})

describe('changeCell', () => {
  it('changes the internal value', () => {
    expect(changeCell(createCell('a'), 'b')).toEqual(createCell('b'))
  })

  it('returns the same cell when the value is unchanged, or controlled', () => {
    const cell = createCell('a')
    expect(changeCell(cell, 'a')).toBe(cell)
    const controlled = createCell('a', 'x')
    expect(changeCell(controlled, 'b')).toBe(controlled)
  })
})

describe('currentTask', () => {
  it('is the same token until the task ends', async () => {
    const token = currentTask()
    expect(currentTask()).toBe(token)
    await Promise.resolve()
    expect(currentTask()).not.toBe(token)
  })
})
