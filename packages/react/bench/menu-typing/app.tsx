import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { DropdownMenu } from '../../src/dropdown-menu/index.js'
import type { NodeDef } from '../../src/internal/popup-menu/index.js'

export type BenchMode = 'jsx' | 'data'

export interface BenchConfig {
  mode: BenchMode
  rows: number
}

declare global {
  interface Window {
    __benchReadyAt?: number
  }
}

function readConfig(): BenchConfig {
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')
  if (mode !== 'jsx' && mode !== 'data') {
    throw new Error(`Unknown mode "${mode}"`)
  }
  const rows = Number(params.get('rows') ?? 1000)
  return { mode, rows }
}

function rowLabel(index: number) {
  return `Label ${String(index + 1).padStart(4, '0')}`
}

function RowContent({ label }: { label: string }) {
  return (
    <>
      <span className="dot" />
      <span>{label}</span>
    </>
  )
}

function JsxRows({ rows }: { rows: number }) {
  return Array.from({ length: rows }, (_, index) => {
    const label = rowLabel(index)
    return (
      <DropdownMenu.Item key={label} value={label} className="row">
        <RowContent label={label} />
      </DropdownMenu.Item>
    )
  })
}

function useDataContent(rows: number): NodeDef[] {
  return React.useMemo(
    () =>
      Array.from({ length: rows }, (_, index): NodeDef => {
        const label = rowLabel(index)
        return {
          kind: 'item',
          id: label,
          value: label,
          render: ({ props }) => (
            <DropdownMenu.Item {...props} className="row">
              <RowContent label={label} />
            </DropdownMenu.Item>
          ),
        }
      }),
    [rows],
  )
}

function DataRows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return nodes.map(renderNode)
}

function Ready() {
  React.useEffect(() => {
    window.__benchReadyAt = performance.now()
  }, [])
  return null
}

function BenchMenu({ config }: { config: BenchConfig }) {
  const content = useDataContent(config.mode === 'data' ? config.rows : 0)

  return (
    <DropdownMenu.Root defaultOpen modal={false}>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup className="popup">
            {config.mode === 'data' ? (
              <DropdownMenu.Surface content={content}>
                <DropdownMenu.Input className="input" />
                <DropdownMenu.List className="list">
                  <DataRows />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            ) : (
              <DropdownMenu.Surface>
                <DropdownMenu.Input className="input" />
                <DropdownMenu.List className="list">
                  <JsxRows rows={config.rows} />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            )}
            <Ready />
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root')
createRoot(container).render(<BenchMenu config={readConfig()} />)
