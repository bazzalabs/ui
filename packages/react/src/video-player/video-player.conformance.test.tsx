import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { describeConformance } from '../../test/conformance.js'
import { VideoPlayer } from './index.js'

// Only the slider parts are covered here: they wrap Base UI Slider parts and
// take their `className`, `style` and state. `SeekSliderThumb` only accepts an
// object `style`. The sliders' own `render` prop only accepts a function, and
// receives VideoPlayer state rather than slider state (UI-613).

function Player(props: { children: React.ReactNode }) {
  return (
    <VideoPlayer.Root>
      <VideoPlayer.Video src="/video.mp4" />
      {props.children}
    </VideoPlayer.Root>
  )
}

const sliderState = { orientation: 'horizontal' }

describeConformance('VideoPlayer', [
  {
    name: 'VideoPlayer.VolumeSlider',
    render: (p) => (
      <Player>
        <VideoPlayer.VolumeSlider {...p} />
      </Player>
    ),
    state: sliderState,
    functionRenderOnly: true,
    renderState: {
      volume: 1,
      muted: false,
      percentage: 100,
      pressing: false,
      dragging: false,
    },
  },
  {
    name: 'VideoPlayer.VolumeSliderTrack',
    render: (p) => (
      <Player>
        <VideoPlayer.VolumeSlider>
          <VideoPlayer.VolumeSliderControl>
            <VideoPlayer.VolumeSliderTrack {...p} />
          </VideoPlayer.VolumeSliderControl>
        </VideoPlayer.VolumeSlider>
      </Player>
    ),
    state: sliderState,
  },
  {
    name: 'VideoPlayer.VolumeSliderRange',
    render: (p) => (
      <Player>
        <VideoPlayer.VolumeSlider>
          <VideoPlayer.VolumeSliderControl>
            <VideoPlayer.VolumeSliderTrack>
              <VideoPlayer.VolumeSliderRange {...p} />
            </VideoPlayer.VolumeSliderTrack>
          </VideoPlayer.VolumeSliderControl>
        </VideoPlayer.VolumeSlider>
      </Player>
    ),
    state: sliderState,
  },
  {
    name: 'VideoPlayer.VolumeSliderThumb',
    render: (p) => (
      <Player>
        <VideoPlayer.VolumeSlider>
          <VideoPlayer.VolumeSliderControl>
            <VideoPlayer.VolumeSliderTrack>
              <VideoPlayer.VolumeSliderThumb {...p} />
            </VideoPlayer.VolumeSliderTrack>
          </VideoPlayer.VolumeSliderControl>
        </VideoPlayer.VolumeSlider>
      </Player>
    ),
    state: sliderState,
  },
  {
    name: 'VideoPlayer.SeekSlider',
    render: (p) => (
      <Player>
        <VideoPlayer.SeekSlider {...p} />
      </Player>
    ),
    state: sliderState,
    functionRenderOnly: true,
    renderState: {
      currentTime: 0,
      duration: 0,
      progress: 0,
      seeking: false,
      hoverTime: null,
      hoverProgress: null,
      pressing: false,
      dragging: false,
    },
  },
  {
    name: 'VideoPlayer.SeekSliderTrack',
    render: (p) => (
      <Player>
        <VideoPlayer.SeekSlider>
          <VideoPlayer.SeekSliderControl>
            <VideoPlayer.SeekSliderTrack {...p} />
          </VideoPlayer.SeekSliderControl>
        </VideoPlayer.SeekSlider>
      </Player>
    ),
    state: sliderState,
    functionRenderOnly: true,
    renderState: {},
  },
  {
    name: 'VideoPlayer.SeekSliderProgress',
    render: (p) => (
      <Player>
        <VideoPlayer.SeekSlider>
          <VideoPlayer.SeekSliderControl>
            <VideoPlayer.SeekSliderTrack>
              <VideoPlayer.SeekSliderProgress {...p} />
            </VideoPlayer.SeekSliderTrack>
          </VideoPlayer.SeekSliderControl>
        </VideoPlayer.SeekSlider>
      </Player>
    ),
    state: sliderState,
    functionRenderOnly: true,
    renderState: { progress: 0 },
  },
  {
    name: 'VideoPlayer.SeekSliderThumb',
    render: (p) => (
      <Player>
        <VideoPlayer.SeekSlider>
          <VideoPlayer.SeekSliderControl>
            <VideoPlayer.SeekSliderTrack>
              <VideoPlayer.SeekSliderThumb {...p} />
            </VideoPlayer.SeekSliderTrack>
          </VideoPlayer.SeekSliderControl>
        </VideoPlayer.SeekSlider>
      </Player>
    ),
    state: sliderState,
    objectStyleOnly: true,
    functionRenderOnly: true,
    renderState: {},
  },
])

