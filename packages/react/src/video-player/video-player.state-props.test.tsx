import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { describeStateProps } from '../../test/state-props.js'
import { VideoPlayer } from './index.js'

// Only the slider parts are covered here: they inherit Base UI Slider props,
// which accept a state-function `style`.

function Player(props: { children: React.ReactNode }) {
  return (
    <VideoPlayer.Root>
      <VideoPlayer.Video src="/video.mp4" />
      {props.children}
    </VideoPlayer.Root>
  )
}

const sliderState = { orientation: 'horizontal' }

describeStateProps('VideoPlayer', [
  {
    name: 'VideoPlayer.VolumeSlider',
    render: (p) => (
      <Player>
        <VideoPlayer.VolumeSlider {...p} />
      </Player>
    ),
    state: sliderState,
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
    name: 'VideoPlayer.SeekSlider',
    render: (p) => (
      <Player>
        <VideoPlayer.SeekSlider {...p} />
      </Player>
    ),
    state: sliderState,
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
