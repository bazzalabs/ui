# Trigger Slot Customization

The Select component now supports full Trigger slot customization with the `bind()` API pattern, allowing you to customize the trigger button appearance while maintaining all necessary ARIA attributes and event handlers.

## Features

- ✅ **bind() API**: Get all props via `bind.getTriggerProps()` for spreading onto elements
- ✅ **Three-level customization**: Factory, instance, and menu level
- ✅ **Type-safe**: Full TypeScript support with proper prop inference
- ✅ **Event composition**: Properly merges Base UI handlers with custom handlers
- ✅ **ARIA compliant**: Maintains all accessibility attributes automatically

## Usage

### 1. Factory-level Customization (Recommended)

Define the trigger appearance once when creating the Select component:

```tsx
import { createSelect } from '@bazza-ui/select'
import { Button } from './button'
import { ChevronDownIcon } from 'lucide-react'

export const Select = createSelect({
  slots: {
    Trigger: ({ children, bind }) => (
      <Button {...bind.getTriggerProps({ className: 'min-w-[200px]' })}>
        {children}
        <ChevronDownIcon className="ml-auto size-4" />
      </Button>
    ),
  },
  slotProps: {
    trigger: {
      'data-testid': 'select-trigger',
    },
  },
  classNames: {
    trigger: 'rounded-md border',
  },
})
```

### 2. Instance-level Customization

Override the trigger for specific Select instances:

```tsx
<Select
  items={items}
  value={value}
  onValueChange={setValue}
  slots={{
    Trigger: ({ children, bind }) => (
      <button
        {...bind.getTriggerProps()}
        className="custom-trigger-class"
      >
        <span className="icon">🎨</span>
        {children}
      </button>
    ),
  }}
/>
```

### 3. Using slotProps and classNames

Add props and classes without creating a custom slot:

```tsx
const Select = createSelect({
  slotProps: {
    trigger: {
      'data-testid': 'my-select',
      onClick: (e) => console.log('clicked!'),
    },
  },
  classNames: {
    trigger: 'my-custom-trigger-class',
  },
})
```

## TriggerBindAPI

The `bind` object provides:

```tsx
interface TriggerBindAPI {
  open: boolean
  disabled: boolean
  getTriggerProps: <T extends React.ButtonHTMLAttributes<HTMLButtonElement>>(
    overrides?: T
  ) => T & {
    ref: React.Ref<HTMLButtonElement>
    role: 'combobox'
    'aria-haspopup': 'listbox'
    'aria-expanded': boolean
    'aria-controls': string
    'aria-label'?: string
    'aria-labelledby'?: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    'aria-required'?: boolean
    disabled?: boolean
    onPointerDown: (e: React.PointerEvent) => void
  }
}
```

## SelectTriggerSlotArgs

The Trigger slot receives:

```tsx
interface SelectTriggerSlotArgs {
  children: React.ReactNode    // The display value or custom children
  bind: TriggerBindAPI          // Props getter with event handlers
  value?: string                // Current selected value (single select)
  values?: string[]             // Current selected values (multi select)
  multiple: boolean             // Whether this is a multi-select
  placeholder: string           // Placeholder text
}
```

## Examples

### With Radix UI Button

```tsx
import { Button } from '@radix-ui/themes'

const Select = createSelect({
  slots: {
    Trigger: ({ children, bind }) => (
      <Button {...bind.getTriggerProps()}>
        {children}
      </Button>
    ),
  },
})
```

### With shadcn/ui Button

```tsx
import { Button } from '@/components/ui/button'

const Select = createSelect({
  slots: {
    Trigger: ({ children, bind }) => (
      <Button
        variant="outline"
        {...bind.getTriggerProps()}
      >
        {children}
      </Button>
    ),
  },
})
```

### With Custom Styling

```tsx
const Select = createSelect({
  slots: {
    Trigger: ({ children, bind, open, value }) => (
      <button
        {...bind.getTriggerProps({
          className: cn(
            'flex items-center gap-2 px-4 py-2 rounded-md border',
            'hover:bg-accent transition-colors',
            open && 'ring-2 ring-ring',
            !value && 'text-muted-foreground'
          ),
        })}
      >
        {children}
        <ChevronDownIcon 
          className={cn(
            'ml-auto size-4 transition-transform',
            open && 'rotate-180'
          )} 
        />
      </button>
    ),
  },
})
```

### Accessing Selected State

```tsx
const Select = createSelect({
  slots: {
    Trigger: ({ children, bind, value, values, multiple }) => {
      const hasSelection = multiple ? values.length > 0 : !!value
      
      return (
        <button
          {...bind.getTriggerProps({
            className: hasSelection ? 'font-semibold' : 'font-normal',
          })}
        >
          {hasSelection && <CheckIcon className="mr-2" />}
          {children}
        </button>
      )
    },
  },
})
```

## Event Handler Composition

The `bind.getTriggerProps()` properly composes event handlers:

1. Base UI handlers (open/close functionality) are preserved
2. Your custom handlers are added
3. Override handlers in `getTriggerProps()` take precedence

```tsx
// Factory-level handler
slotProps: {
  trigger: {
    onClick: () => console.log('Factory click'),
  },
}

// Slot-level handler (composed with above)
Trigger: ({ bind }) => (
  <button
    {...bind.getTriggerProps({
      onClick: (e) => {
        console.log('Slot click')
        // Base UI handler still runs!
      },
    })}
  >
    Click me
  </button>
)
```

## Migration from asChild

The old `asChild` pattern still works but is less flexible:

**Before:**
```tsx
<Select items={items} asChild>
  <CustomButton>
    <Select.Value placeholder="Select..." />
  </CustomButton>
</Select>
```

**After (Recommended):**
```tsx
const Select = createSelect({
  slots: {
    Trigger: ({ children, bind }) => (
      <CustomButton {...bind.getTriggerProps()}>
        {children}
      </CustomButton>
    ),
  },
})

<Select items={items} placeholder="Select..." />
```

## Tips

1. **Always spread `bind.getTriggerProps()`**: This ensures all ARIA attributes and handlers are applied
2. **Pass overrides to getTriggerProps()**: Don't spread props directly - use the overrides parameter
3. **Use factory-level slots**: Define once, use everywhere
4. **Check bind.open and bind.disabled**: Use these for conditional styling

## Related

- [Value Slot Customization](./VALUE_SLOT.md)
- [Item Slot Customization](./ITEM_SLOT.md)
- [Theme System Overview](./THEMING.md)
