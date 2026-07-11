import { useForm as useTanStackForm } from '@tanstack/react-form'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Controller, useForm as useReactHookForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { Select } from '../index.js'

// ============================================================================
// Test Fixtures - Shared Select Component
// ============================================================================

function SelectField({
  name,
  value,
  onChange,
  required,
}: {
  name: string
  value?: string
  onChange?: (value: string) => void
  required?: boolean
}) {
  return (
    <Select.Root
      name={name}
      value={value}
      onValueChange={onChange}
      required={required}
      items={{ apple: 'Apple', banana: 'Banana', cherry: 'Cherry' }}
    >
      <Select.Trigger data-testid="trigger">
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
                <Select.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

function MultiSelectField({
  name,
  values,
  onChange,
}: {
  name: string
  values?: string[]
  onChange?: (values: string[]) => void
}) {
  return (
    <Select.Root
      multiple
      name={name}
      values={values}
      onValuesChange={onChange}
      items={{ apple: 'Apple', banana: 'Banana', cherry: 'Cherry' }}
    >
      <Select.Trigger data-testid="trigger">
        <Select.Value data-testid="value" placeholder="Select fruits..." />
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
                <Select.Item data-testid="item-cherry" value="cherry">
                  Cherry
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

// ============================================================================
// React Hook Form Integration Tests
// ============================================================================

describe('Select + React Hook Form', () => {
  interface FormData {
    fruit: string
  }

  function ReactHookFormSelect({
    onSubmit,
    defaultValue,
  }: {
    onSubmit: (data: FormData) => void
    defaultValue?: string
  }) {
    const { control, handleSubmit } = useReactHookForm<FormData>({
      defaultValues: {
        fruit: defaultValue ?? '',
      },
    })

    return (
      <form data-testid="form" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="fruit"
          control={control}
          rules={{ required: 'Please select a fruit' }}
          render={({ field }) => (
            <SelectField
              name={field.name}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <button type="submit" data-testid="submit">
          Submit
        </button>
      </form>
    )
  }

  it('integrates with Controller for controlled value', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ReactHookFormSelect onSubmit={onSubmit} />)

    // Open select and choose a value
    const trigger = screen.getByTestId('trigger')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('item-banana'))

    // Value should be updated
    await waitFor(() => {
      expect(screen.getByTestId('value')).toHaveTextContent('Banana')
    })

    // Submit the form
    await user.click(screen.getByTestId('submit'))

    expect(onSubmit).toHaveBeenCalledWith(
      { fruit: 'banana' },
      expect.anything(),
    )
  })

  it('uses hidden input for native form submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ReactHookFormSelect onSubmit={onSubmit} defaultValue="apple" />)

    // Hidden input should have the value
    const hiddenInput = document.querySelector(
      'input[type="hidden"][name="fruit"]',
    )
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput).toHaveValue('apple')

    // Change value
    const trigger = screen.getByTestId('trigger')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('item-cherry'))

    // Hidden input should be updated
    await waitFor(() => {
      expect(hiddenInput).toHaveValue('cherry')
    })
  })

  it('works with default values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ReactHookFormSelect onSubmit={onSubmit} defaultValue="banana" />)

    // Should display the default value
    expect(screen.getByTestId('value')).toHaveTextContent('Banana')

    // Submit without changing
    await user.click(screen.getByTestId('submit'))

    expect(onSubmit).toHaveBeenCalledWith(
      { fruit: 'banana' },
      expect.anything(),
    )
  })

  describe('multi-select', () => {
    interface MultiFormData {
      fruits: string[]
    }

    function ReactHookFormMultiSelect({
      onSubmit,
      defaultValues,
    }: {
      onSubmit: (data: MultiFormData) => void
      defaultValues?: string[]
    }) {
      const { control, handleSubmit } = useReactHookForm<MultiFormData>({
        defaultValues: {
          fruits: defaultValues ?? [],
        },
      })

      return (
        <form data-testid="form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="fruits"
            control={control}
            render={({ field }) => (
              <MultiSelectField
                name={field.name}
                values={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <button type="submit" data-testid="submit">
            Submit
          </button>
        </form>
      )
    }

    it('handles multi-select values', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<ReactHookFormMultiSelect onSubmit={onSubmit} />)

      // Open and select multiple items
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-apple'))
      await user.click(screen.getByTestId('item-cherry'))

      // Close and submit
      await user.keyboard('{Escape}')
      await user.click(screen.getByTestId('submit'))

      expect(onSubmit).toHaveBeenCalledWith(
        { fruits: ['apple', 'cherry'] },
        expect.anything(),
      )
    })

    it('renders multiple hidden inputs for multi-select', async () => {
      const _user = userEvent.setup()
      const onSubmit = vi.fn()
      render(
        <ReactHookFormMultiSelect
          onSubmit={onSubmit}
          defaultValues={['apple', 'banana']}
        />,
      )

      const hiddenInputs = document.querySelectorAll(
        'input[type="hidden"][name="fruits"]',
      )
      expect(hiddenInputs).toHaveLength(2)

      const values = Array.from(hiddenInputs).map(
        (input) => (input as HTMLInputElement).value,
      )
      expect(values).toContain('apple')
      expect(values).toContain('banana')
    })
  })
})

