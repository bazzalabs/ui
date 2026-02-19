import { render } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useMouseTrail } from './use-mouse-trail.js'

function MouseTrailProbe({ limit = 4 }: { limit?: number }) {
  useMouseTrail(limit)
  return null
}

describe('useMouseTrail', () => {
  it('shares a single global pointermove listener across subscribers', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(
      <React.Fragment>
        <MouseTrailProbe />
        <MouseTrailProbe />
      </React.Fragment>,
    )

    const addPointerMoveCalls = addEventListenerSpy.mock.calls.filter(
      ([type]) => type === 'pointermove',
    )

    expect(addPointerMoveCalls).toHaveLength(1)

    unmount()

    const removePointerMoveCalls = removeEventListenerSpy.mock.calls.filter(
      ([type]) => type === 'pointermove',
    )

    expect(removePointerMoveCalls).toHaveLength(1)

    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })
})
