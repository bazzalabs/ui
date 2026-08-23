/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'

import { Button, buttonVariants } from './index'

describe('colors button', () => {
  it('resolves omitted and null variants to primary-neutral', () => {
    const { rerender } = render(<Button>Omitted</Button>)
    expect(screen.getByRole('button')).toHaveAttribute(
      'data-variant',
      'primary-neutral',
    )

    rerender(<Button variant={null}>Null</Button>)
    expect(screen.getByRole('button')).toHaveAttribute(
      'data-variant',
      'primary-neutral',
    )
  })

  it('supports complete local state classes for every variant', () => {
    const stateMarkers = [
      'bg-[var(--button-background)]',
      'text-[var(--button-foreground)]',
      '[box-shadow:var(--button-shadow)]',
      'hover:bg-[var(--button-background-hover)]',
      'hover:text-[var(--button-foreground-hover)]',
      'hover:[box-shadow:var(--button-shadow-hover)]',
      'active:bg-[var(--button-background-active)]',
      'active:text-[var(--button-foreground-active)]',
      'active:translate-y-px',
      'active:[box-shadow:var(--button-shadow-active)]',
      'focus-visible:[box-shadow:var(--button-shadow-focus)]',
    ]
    for (const variant of [
      'primary-neutral',
      'primary-accent',
      'destructive',
      'outline',
      'secondary',
      'ghost',
      'link',
    ] as const) {
      const classes = buttonVariants({ variant })
      for (const marker of stateMarkers) expect(classes).toContain(marker)
    }

    const sizes = {
      default: 'h-9 gap-2 px-4 has-[>svg]:px-3',
      xs: 'h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5',
      sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
      lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
      icon: 'size-9',
      'icon-xs': 'size-6 rounded-md',
      'icon-sm': 'size-8',
      'icon-lg': 'size-10',
    } as const
    for (const [size, classes] of Object.entries(sizes)) {
      expect(buttonVariants({ size: size as keyof typeof sizes })).toContain(
        classes,
      )
    }

    expect(buttonVariants({ variant: 'link' })).toContain('hover:underline')
  })

  it('keeps owned selectors after caller props', () => {
    render(
      <Button data-slot="caller" data-variant="caller">
        Owned
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-slot', 'button')
    expect(button).toHaveAttribute('data-variant', 'primary-neutral')
  })

  it('preserves caller busy and disabled values when not loading', () => {
    render(
      <Button aria-busy="false" disabled>
        Disabled
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'false')
    expect(button).toBeDisabled()
  })

  it('keeps children readable while loading a native button', () => {
    render(<Button loading>Save changes</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveTextContent('Save changes')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    expect(button.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
  })

  it('keeps loading accessibility with a composed non-native button', () => {
    const onClick = vi.fn()
    render(
      <Button
        loading
        nativeButton={false}
        onClick={onClick}
        // biome-ignore lint/a11y/useAnchorContent: Base UI supplies the composed content.
        // biome-ignore lint/a11y/useValidAnchor: The composed anchor is intentionally href-less.
        render={<a />}
      >
        Save changes
      </Button>,
    )
    const link = screen.getByRole('button')

    expect(link).toHaveTextContent('Save changes')
    expect(link).toHaveAttribute('aria-busy', 'true')
    expect(link).toHaveAttribute('aria-disabled', 'true')
    expect(link).toHaveAttribute('data-disabled')
    expect(link.className).toContain('data-[disabled]:pointer-events-none')
    expect(link.className).toContain('data-[disabled]:opacity-50')
    fireEvent.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })
})