// ============================================================================
// TanStack Form Integration Tests
// ============================================================================

describe('Select + TanStack Form', () => {
  function TanStackFormSelect({
    onSubmit,
    defaultValue,
  }: {
    onSubmit: (data: { fruit: string }) => void
    defaultValue?: string
  }) {
    const form = useTanStackForm({
      defaultValues: {
        fruit: defaultValue ?? '',
      },
      onSubmit: async ({ value }) => {
        onSubmit(value)
      },
    })

    return (
      <form
        data-testid="form"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <form.Field name="fruit">
          {(field) => (
            <SelectField
              name={field.name}
              value={field.state.value}
              onChange={(value) => field.handleChange(value)}
            />
          )}
        </form.Field>
        <button type="submit" data-testid="submit">
          Submit
        </button>
      </form>
    )
  }

  it('integrates with TanStack Form field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TanStackFormSelect onSubmit={onSubmit} />)

    // Open select and choose a value
    const trigger = screen.getByTestId('trigger')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('item-apple'))

    // Value should be updated
    await waitFor(() => {
      expect(screen.getByTestId('value')).toHaveTextContent('Apple')
    })

    // Submit the form
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ fruit: 'apple' })
    })
  })

  it('works with default values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TanStackFormSelect onSubmit={onSubmit} defaultValue="cherry" />)

    // Should display the default value
    expect(screen.getByTestId('value')).toHaveTextContent('Cherry')

    // Submit without changing
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ fruit: 'cherry' })
    })
  })

  it('updates form state when selection changes', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TanStackFormSelect onSubmit={onSubmit} defaultValue="apple" />)

    // Change selection
    const trigger = screen.getByTestId('trigger')
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByTestId('surface')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('item-banana'))

    // Value should change
    await waitFor(() => {
      expect(screen.getByTestId('value')).toHaveTextContent('Banana')
    })

    // Submit with new value
    await user.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ fruit: 'banana' })
    })
  })

  describe('multi-select', () => {
    function TanStackFormMultiSelect({
      onSubmit,
      defaultValues,
    }: {
      onSubmit: (data: { fruits: string[] }) => void
      defaultValues?: string[]
    }) {
      const form = useTanStackForm({
        defaultValues: {
          fruits: defaultValues ?? [],
        },
        onSubmit: async ({ value }) => {
          onSubmit(value)
        },
      })

      return (
        <form
          data-testid="form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field name="fruits">
            {(field) => (
              <MultiSelectField
                name={field.name}
                values={field.state.value}
                onChange={(values) => field.handleChange(values)}
              />
            )}
          </form.Field>
          <button type="submit" data-testid="submit">
            Submit
          </button>
        </form>
      )
    }

    it('handles multi-select values', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<TanStackFormMultiSelect onSubmit={onSubmit} />)

      // Open and select multiple items
      const trigger = screen.getByTestId('trigger')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('surface')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('item-banana'))
      await user.click(screen.getByTestId('item-cherry'))

      // Close and submit
      await user.keyboard('{Escape}')
      await user.click(screen.getByTestId('submit'))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          fruits: ['banana', 'cherry'],
        })
      })
    })

    it('works with default multi-select values', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(
        <TanStackFormMultiSelect
          onSubmit={onSubmit}
          defaultValues={['apple', 'cherry']}
        />,
      )

      // Submit with defaults
      await user.click(screen.getByTestId('submit'))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          fruits: ['apple', 'cherry'],
        })
      })
    })
  })
})
