import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { VideoPlayer } from '../../index.js'

const DURATION = 100

const trackStyle: React.CSSProperties = { width: 400, height: 8 }
const thumbStyle: React.CSSProperties = { width: 12, height: 12 }

function SeekSliderWithoutRender() {
  return (
    <VideoPlayer.SeekSlider>
      <VideoPlayer.SeekSliderControl data-testid="control">
        <VideoPlayer.SeekSliderTrack style={trackStyle}>
          <VideoPlayer.SeekSliderBuffered />
          <VideoPlayer.SeekSliderProgress />
          <VideoPlayer.SeekSliderThumb style={thumbStyle} />
        </VideoPlayer.SeekSliderTrack>
      </VideoPlayer.SeekSliderControl>
    </VideoPlayer.SeekSlider>
  )
}

// Every part drawn with `render`, each part's children inside its callback.
function SeekSliderWithNestedRender() {
  return (
    <VideoPlayer.SeekSlider
      render={(seek) => (
        <div {...seek}>
          <VideoPlayer.SeekSliderControl data-testid="control">
            <VideoPlayer.SeekSliderTrack
              render={(track) => (
                <div {...track} style={{ ...track.style, ...trackStyle }}>
                  <VideoPlayer.SeekSliderBuffered
                    render={(buffered) => <div {...buffered} />}
                  />
                  <VideoPlayer.SeekSliderProgress
                    render={(progress) => <div {...progress} />}
                  />
                  <VideoPlayer.SeekSliderThumb
                    render={(thumb) => (
                      <div
                        {...thumb}
                        style={{ ...thumb.style, ...thumbStyle }}
                      />
                    )}
                  />
                </div>
              )}
            />
          </VideoPlayer.SeekSliderControl>
        </div>
      )}
    />
  )
}

// Every part drawn with `render`, children passed as JSX children.
function SeekSliderWithRenderAndChildren() {
  return (
    <VideoPlayer.SeekSlider render={(seek) => <div {...seek} />}>
      <VideoPlayer.SeekSliderControl data-testid="control">
        <VideoPlayer.SeekSliderTrack
          style={trackStyle}
          render={(track) => <div {...track} />}
        >
          <VideoPlayer.SeekSliderBuffered
            render={(buffered) => <div {...buffered} />}
          />
          <VideoPlayer.SeekSliderProgress
            render={(progress) => <div {...progress} />}
          >
            <span data-testid="progress-child" />
          </VideoPlayer.SeekSliderProgress>
          <VideoPlayer.SeekSliderThumb
            data-testid="thumb"
            style={thumbStyle}
            render={(thumb) => <div {...thumb} />}
          >
            <span data-testid="thumb-child" />
          </VideoPlayer.SeekSliderThumb>
        </VideoPlayer.SeekSliderTrack>
      </VideoPlayer.SeekSliderControl>
    </VideoPlayer.SeekSlider>
  )
}

function renderInPlayer(
  children: React.ReactNode,
  props: React.ComponentProps<typeof VideoPlayer.Root> = {},
) {
  render(
    <VideoPlayer.Root {...props}>
      <VideoPlayer.Video data-testid="video" />
      {children}
    </VideoPlayer.Root>,
  )
  return screen.getByTestId('video') as HTMLVideoElement
}

function renderSeekSlider(slider: React.ReactNode) {
  const onCurrentTimeChange = vi.fn<(time: number) => void>()
  const video = renderInPlayer(slider, { onCurrentTimeChange })

  // The video has no source, so give it a duration the slider can map to.
  Object.defineProperty(video, 'duration', {
    configurable: true,
    value: DURATION,
  })
  act(() => {
    fireEvent(video, new Event('durationchange'))
  })

  const control = screen.getByTestId('control')
  const lastTime = () => onCurrentTimeChange.mock.lastCall?.[0]
  return { control, lastTime }
}

