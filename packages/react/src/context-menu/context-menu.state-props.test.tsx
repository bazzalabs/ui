import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  describeStateProps,
  type StatePropsTargetProps,
} from '../../test/state-props.js'
import { ContextMenu } from './index.js'

function Menu(props: { trigger: StatePropsTargetProps }) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger {...props.trigger}>Right-click</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup>
            <ContextMenu.Surface>
              <ContextMenu.List>
                <ContextMenu.Item>Item</ContextMenu.Item>
              </ContextMenu.List>
            </ContextMenu.Surface>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

describeStateProps('ContextMenu', [
  {
    name: 'ContextMenu.Trigger',
    render: (p) => <Menu trigger={p} />,
    state: { open: false, disabled: false },
  },
])

describe('ContextMenu.Trigger', () => {
  it('keeps its touch styles alongside a style function', async () => {
    render(
      <Menu
        trigger={{
          'data-testid': 'trigger',
          style: () => ({ color: 'rgb(1, 2, 3)' }),
        }}
      />,
    )

    const trigger = await screen.findByTestId('trigger')
    expect(trigger.style.color).toBe('rgb(1, 2, 3)')
    expect(trigger.style.userSelect).toBe('none')
  })
})
