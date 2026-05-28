import { render, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VideoPlayer } from './index.js'

function renderPlayer(
  props: React.ComponentProps<typeof VideoPlayer.Root> = {},
) {
  return render(
    <VideoPlayer.Root {...props}>
      <VideoPlayer.Video data-testid="video" src="/video.mp4" />
    </VideoPlayer.Root>,
  )
}

describe('VideoPlayer autoplay', () => {
  let play: ReturnType<typeof vi.spyOn>
  let pause: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined)
    pause = vi
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => undefined)
  })

  it('does not autoplay by default', () => {
    renderPlayer()

    expect(play).not.toHaveBeenCalled()
    expect(pause).not.toHaveBeenCalled()
  })

  it('plays automatically when autoPlay is true', async () => {
    renderPlayer({ autoPlay: true })

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
  })

  it('attempts autoplay when autoPlay changes to true after mount', async () => {
    const { rerender } = renderPlayer({ autoPlay: false })

    expect(play).not.toHaveBeenCalled()

    rerender(
      <VideoPlayer.Root autoPlay>
        <VideoPlayer.Video data-testid="video" src="/video.mp4" />
      </VideoPlayer.Root>,
    )

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
  })

  it('does not retry autoplay on rerender', async () => {
    const { rerender } = renderPlayer({ autoPlay: true })

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))

    rerender(
      <VideoPlayer.Root autoPlay>
        <VideoPlayer.Video data-testid="video" src="/video.mp4" />
      </VideoPlayer.Root>,
    )

    expect(play).toHaveBeenCalledTimes(1)
  })

  it('uses defaultMuted for muted autoplay', async () => {
    const mutedValuesDuringPlay: boolean[] = []
    play.mockImplementation(function (this: HTMLMediaElement) {
      mutedValuesDuringPlay.push(this.muted)
      return Promise.resolve()
    })

    const { getByTestId } = renderPlayer({
      autoPlay: true,
      defaultMuted: true,
    })

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
    expect(mutedValuesDuringPlay).toEqual([true])
    expect(getByTestId('video')).toHaveProperty('muted', true)
  })

  it('uses controlled muted for muted autoplay', async () => {
    const mutedValuesDuringPlay: boolean[] = []
    play.mockImplementation(function (this: HTMLMediaElement) {
      mutedValuesDuringPlay.push(this.muted)
      return Promise.resolve()
    })

    const { getByTestId } = renderPlayer({
      autoPlay: true,
      muted: true,
    })

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
    expect(mutedValuesDuringPlay).toEqual([true])
    expect(getByTestId('video')).toHaveProperty('muted', true)
  })

  it('does not mute or retry when autoplay fails', async () => {
    play.mockRejectedValueOnce(new Error('Playback failed'))

    const { getByTestId } = renderPlayer({ autoPlay: true })

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
    expect(getByTestId('video')).toHaveProperty('muted', false)
  })
})