function pointAt(element: HTMLElement, fraction: number) {
  const { width, height } = element.getBoundingClientRect()
  return { x: width * fraction, y: height / 2 }
}

describe.each([
  ['without render props', SeekSliderWithoutRender],
  ['with nested render props', SeekSliderWithNestedRender],
  ['with render props and children', SeekSliderWithRenderAndChildren],
])('SeekSlider %s', (_, Slider) => {
  it('seeks to the pressed point', async () => {
    const { control, lastTime } = renderSeekSlider(<Slider />)

    await userEvent.click(control, { position: pointAt(control, 0.75) })

    await vi.waitFor(() => {
      expect(lastTime()).toBeCloseTo(75, 0)
    })
  })

  it('seeks while dragging', async () => {
    const { control, lastTime } = renderSeekSlider(<Slider />)

    await userEvent.dragAndDrop(control, control, {
      sourcePosition: pointAt(control, 0.2),
      targetPosition: pointAt(control, 0.5),
    })

    await vi.waitFor(() => {
      expect(lastTime()).toBeCloseTo(50, 0)
    })
  })

  it('seeks with the arrow keys', async () => {
    const { lastTime } = renderSeekSlider(<Slider />)

    screen.getByRole('slider').focus()
    await userEvent.keyboard('{ArrowRight}')

    await vi.waitFor(() => {
      expect(lastTime()).toBeGreaterThan(0)
    })
  })
})

describe('SeekSlider parts drawn with render props', () => {
  it('keep their JSX children', () => {
    renderInPlayer(<SeekSliderWithRenderAndChildren />)

    expect(screen.getByTestId('progress-child')).toBeInTheDocument()
    const thumb = screen.getByTestId('thumb')
    expect(thumb).toContainElement(screen.getByTestId('thumb-child'))
    expect(thumb).toContainElement(screen.getByRole('slider'))
  })

  it('forward their refs to the rendered elements', () => {
    const trackRef = React.createRef<HTMLDivElement>()
    const progressRef = React.createRef<HTMLDivElement>()
    const thumbRef = React.createRef<HTMLDivElement>()

    renderInPlayer(
      <VideoPlayer.SeekSlider>
        <VideoPlayer.SeekSliderControl>
          <VideoPlayer.SeekSliderTrack
            ref={trackRef}
            render={(track) => <div {...track} data-testid="track" />}
          >
            <VideoPlayer.SeekSliderProgress
              ref={progressRef}
              render={(progress) => (
                <div {...progress} data-testid="progress" />
              )}
            />
            <VideoPlayer.SeekSliderThumb
              ref={thumbRef}
              render={(thumb) => <div {...thumb} data-testid="thumb" />}
            />
          </VideoPlayer.SeekSliderTrack>
        </VideoPlayer.SeekSliderControl>
      </VideoPlayer.SeekSlider>,
    )

    expect(trackRef.current).toBe(screen.getByTestId('track'))
    expect(progressRef.current).toBe(screen.getByTestId('progress'))
    expect(thumbRef.current).toBe(screen.getByTestId('thumb'))
  })
})

describe('VolumeSlider with render props and children', () => {
  it('sets the volume from the pressed point', async () => {
    const video = renderInPlayer(
      <VideoPlayer.VolumeSlider render={(volume) => <div {...volume} />}>
        <VideoPlayer.VolumeSliderControl data-testid="control">
          <VideoPlayer.VolumeSliderTrack style={trackStyle}>
            <VideoPlayer.VolumeSliderRange />
            <VideoPlayer.VolumeSliderThumb style={thumbStyle} />
          </VideoPlayer.VolumeSliderTrack>
        </VideoPlayer.VolumeSliderControl>
      </VideoPlayer.VolumeSlider>,
    )
    const control = screen.getByTestId('control')

    await userEvent.click(control, { position: pointAt(control, 0.25) })

    await vi.waitFor(() => {
      expect(video.volume).toBeCloseTo(0.25, 1)
    })
  })
})
