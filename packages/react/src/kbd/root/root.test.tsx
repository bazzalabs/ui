import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Kbd } from '../index.js'

function getKeyText(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('kbd')).map(
    (key) => key.textContent ?? '',
  )
}

describe('Kbd.Root', () => {
  it('renders kbd elements with Apple platform labels', () => {
    const { container } = render(
      <Kbd.Root keys="mod+shift+o" platform="apple" data-testid="kbd" />,
    )

    expect(getKeyText(container)).toEqual(['⇧', '⌘', 'O'])
    expect(screen.getByTestId('kbd')).toHaveAttribute('data-platform', 'apple')
  })

  it('renders kbd elements with other platform labels', () => {
    const { container } = render(
      <Kbd.Root keys="mod+shift+o" platform="other" data-testid="kbd" />,
    )

    expect(getKeyText(container)).toEqual(['Ctrl', 'Shift', 'O'])
    expect(screen.getByTestId('kbd')).toHaveAttribute('data-platform', 'other')
  })

  it('renders a sequence with the default separator', () => {
    const { container } = render(<Kbd.Root keys="g i" platform="other" />)
    const separator = container.querySelector('[data-kbd-separator]')

    expect(getKeyText(container)).toEqual(['G', 'I'])
    expect(separator).toHaveTextContent('then')
  })

  it('renders a custom separator', () => {
    const { container } = render(
      <Kbd.Root
        keys="g i"
        platform="other"
        separator={<span data-testid="custom-separator">or</span>}
      />,
    )

    expect(container.querySelector('[data-kbd-separator]')).toContainElement(
      screen.getByTestId('custom-separator'),
    )
    expect(screen.getByTestId('custom-separator')).toHaveTextContent('or')
  })

  it('adds root and platform data attributes', () => {
    render(<Kbd.Root keys="escape" platform="apple" data-testid="kbd" />)

    expect(screen.getByTestId('kbd')).toHaveAttribute('data-kbd-root', '')
    expect(screen.getByTestId('kbd')).toHaveAttribute('data-platform', 'apple')
  })
})
