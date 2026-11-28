import { mergeProps } from '@base-ui/react/merge-props'
import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  composeHandlers,
  composePartProps,
  useComposedHandler,
  usePart,
} from './use-part.js'

type Prevented = React.MouseEvent & {
  preventBaseUIHandler: () => void
  readonly baseUIHandlerPrevented?: boolean
}

/** A button whose click both a consumer and the part handle. */
function Part({
  onClick,
  ours,
}: {
  onClick?: (event: Prevented) => void
  ours: (event: React.MouseEvent) => void
}) {
  return usePart({
    consumer: { onClick, 'data-testid': 'part' },
    props: { onClick: ours },
    defaultTagName: 'button',
  })
}

/** An element an event bubbles to. */
const Box = (props: React.ComponentProps<'div'>) => <div {...props} />

describe('composeHandlers', () => {
  it('runs the consumer’s handler first, then ours, and returns the consumer’s result', () => {
    const calls: string[] = []
    const handler = composeHandlers(
      (_event: { nativeEvent: object }) => {
        calls.push('consumer')
        return 'theirs'
      },
      () => {
        calls.push('ours')
      },
    )
    expect(handler({ nativeEvent: {} })).toBe('theirs')
    expect(calls).toEqual(['consumer', 'ours'])
  })

  it('is ours itself with no consumer handler', () => {
    const ours = () => {}
    expect(composeHandlers(undefined, ours)).toBe(ours)
  })

  it('skips ours when the consumer calls preventBaseUIHandler(), and not for preventDefault()', () => {
    const ours = vi.fn()
    render(
      <Part
        ours={ours}
        onClick={(event) => {
          if (event.shiftKey) event.preventBaseUIHandler()
          else event.preventDefault()
        }}
      />,
    )
    fireEvent.click(screen.getByTestId('part'), { shiftKey: true })
    expect(ours).not.toHaveBeenCalled()
    // What preventDefault() means is ours to decide.
    fireEvent.click(screen.getByTestId('part'))
    expect(ours).toHaveBeenCalledOnce()
    expect(ours.mock.calls[0]?.[0].defaultPrevented).toBe(true)
  })

  it('skips only the handler it composes: a consumer inside another part doesn’t skip the outer one', () => {
    const inner = vi.fn()
    const outer = vi.fn()
    // One event, reaching the inner part's handler and then, as it bubbles,
    // the outer part's, as React dispatches it: `currentTarget` is each one's
    // element in turn.
    const event = {
      nativeEvent: {},
      currentTarget: 'inner',
    } as unknown as Prevented & {
      currentTarget: string
    }
    composeHandlers((e: Prevented) => e.preventBaseUIHandler(), inner)(event)
    event.currentTarget = 'outer'
    composeHandlers(() => {}, outer)(event)
    expect(inner).not.toHaveBeenCalled()
    expect(outer).toHaveBeenCalledOnce()
  })

  it('leaves the flag set for what runs after it, so a part composed over another skips both', () => {
    const inner = vi.fn()
    const outer = vi.fn()
    const after = vi.fn()
    const handler = composeHandlers(
      composeHandlers(
        (event: Prevented) => event.preventBaseUIHandler(),
        inner,
      ),
      outer,
    )
    render(
      <button
        type="button"
        data-testid="part"
        onClick={(event) => {
          handler(event as Prevented)
          after((event as Prevented).baseUIHandlerPrevented)
        }}
      />,
    )
    fireEvent.click(screen.getByTestId('part'))
    expect(inner).not.toHaveBeenCalled()
    expect(outer).not.toHaveBeenCalled()
    expect(after).toHaveBeenCalledWith(true)
  })

  it('skips a Base UI component’s handler on the same element, and not on the elements the event bubbles to', () => {
    // Base UI merges its own handler with what it's given, the composed
    // handler here, and skips its own when the flag is set.
    const sameElement = vi.fn()
    const ancestor = vi.fn()
    const ours = vi.fn()
    const outer = mergeProps<'section'>(
      { onClick: ancestor },
      { onClick: () => {} },
    )
    const inner = mergeProps<'button'>(
      { onClick: sameElement },
      {
        onClick: composeHandlers(
          (event: Prevented) => event.preventBaseUIHandler(),
          ours,
        ),
      },
    )
    render(
      <Box onClick={outer.onClick}>
        <button type="button" data-testid="part" onClick={inner.onClick} />
      </Box>,
    )
    fireEvent.click(screen.getByTestId('part'))
    expect(ours).not.toHaveBeenCalled()
    expect(sameElement).not.toHaveBeenCalled()
    expect(ancestor).toHaveBeenCalledOnce()
  })

  it('keeps a flag Base UI set lower in the tree for the Base UI handlers above, as before, and doesn’t take it as a skip of ours', () => {
    // A Base UI element calls preventBaseUIHandler() itself (as useButton
    // does on Enter); a part with a consumer handler sits between it and a
    // Base UI ancestor. Base UI's flag reaches the ancestor, which skips its
    // own handler, as it did before parts composed handlers.
    const ancestorOwn = vi.fn()
    const ours = vi.fn()
    const outer = mergeProps<'div'>(
      { onClick: ancestorOwn },
      { onClick: () => {} },
    )
    const inner = mergeProps<'button'>(
      { onClick: () => {} },
      { onClick: (event: Prevented) => event.preventBaseUIHandler() },
    )
    render(
      <Box onClick={outer.onClick}>
        <Box onClick={composeHandlers(() => {}, ours)}>
          <button type="button" data-testid="part" onClick={inner.onClick} />
        </Box>
      </Box>,
    )
    fireEvent.click(screen.getByTestId('part'))
    expect(ours).toHaveBeenCalledOnce()
    expect(ancestorOwn).not.toHaveBeenCalled()
  })

  it('runs both for an event that isn’t a React event', () => {
    const calls: string[] = []
    composeHandlers(
      () => calls.push('consumer'),
      () => calls.push('ours'),
    )('value')
    expect(calls).toEqual(['consumer', 'ours'])
  })
})

describe('composePartProps', () => {
  it('keeps the part’s attributes over the consumer’s, as `{ ...rest, ...ours }` did', () => {
    const ours = () => {}
    const theirs = () => {}
    const props = composePartProps(
      { role: 'option', id: 'ours', onClick: ours },
      { role: 'button', title: 'theirs', onPointerUp: theirs },
    )
    expect(props).toEqual({
      role: 'option',
      id: 'ours',
      title: 'theirs',
      onClick: ours,
      onPointerUp: theirs,
    })
  })

  it('keeps the consumer’s handler where ours is undefined, as mergeProps does', () => {
    const theirs = () => {}
    const props = composePartProps({ onClick: undefined }, { onClick: theirs })
    expect(props.onClick).toBe(theirs)
  })

  it('composes a handler both set', () => {
    const calls: string[] = []
    const props = composePartProps(
      { onClick: () => calls.push('ours') },
      { onClick: () => calls.push('consumer') },
    )
    ;(props.onClick as (event: object) => void)({ nativeEvent: {} })
    expect(calls).toEqual(['consumer', 'ours'])
  })
})

describe('useComposedHandler', () => {
  it('keeps the composed handler while both halves stay the same', () => {
    const ours = () => {}
    const theirs = () => {}
    const { result, rerender } = renderHook(
      ({ consumer }) => useComposedHandler(consumer, ours),
      { initialProps: { consumer: theirs as (() => void) | undefined } },
    )
    const first = result.current
    rerender({ consumer: theirs })
    expect(result.current).toBe(first)
    rerender({ consumer: undefined })
    expect(result.current).toBe(ours)
  })
})
