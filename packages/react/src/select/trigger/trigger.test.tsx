import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Select } from '../index.js'

function SelectFixture(props: {
  onTriggerClick?: (e: React.MouseEvent) => void
}) {
  return (
    <Select.Root>
      <Select.Trigger data-testid="trigger" onClick={props.onTriggerClick}>
        <Select.Value data-testid="value" placeholder="Select a fruit..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Surface data-testid="surface">
              <Select.List>
                <Select.Item data-testid="item-apple" value="apple">
                  Apple
                </Select.Item>
                <Select.Item data-testid="item-banana" value="banana">
                  Banana
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

describe('Select.Trigger', () => {
  it('opens with a consumer onClick present', async () => {
    const user = userEvent.setup()
    const onTriggerClick = vi.fn()

    render(<SelectFixture onTriggerClick={onTriggerClick} />)

    await user.click(screen.getByTestId('trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })
    expect(onTriggerClick).toHaveBeenCalledOnce()
  })

  it('consumer can opt out via preventBaseUIHandler', async () => {
    const user = userEvent.setup()
    const onTriggerClick = (e: React.MouseEvent) =>
      (
        e as unknown as {
          preventBaseUIHandler: () => void
        }
      ).preventBaseUIHandler()

    render(<SelectFixture onTriggerClick={onTriggerClick} />)

    await user.click(screen.getByTestId('trigger'))

    expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
  })

  it('closes on trigger press-down and does not reopen on release', async () => {
    const user = userEvent.setup()

    render(<SelectFixture />)
    const trigger = screen.getByTestId('trigger')

    // Open the select
    await user.click(trigger)
    await waitFor(() => {
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    // Press down on the trigger without releasing — the popup must close
    await user.pointer({ keys: '[MouseLeft>]', target: trigger })
    await waitFor(() => {
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })

    // Release the pointer — the resulting click must not reopen the popup
    await user.pointer('[/MouseLeft]')
    expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
  })
})
