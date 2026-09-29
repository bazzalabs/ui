import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  type ConformanceTargetProps,
  describeConformance,
} from '../../test/conformance.js'
import { Combobox } from './index.js'

function OpenCombobox(props: {
  children?: React.ReactNode
  input?: ConformanceTargetProps
  clear?: ConformanceTargetProps
  positioner?: ConformanceTargetProps & { layout?: 'input-embedded' }
  withWrapper?: ConformanceTargetProps
  surface?: ConformanceTargetProps
}) {
  const input = <Combobox.Input {...props.input} />
  return (
    <Combobox.Root defaultOpen defaultValue="apple">
      {props.withWrapper ? (
        <Combobox.InputWrapper {...props.withWrapper}>
          {input}
        </Combobox.InputWrapper>
      ) : (
        input
      )}
      <Combobox.Clear {...props.clear} />
      <Combobox.Portal>
        <Combobox.Positioner {...props.positioner}>
          <Combobox.Popup>
            <Combobox.Surface {...props.surface}>
              <Combobox.List>
                {props.children ?? (
                  <Combobox.Item value="apple">Apple</Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Surface>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

describeConformance('Combobox', [
  {
    name: 'Combobox.Input',
    render: (p) => <OpenCombobox input={p} />,
    state: { open: true },
  },
  {
    name: 'Combobox.InputWrapper',
    render: (p) => <OpenCombobox withWrapper={p} />,
    state: { open: true },
  },
  {
    name: 'Combobox.Clear',
    render: (p) => <OpenCombobox clear={p} />,
    state: { hasValue: true },
  },
  {
    name: 'Combobox.Positioner',
    render: (p) => <OpenCombobox positioner={p} />,
    state: { open: true },
  },
  {
    name: 'Combobox.Positioner (input-embedded)',
    render: (p) => (
      <OpenCombobox positioner={{ ...p, layout: 'input-embedded' }} />
    ),
    state: { open: true },
  },
  {
    name: 'Combobox.Surface',
    render: (p) => <OpenCombobox surface={p} />,
  },
  {
    name: 'Combobox.Item',
    render: (p) => (
      <OpenCombobox>
        <Combobox.Item value="apple" {...p}>
          Apple
        </Combobox.Item>
      </OpenCombobox>
    ),
    state: { disabled: false },
  },
  {
    name: 'Combobox.ItemLabel',
    render: (p) => (
      <OpenCombobox>
        <Combobox.Item value="apple">
          <Combobox.ItemLabel {...p}>Apple</Combobox.ItemLabel>
        </Combobox.Item>
      </OpenCombobox>
    ),
    state: { value: 'apple', selected: true },
  },
  {
    name: 'Combobox.ItemIndicator',
    render: (p) => (
      <OpenCombobox>
        <Combobox.Item value="apple">
          <Combobox.ItemIndicator keepMounted {...p} />
          Apple
        </Combobox.Item>
      </OpenCombobox>
    ),
    state: { selected: true },
  },
])

describe('Combobox.Positioner', () => {
  it('keeps its CSS variables alongside a style function', async () => {
    render(
      <OpenCombobox
        positioner={{
          'data-testid': 'positioner',
          style: () => ({ color: 'rgb(1, 2, 3)' }),
        }}
      />,
    )

    const positioner = await screen.findByTestId('positioner')
    expect(positioner.style.color).toBe('rgb(1, 2, 3)')
    expect(
      positioner.style.getPropertyValue('--combobox-input-height'),
    ).not.toBe('')
  })
})