const color = 'rgb(1, 2, 3)'
const styleFn = () => ({ color })

describe('VideoPlayer sliders keep their CSS variables', () => {
  it('VolumeSlider with a style function', async () => {
    render(
      <Player>
        <VideoPlayer.VolumeSlider data-testid="slider" style={styleFn} />
      </Player>,
    )

    const slider = await screen.findByTestId('slider')
    expect(slider.style.color).toBe(color)
    expect(slider.style.getPropertyValue('--volume')).not.toBe('')
  })

  it('SeekSlider with a style object', async () => {
    render(
      <Player>
        <VideoPlayer.SeekSlider data-testid="slider" style={{ color }} />
      </Player>,
    )

    const slider = await screen.findByTestId('slider')
    expect(slider.style.color).toBe(color)
    expect(slider.style.getPropertyValue('--seek-progress')).not.toBe('')
  })

  it('SeekSlider with a style function', async () => {
    render(
      <Player>
        <VideoPlayer.SeekSlider data-testid="slider" style={styleFn} />
      </Player>,
    )

    const slider = await screen.findByTestId('slider')
    expect(slider.style.color).toBe(color)
    expect(slider.style.getPropertyValue('--seek-progress')).not.toBe('')
  })
})

describe('VideoPlayer sliders resolve a style function in render-prop mode', () => {
  for (const [name, Slider] of [
    ['VolumeSlider', VideoPlayer.VolumeSlider],
    ['SeekSlider', VideoPlayer.SeekSlider],
  ] as const) {
    it(`${name} resolves it once per render, like className`, async () => {
      const className = vi.fn(() => 'from-fn')
      const style = vi.fn(styleFn)
      render(
        <Player>
          <Slider
            className={className}
            style={style}
            render={(props) => <div {...props} data-testid="slider" />}
          />
        </Player>,
      )

      await screen.findByTestId('slider')
      expect(style).toHaveBeenCalledTimes(className.mock.calls.length)
    })
  }

  it('VolumeSlider', async () => {
    render(
      <Player>
        <VideoPlayer.VolumeSlider
          style={styleFn}
          render={(props) => <div {...props} data-testid="slider" />}
        />
      </Player>,
    )

    const slider = await screen.findByTestId('slider')
    expect(slider.style.color).toBe(color)
    expect(slider.style.getPropertyValue('--volume')).not.toBe('')
  })

  it('SeekSlider', async () => {
    render(
      <Player>
        <VideoPlayer.SeekSlider
          style={styleFn}
          render={(props) => <div {...props} data-testid="slider" />}
        />
      </Player>,
    )

    const slider = await screen.findByTestId('slider')
    expect(slider.style.color).toBe(color)
    expect(slider.style.getPropertyValue('--seek-progress')).not.toBe('')
  })

  it('SeekSliderTrack', async () => {
    render(
      <Player>
        <VideoPlayer.SeekSlider>
          <VideoPlayer.SeekSliderControl>
            <VideoPlayer.SeekSliderTrack
              style={styleFn}
              render={(props) => <div {...props} data-testid="track" />}
            />
          </VideoPlayer.SeekSliderControl>
        </VideoPlayer.SeekSlider>
      </Player>,
    )

    const track = await screen.findByTestId('track')
    expect(track.style.color).toBe(color)
    expect(track.style.position).toBe('relative')
  })

  it('SeekSliderProgress', async () => {
    render(
      <Player>
        <VideoPlayer.SeekSlider>
          <VideoPlayer.SeekSliderControl>
            <VideoPlayer.SeekSliderTrack>
              <VideoPlayer.SeekSliderProgress
                style={styleFn}
                render={(props) => <div {...props} data-testid="progress" />}
              />
            </VideoPlayer.SeekSliderTrack>
          </VideoPlayer.SeekSliderControl>
        </VideoPlayer.SeekSlider>
      </Player>,
    )

    const progress = await screen.findByTestId('progress')
    expect(progress.style.color).toBe(color)
    expect(progress.style.height).toBe('100%')
  })
})
