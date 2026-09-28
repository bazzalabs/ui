import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  describeStateProps,
  type StatePropsTargetProps,
} from '../../test/state-props.js'
import { Combobox } from './index.js'

function OpenCombobox(props: {
  children?: React.ReactNode
  input?: StatePropsTargetProps
  clear?: StatePropsTargetProps
  positioner?: StatePropsTargetProps & { layout?: 'input-embedded' }
  withWrapper?: StatePropsTargetProps
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
            <Combobox.Surface>
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

describeStateProps('Combobox', [
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
