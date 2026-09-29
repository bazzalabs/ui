import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  type ConformanceTargetProps,
  describeConformance,
} from '../../test/conformance.js'
import { Select } from './index.js'

function OpenSelect(props: {
  children?: React.ReactNode
  trigger?: ConformanceTargetProps
  value?: ConformanceTargetProps
  positioner?: ConformanceTargetProps
  popup?: ConformanceTargetProps
  surface?: ConformanceTargetProps
}) {
  return (
    <Select.Root defaultOpen defaultValue="apple">
      <Select.Trigger {...props.trigger}>
        <Select.Value placeholder="Pick" {...props.value} />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner {...props.positioner}>
          <Select.Popup {...props.popup}>
            <Select.Surface {...props.surface}>
              <Select.List>
                {props.children ?? (
                  <Select.Item value="apple">Apple</Select.Item>
                )}
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

describeConformance('Select', [
  {
    name: 'Select.Trigger',
    render: (p) => <OpenSelect trigger={p} />,
    state: { open: true, placeholder: false },
  },
  {
    name: 'Select.Value',
    render: (p) => <OpenSelect value={p} />,
    state: { value: 'apple', hasValue: true },
  },
  {
    name: 'Select.Positioner',
    render: (p) => <OpenSelect positioner={p} />,
    state: { open: true },
  },
  {
    name: 'Select.Popup',
    render: (p) => <OpenSelect popup={p} />,
    state: { open: true },
  },
  {
    name: 'Select.Surface',
    render: (p) => <OpenSelect surface={p} />,
  },
  {
    name: 'Select.Item',
    render: (p) => (
      <OpenSelect>
        <Select.Item value="apple" {...p}>
          Apple
        </Select.Item>
      </OpenSelect>
    ),
    state: { selected: true, disabled: false },
  },
  {
    name: 'Select.ItemLabel',
    render: (p) => (
      <OpenSelect>
        <Select.Item value="apple">
          <Select.ItemLabel {...p}>Apple</Select.ItemLabel>
        </Select.Item>
      </OpenSelect>
    ),
    state: { value: 'apple', selected: true },
  },
  {
    name: 'Select.ItemIndicator',
    render: (p) => (
      <OpenSelect>
        <Select.Item value="apple">
          <Select.ItemIndicator {...p} />
          Apple
        </Select.Item>
      </OpenSelect>
    ),
    state: { selected: true },
  },
])

describe('Select.Positioner', () => {
  it('keeps its own styles alongside a style function', async () => {
    render(
      <OpenSelect
        positioner={{
          'data-testid': 'positioner',
          style: () => ({ color: 'rgb(1, 2, 3)' }),
        }}
      />,
    )

    const positioner = await screen.findByTestId('positioner')
    expect(positioner.style.color).toBe('rgb(1, 2, 3)')
    // Base UI's anchored positioning styles are still applied.
    expect(positioner.style.position).not.toBe('')
  })
})
