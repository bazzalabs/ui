import {
  generateTheme,
  getThemeDeclarations,
  serializeTheme,
} from '@bazza-ui/colors'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ColorPlayground } from './color-playground'

const variants = [
  'primary-neutral',
  'primary-accent',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
] as const
const states = [
  'rest',
  'hover',
  'active',
  'focus-visible',
  'disabled',
  'loading',
  'interactive',
] as const
const sizes = [
  'default',
  'xs',
  'sm',
  'lg',
  'icon',
  'icon-xs',
  'icon-sm',
  'icon-lg',
] as const

describe('color playground', () => {
  it('regenerates from deferred controlled input', async () => {
    render(<ColorPlayground />)
    fireEvent.change(screen.getByLabelText('Accent'), {
      target: { value: '#e11d48' },
    })

    const expected = serializeTheme(
      generateTheme({
        neutral: '#737373',
        accent: '#e11d48',
        contrast: 50,
        focusStrategy: 'accent',
        stateStrategy: 'overlay',
        prefix: 'bui',
      }),
    )
    await waitFor(() =>
      expect(
        document.querySelector('[data-color-playground-theme]')?.textContent,
      ).toBe(expected),
    )
  })

  it('places an invalid field error exactly and retains the last valid preview', async () => {
    render(<ColorPlayground />)
    const style = document.querySelector('[data-color-playground-theme]')
    const validCss = style?.textContent

    fireEvent.change(screen.getByLabelText('Neutral'), {
      target: { value: 'not-a-color' },
    })

    const error = await screen.findByRole('alert')
    expect(error).toHaveAttribute('id', 'neutral-error')
    expect(screen.getByLabelText('Neutral')).toHaveAttribute(
      'aria-describedby',
      'neutral-error',
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing last valid theme',
    )
    expect(style?.textContent).toBe(validCss)
  })

  it('clears a field error when reset restores the last valid input', async () => {
    render(<ColorPlayground />)
    fireEvent.change(screen.getByLabelText('Neutral'), {
      target: { value: 'not-a-color' },
    })
    await screen.findByRole('alert')

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(screen.getByLabelText('Neutral')).toHaveAttribute(
      'aria-invalid',
      'false',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Generated')
  })

  it('regenerates focus and state strategies', async () => {
    render(<ColorPlayground />)
    fireEvent.change(screen.getByLabelText('Focus strategy'), {
      target: { value: 'neutral' },
    })
    fireEvent.change(screen.getByLabelText('State strategy'), {
      target: { value: 'explicit' },
    })

    const expected = serializeTheme(
      generateTheme({
        neutral: '#737373',
        accent: '#2563eb',
        contrast: 50,
        focusStrategy: 'neutral',
        stateStrategy: 'explicit',
        prefix: 'bui',
      }),
    )
    await waitFor(() =>
      expect(
        document.querySelector('[data-color-playground-theme]')?.textContent,
      ).toBe(expected),
    )
  })

  it('applies preset color fields while preserving strategies and prefix', async () => {
    render(<ColorPlayground />)
    fireEvent.change(screen.getByLabelText('Focus strategy'), {
      target: { value: 'neutral' },
    })
    fireEvent.change(screen.getByLabelText('State strategy'), {
      target: { value: 'explicit' },
    })
    fireEvent.change(screen.getByLabelText('Variable prefix'), {
      target: { value: 'brand' },
    })
    fireEvent.change(screen.getByLabelText('Preset'), {
      target: { value: 'warm-red' },
    })

    expect(screen.getByLabelText('Focus strategy')).toHaveValue('neutral')
    expect(screen.getByLabelText('State strategy')).toHaveValue('explicit')
    expect(screen.getByLabelText('Variable prefix')).toHaveValue('brand')
    expect(screen.getByLabelText('Accent')).toHaveValue('#e11d48')
    const expected = serializeTheme(
      generateTheme({
        neutral: 'oklch(0.60 0.025 55)',
        accent: '#e11d48',
        contrast: 50,
        focusStrategy: 'neutral',
        stateStrategy: 'explicit',
        prefix: 'brand',
      }),
    )
    await waitFor(() =>
      expect(
        document.querySelector('[data-color-playground-theme]')?.textContent,
      ).toBe(expected),
    )
  })

  it('renders both literal theme scopes and every matrix marker', () => {
    const { container } = render(<ColorPlayground />)
    expect(
      container.querySelector('[data-bui-theme="light"]'),
    ).toBeInTheDocument()
    expect(
      container.querySelector('[data-bui-theme="dark"]'),
    ).toBeInTheDocument()

    for (const variant of variants) {
      expect(screen.getAllByTestId(`matrix-variant-${variant}`)).toHaveLength(2)
      for (const state of states)
        expect(
          screen.getAllByTestId(`matrix-${variant}-${state}`),
        ).toHaveLength(2)
    }
    for (const size of sizes)
      expect(screen.getAllByTestId(`matrix-size-${size}`)).toHaveLength(2)

    const overflow = screen.getByTestId('light-matrix-overflow')
    expect(overflow).toHaveClass('overflow-x-auto')
    expect(overflow).toHaveAttribute('tabindex', '0')
    expect(overflow).toHaveAccessibleName('Light button state matrix')

    expect(
      screen.getAllByTestId('matrix-primary-neutral-rest')[0],
    ).toHaveAttribute('inert')
    expect(screen.getAllByTestId('matrix-size-default')[0]).toHaveAttribute(
      'inert',
    )
    expect(
      screen.getAllByTestId('matrix-primary-neutral-hover')[0],
    ).not.toHaveClass('underline')
    expect(screen.getAllByTestId('matrix-link-hover')[0]).toHaveClass(
      'underline',
    )

    const disabled = screen.getAllByTestId('matrix-primary-neutral-disabled')[0]
    const loading = screen.getAllByTestId('matrix-primary-neutral-loading')[0]
    expect(disabled).not.toHaveAttribute('inert')
    expect(disabled).toBeDisabled()
    expect(loading).not.toHaveAttribute('inert')
    expect(loading).toBeDisabled()
    expect(loading).toHaveAttribute('aria-busy', 'true')

    expect(
      screen.getByRole('region', { name: 'WCAG text contrast results' }),
    ).toHaveAttribute('tabindex', '0')
    expect(
      screen.getByRole('region', { name: 'light raw theme declarations' }),
    ).toHaveAttribute('tabindex', '0')
  })

  it('switches raw declarations through getThemeDeclarations', () => {
    render(<ColorPlayground />)
    const theme = generateTheme({
      neutral: '#737373',
      accent: '#2563eb',
      contrast: 50,
      focusStrategy: 'accent',
      stateStrategy: 'overlay',
      prefix: 'bui',
    })
    const firstLight = getThemeDeclarations(theme, 'light')[0]
    const firstDark = getThemeDeclarations(theme, 'dark')[0]
    expect(firstLight).toBeDefined()
    expect(firstDark).toBeDefined()

    const rows = screen.getAllByTestId('theme-declaration')
    expect(within(rows[0]!).getByText(firstLight!.value)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Inspector mode'), {
      target: { value: 'dark' },
    })
    const darkRows = screen.getAllByTestId('theme-declaration')
    expect(within(darkRows[0]!).getByText(firstDark!.value)).toBeInTheDocument()
  })
})
