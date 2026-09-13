import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../index.js'

function Menu(props: {
  onTriggerClick?: (e: React.MouseEvent) => void
  openOnHover?: boolean
  delay?: number
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        data-testid="trigger"
        onClick={props.onTriggerClick}
        openOnHover={props.openOnHover}
        delay={props.delay}
      >
        Open
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface data-testid="surface">
              <DropdownMenu.List>
                <DropdownMenu.Item value="a">A</DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('DropdownMenu.Trigger', () => {
  describe('openOnHover', () => {
    it('opens when hovering the trigger', async () => {
      const user = userEvent.setup()

      render(<Menu openOnHover delay={0} />)

      await user.hover(screen.getByTestId('trigger'))

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })
    })

    it('does not open when openOnHover is not set', async () => {
      const user = userEvent.setup()

      render(<Menu />)

      await user.hover(screen.getByTestId('trigger'))
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })
  })

  it('opens with a consumer onClick present', async () => {
    const user = userEvent.setup()
    const onTriggerClick = vi.fn()

    render(<Menu onTriggerClick={onTriggerClick} />)

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

    render(<Menu onTriggerClick={onTriggerClick} />)

    await user.click(screen.getByTestId('trigger'))

    expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
  })

  it('still opens with no onClick', async () => {
    const user = userEvent.setup()

    render(<Menu />)

    await user.click(screen.getByTestId('trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })
  })
})
