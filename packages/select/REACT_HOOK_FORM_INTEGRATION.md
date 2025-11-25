# React Hook Form Integration Guide

This guide shows how to integrate the Select component with React Hook Form and Zod validation.

## Installation

```bash
bun add react-hook-form @hookform/resolvers zod
```

## Basic Example

### 1. Define Your Zod Schema

```typescript
import { z } from 'zod'

const formSchema = z.object({
  country: z
    .string()
    .min(1, 'Please select your country.'),
  
  language: z
    .string()
    .min(1, 'Please select your preferred language.')
    .refine((val) => val !== 'auto', {
      message: 'Auto-detection is not allowed. Please select a specific language.',
    }),
})

type FormValues = z.infer<typeof formSchema>
```

### 2. Setup React Hook Form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function MyForm() {
  const {
    watch,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country: '',
      language: '',
    },
    mode: 'onBlur', // Validate on blur for better UX
  })

  const onSubmit = (data: FormValues) => {
    console.log(data)
  }
}
```

### 3. Create a Reusable FormField Component

```typescript
interface FormFieldProps {
  id: string
  label: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

function FormField({
  id,
  label,
  description,
  error,
  required,
  children,
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const descriptionId = description ? `${id}-description` : undefined

  return (
    <div className="space-y-2" data-invalid={!!error}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <div>{children}</div>
      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}
```

### 4. Use Select with React Hook Form

```typescript
const watchedValues = watch()

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <FormField
      id="country"
      label="Country"
      description="Select the country where you're located."
      error={errors.country?.message}
      required
    >
      <Select
        value={watchedValues.country}
        onValueChange={(value) => setValue('country', value)}
        placeholder="Select your country..."
        items={countries}
        aria-invalid={!!errors.country}
        aria-describedby={
          errors.country ? 'country-error' : 'country-description'
        }
      />
    </FormField>

    <Button type="submit">Submit</Button>
  </form>
)
```

## Error Styling

To style the Select based on error state, use the `aria-invalid` attribute with Tailwind CSS:

```tsx
<Button
  variant="outline"
  className={cn(
    "w-full",
    // Error state styling
    "aria-invalid:border-destructive",
    "aria-invalid:ring-destructive/20",
    "dark:aria-invalid:ring-destructive/40"
  )}
  aria-invalid={!!errors.country}
>
  {/* Select trigger content */}
</Button>
```

Or use `asChild` to apply the Select's trigger to your custom button:

```tsx
<Select
  value={watchedValues.country}
  onValueChange={(value) => setValue('country', value)}
  asChild
  aria-invalid={!!errors.country}
>
  <Button
    variant="outline"
    className="aria-invalid:border-destructive aria-invalid:ring-destructive/20"
  >
    {watchedValues.country || 'Select country...'}
  </Button>
</Select>
```

## Validation Modes

React Hook Form supports different validation modes:

```typescript
const form = useForm({
  resolver: zodResolver(formSchema),
  mode: 'onChange',  // Validate on every change
  // mode: 'onBlur',    // Validate on blur (recommended)
  // mode: 'onSubmit',  // Validate on submit only
  // mode: 'onTouched', // Validate after first blur, then on change
  // mode: 'all',       // Validate on blur and change
})
```

**Recommended**: Use `onBlur` for the best user experience. It doesn't interrupt the user while typing, but provides feedback after they've finished with a field.

## MultiSelect with React Hook Form

For MultiSelect, use array validation:

```typescript
const formSchema = z.object({
  colors: z
    .array(z.string())
    .min(2, 'Please select at least 2 colors.')
    .max(4, 'Please select no more than 4 colors.'),
})
```

```tsx
<FormField
  id="colors"
  label="Favorite Colors"
  error={errors.colors?.message}
>
  <MultiSelect
    value={watchedValues.colors}
    onValueChange={(value) => setValue('colors', value)}
    min={2}
    max={4}
    items={colorOptions}
    aria-invalid={!!errors.colors}
  />
</FormField>
```

## Custom Refinements

Use Zod's `refine` method for custom validation:

```typescript
const formSchema = z.object({
  country: z
    .string()
    .min(1, 'Please select a country.')
    .refine((val) => {
      // Custom validation logic
      return supportedCountries.includes(val)
    }, {
      message: 'This country is not supported.',
    }),
})
```

## Accessibility Best Practices

1. **Always provide labels**: Use `<Label>` for all form fields
2. **Link errors with aria-describedby**: Connect error messages to inputs
3. **Use aria-invalid**: Set `aria-invalid={!!error}` on inputs
4. **Provide required indicators**: Show asterisks or "(required)" text
5. **Use role="alert"**: Make error messages live regions for screen readers

```tsx
<Select
  aria-label="Country"  // If no visible label
  aria-labelledby="country-label"  // If using visible label
  aria-describedby={error ? 'country-error' : 'country-description'}
  aria-invalid={!!error}
  aria-required={true}
/>
```

## Complete Example

See `/apps/web/components/examples/select/form-react-hook-form.tsx` for a full working example demonstrating:

- React Hook Form setup
- Zod validation
- Error handling and display
- Custom refinements
- Multiple select fields
- Form submission
- Reset functionality
- Current values display

## Troubleshooting

### Select value not updating

Make sure to use `watch()` to get the current form values:

```typescript
const watchedValues = watch()

<Select
  value={watchedValues.country}  // Use watched value
  onValueChange={(value) => setValue('country', value)}
/>
```

### Validation not triggering

Set the validation mode:

```typescript
const form = useForm({
  mode: 'onBlur',  // or 'onChange'
})
```

### Error messages not showing

1. Check that error exists: `errors.fieldName?.message`
2. Verify aria-describedby links to error id
3. Ensure FormField component renders error conditionally

## Further Reading

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [shadcn/ui Form Patterns](https://ui.shadcn.com/docs/forms/react-hook-form)
