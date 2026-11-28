import { act, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  type AsyncMenuCoordinatorValue,
  DropdownMenu,
  useAsyncMenuCoordinator,
} from '../../../../dropdown-menu/index.js'
import { createVanillaQueryLoader } from '../../../../loaders/vanilla.js'
import type {
  AsyncLoaderConfig,
  AsyncLoaderResult,
  ItemDef,
  LoaderComponentProps,
  NodeDef,
} from '../types.js'

// StrictMode, `<Activity>` and Fast Refresh run a loader's effects' cleanups
// and setups again without a new result. The loader's scope forgets what it
// reported in the cleanup, so the setup must report it again, even unchanged.

function item(value: string): ItemDef {
  return {
    kind: 'item',
    value,
    render: ({ props }) => (
      <DropdownMenu.Item {...props} data-testid={`item-${value.toLowerCase()}`}>
        {value}
      </DropdownMenu.Item>
    ),
  }
}

// What a cache hit (TanStack Query, SWR) or an already final custom loader
// shows on its first render, and never changes.
const CACHED: AsyncLoaderResult<NodeDef[]> = {
  data: [item('Cached')],
  error: null,
  status: 'success',
  fetchStatus: 'idle',
  loadingPhase: 'none',
  isLoading: false,
  isFetching: false,
  isInitialLoading: false,
  isRefetching: false,
  isPending: false,
  isSuccess: true,
  isError: false,
  isPaused: false,
  hasData: true,
  hasFetched: true,
}

function CachedLoader({ children }: LoaderComponentProps) {
  return <>{children(CACHED)}</>
}

const cached: AsyncLoaderConfig = {
  type: 'static',
  Loader: CachedLoader,
  loadStrategy: 'eager',
}

function Rows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

let coordinator: AsyncMenuCoordinatorValue | null = null
function Coordinator() {
  coordinator = useAsyncMenuCoordinator()
  return null
}

function Menu({
  loader,
  reveal,
  mode = 'visible',
}: {
  loader: AsyncLoaderConfig
  reveal?: 'stream' | 'block'
  mode?: 'visible' | 'hidden'
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <React.Activity mode={mode}>
              <DropdownMenu.Surface
                content={[item('Local')]}
                asyncContent={loader}
                asyncContentMode="append"
                asyncContentReveal={reveal}
              >
                <DropdownMenu.List>
                  <DropdownMenu.Loading data-testid="loading">
                    Loading
                  </DropdownMenu.Loading>
                  <Rows />
                </DropdownMenu.List>
                <Coordinator />
              </DropdownMenu.Surface>
            </React.Activity>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const settled = () =>
  (coordinator as AsyncMenuCoordinatorValue | null)?.rootReveal.settled

describe('a loader result that does not change, when effects reconnect', () => {
  for (const reveal of ['stream', 'block'] as const) {
    it(`shows it under StrictMode ('${reveal}')`, async () => {
      render(
        <React.StrictMode>
          <Menu loader={cached} reveal={reveal} />
        </React.StrictMode>,
      )
      await act(async () => {})
      expect(screen.getByTestId('item-cached')).toBeInTheDocument()
      expect(screen.getByTestId('item-local')).toBeInTheDocument()
      expect(settled()).toBe(true)
    })

    it(`shows it after <Activity> hides and shows the Surface ('${reveal}')`, async () => {
      const view = render(<Menu loader={cached} reveal={reveal} />)
      await act(async () => {})
      expect(screen.getByTestId('item-cached')).toBeInTheDocument()

      view.rerender(<Menu loader={cached} reveal={reveal} mode="hidden" />)
      await act(async () => {})
      view.rerender(<Menu loader={cached} reveal={reveal} />)
      await act(async () => {})
      expect(screen.getByTestId('item-cached')).toBeInTheDocument()
      expect(settled()).toBe(true)
    })
  }

  it("shows a vanilla query loader's first load as Loading under StrictMode", async () => {
    const loader = createVanillaQueryLoader({
      fetcher: () => new Promise<NodeDef[]>(() => {}),
      minQueryLength: 0,
    })
    render(
      <React.StrictMode>
        <Menu loader={loader} />
      </React.StrictMode>,
    )
    await act(async () => {})
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(settled()).toBe(false)
  })
})
