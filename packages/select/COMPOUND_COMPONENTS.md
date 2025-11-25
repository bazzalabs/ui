# Compound Components API

The `createSelect` and `createMultiSelect` factory functions now return compound components with attached `Trigger` and `Value` sub-components. This allows for more flexible composition and customization of the select trigger.

## Benefits

- **Full control over trigger styling**: Use `asChild` to pass your own button component
- **Flexible composition**: Mix and match `Select.Trigger` and `Select.Value` as needed
- **Type-safe**: Full TypeScript support for all patterns
- **Backward compatible**: The existing API continues to work without any changes

## Usage Examples

### Example 1: Default Trigger with Custom Value

```tsx
import { Select } from '@bazza-ui/select'

function MyComponent() {
  return (
    <Select items={items} value={value} onValueChange={setValue}>
      <Select.Trigger>
        <Select.Value placeholder="Choose an option..." />
      </Select.Trigger>
    </Select>
  )
}
```

### Example 2: Custom Button with asChild

```tsx
import { Select } from '@bazza-ui/select'
import { Button } from './ui/button'
import { ChevronDown } from 'lucide-react'

function MyComponent() {
  return (
    <Select items={items} value={value} onValueChange={setValue}>
      <Select.Trigger asChild>
        <Button variant="outline">
          <Select.Value placeholder="Choose..." />
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </Select.Trigger>
    </Select>
  )
}
```

### Example 3: Fully Custom Trigger

```tsx
import { Select } from '@bazza-ui/select'

function MyComponent() {
  return (
    <Select items={items} value={value} onValueChange={setValue}>
      <Select.Trigger asChild>
        <button className="custom-select-button">
          <span className="icon">🎯</span>
          <Select.Value placeholder="Pick one" />
          <span className="chevron">▼</span>
        </button>
      </Select.Trigger>
    </Select>
  )
}
```

### Example 4: Form Integration

Form props (`name`, `form`, `required`) should be passed to the root `Select` component:

```tsx
import { Select } from '@bazza-ui/select'

function MyForm() {
  return (
    <form>
      <Select
        name="fruit"
        required
        items={fruits}
        value={value}
        onValueChange={setValue}
      >
        <Select.Trigger asChild>
          <button>
            <Select.Value placeholder="Select a fruit" />
          </button>
        </Select.Trigger>
      </Select>
    </form>
  )
}
```

### Example 5: MultiSelect with Compound Components

```tsx
import { MultiSelect } from '@bazza-ui/select'

function MyComponent() {
  return (
    <MultiSelect items={items} value={values} onValueChange={setValues}>
      <MultiSelect.Trigger asChild>
        <button>
          <MultiSelect.Value placeholder="Select multiple..." />
        </button>
      </MultiSelect.Trigger>
    </MultiSelect>
  )
}
```

## Legacy API (Still Supported)

The existing API continues to work without any changes:

```tsx
// This still works exactly as before
<Select
  items={items}
  value={value}
  onValueChange={setValue}
  placeholder="Select..."
/>

// Custom trigger without compound components
<Select items={items} value={value} onValueChange={setValue}>
  <Button>Custom Trigger</Button>
</Select>
```

## API Reference

### Select.Trigger

Props:
- `children?: React.ReactNode` - The trigger content
- `asChild?: boolean` - Whether to use the child as the trigger element
- `disabled?: boolean` - Whether the trigger is disabled
- `aria-label?: string` - Accessible label
- `aria-labelledby?: string` - ID of element that labels this select
- `aria-describedby?: string` - ID of element that describes this select
- `aria-invalid?: boolean` - Whether this select has a validation error
- `aria-required?: boolean` - Whether this field is required

### Select.Value

Props:
- `placeholder?: string` - Text to display when no value is selected

The `Select.Value` component renders the selected value using the Value slot defined in the factory function's theme. This allows for consistent value rendering across your application.

## TypeScript Support

The factory functions return types with the compound components attached:

```typescript
type CreateSelectResult<T = unknown> = React.FC<SelectOptions<T>> & {
  Trigger: React.FC<CompoundSelectTriggerProps>
  Value: React.FC<CompoundSelectValueProps>
}

type CreateMultiSelectResult<T = unknown> = React.FC<MultiSelectOptions<T>> & {
  Trigger: React.FC<CompoundMultiSelectTriggerProps>
  Value: React.FC<CompoundMultiSelectValueProps>
}
```

## Creating Custom Select Instances

You can create custom select instances with factory-level defaults and still use compound components:

```tsx
import { createSelect } from '@bazza-ui/select'

const MySelect = createSelect({
  slots: {
    Value: ({ value, placeholder }) => (
      <span>Selected: {value || placeholder}</span>
    ),
  },
})

// Use with compound components
function MyComponent() {
  return (
    <MySelect items={items}>
      <MySelect.Trigger asChild>
        <button>
          <MySelect.Value />
        </button>
      </MySelect.Trigger>
    </MySelect>
  )
}
```

## Implementation Details

The compound component pattern is detected by checking if the children contain `Select.Trigger` or `Select.Value` components. If detected, the library renders the children directly. Otherwise, it falls back to the legacy behavior.

This ensures complete backward compatibility while providing a more flexible composition API.
