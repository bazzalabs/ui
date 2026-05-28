import { fireEvent, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

function renderPlayerWithMuteButton(
  props: React.ComponentProps<typeof VideoPlayer.Root> = {},
) {
  return render(
    <VideoPlayer.Root {...props}>
      <VideoPlayer.Video data-testid="video" src="/video.mp4" />
      <VideoPlayer.MuteButton data-testid="mute" />
    </VideoPlayer.Root>,
  )
}

function renderPlayerWithControls(children: React.ReactNode) {
  return render(
    <VideoPlayer.Root>
      <VideoPlayer.Video data-testid="video" src="/video.mp4">
        <VideoPlayer.Track
          kind="captions"
          src="/captions.vtt"
          label="English"
          srcLang="en"
        />
      </VideoPlayer.Video>
      {children}
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

  it('uses defaultMuted when the video mounts without autoplay', () => {
    const { getByTestId } = renderPlayer({ defaultMuted: true })

    expect(getByTestId('video')).toHaveProperty('muted', true)
  })

  it('syncs controlled muted changes to the video', () => {
    const { getByTestId, rerender } = renderPlayer({ muted: false })
    const video = getByTestId('video')

    expect(video).toHaveProperty('muted', false)

    rerender(
      <VideoPlayer.Root muted>
        <VideoPlayer.Video data-testid="video" src="/video.mp4" />
      </VideoPlayer.Root>,
    )

    expect(video).toHaveProperty('muted', true)
  })

  it('does not mute or retry when autoplay fails', async () => {
    play.mockRejectedValueOnce(new Error('Playback failed'))

    const { getByTestId } = renderPlayer({ autoPlay: true })

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
    expect(getByTestId('video')).toHaveProperty('muted', false)
  })
})

describe('VideoPlayer mute button', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
      () => undefined,
    )
  })

  it('toggles muted state off and on', async () => {
    const user = userEvent.setup()
    const { getByTestId } = renderPlayerWithMuteButton()
    const video = getByTestId('video') as HTMLVideoElement
    const mute = getByTestId('mute')

    expect(video.muted).toBe(false)

    await user.click(mute)
    expect(video.muted).toBe(true)
    expect(mute).toHaveAttribute('aria-pressed', 'true')

    await user.click(mute)
    expect(video.muted).toBe(false)
    expect(mute).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps unmuted state when the browser emits volumechange during unmute', async () => {
    const user = userEvent.setup()
    const { getByTestId } = renderPlayerWithMuteButton()
    const video = getByTestId('video') as HTMLVideoElement
    const mute = getByTestId('mute')

    await user.click(mute)
    expect(video.muted).toBe(true)

    await user.click(mute)
    fireEvent.volumeChange(video)

    expect(video.muted).toBe(false)
    expect(mute).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('VideoPlayer button event composition', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
      () => undefined,
    )
  })

  it('runs play button actions when an external onClick is provided', async () => {
    const user = userEvent.setup()
    const externalClick = vi.fn()
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')

    const { getByTestId } = renderPlayerWithControls(
      <VideoPlayer.PlayButton data-testid="play" onClick={externalClick} />,
    )

    await user.click(getByTestId('play'))

    expect(externalClick).toHaveBeenCalledTimes(1)
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('runs mute button actions when an external onClick is provided', async () => {
    const user = userEvent.setup()
    const externalClick = vi.fn()

    const { getByTestId } = renderPlayerWithControls(
      <VideoPlayer.MuteButton data-testid="mute" onClick={externalClick} />,
    )
    const video = getByTestId('video') as HTMLVideoElement

    await user.click(getByTestId('mute'))

    expect(externalClick).toHaveBeenCalledTimes(1)
    expect(video.muted).toBe(true)
  })

  it('runs fullscreen button actions when an external onClick is provided', async () => {
    const user = userEvent.setup()
    const externalClick = vi.fn()
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })

    const { getByTestId } = renderPlayerWithControls(
      <VideoPlayer.FullscreenButton
        data-testid="fullscreen"
        onClick={externalClick}
      />,
    )

    await waitFor(() => expect(getByTestId('fullscreen')).not.toBeDisabled())
    await user.click(getByTestId('fullscreen'))

    expect(externalClick).toHaveBeenCalledTimes(1)
    expect(requestFullscreen).toHaveBeenCalledTimes(1)
  })

  it('runs picture-in-picture button actions when an external onClick is provided', async () => {
    const user = userEvent.setup()
    const externalClick = vi.fn()
    const requestPictureInPicture = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(document, 'pictureInPictureEnabled', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(
      HTMLVideoElement.prototype,
      'requestPictureInPicture',
      {
        configurable: true,
        value: requestPictureInPicture,
      },
    )

    const { getByTestId } = renderPlayerWithControls(
      <VideoPlayer.PictureInPictureButton
        data-testid="pip"
        onClick={externalClick}
      />,
    )

    await waitFor(() => expect(getByTestId('pip')).not.toBeDisabled())
    await user.click(getByTestId('pip'))

    expect(externalClick).toHaveBeenCalledTimes(1)
    expect(requestPictureInPicture).toHaveBeenCalledTimes(1)
  })

  it('runs captions button actions when an external onClick is provided', async () => {
    const user = userEvent.setup()
    const externalClick = vi.fn()
    const textTrack = {
      activeCues: null,
      addEventListener: vi.fn(),
      mode: 'disabled',
      removeEventListener: vi.fn(),
    } as unknown as TextTrack

    Object.defineProperty(HTMLTrackElement.prototype, 'track', {
      configurable: true,
      get: () => textTrack,
    })

    const { getByTestId } = renderPlayerWithControls(
      <VideoPlayer.CaptionsButton
        data-testid="captions"
        onClick={externalClick}
      />,
    )

    await waitFor(() => expect(getByTestId('captions')).not.toBeDisabled())
    await user.click(getByTestId('captions'))

    expect(externalClick).toHaveBeenCalledTimes(1)
    expect(getByTestId('captions')).toHaveAttribute('aria-pressed', 'true')
  })

  it('continues to run playback rate button actions when an external onClick is provided', async () => {
    const user = userEvent.setup()
    const externalClick = vi.fn()

    const { getByTestId } = renderPlayerWithControls(
      <VideoPlayer.PlaybackRateButton
        data-testid="rate"
        onClick={externalClick}
      />,
    )

    await user.click(getByTestId('rate'))

    expect(externalClick).toHaveBeenCalledTimes(1)
    expect(getByTestId('rate')).toHaveTextContent('1.25x')
  })
})
