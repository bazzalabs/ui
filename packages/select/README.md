# @bazza-ui/select

Form-compatible Select and MultiSelect components based on `@bazza-ui/dropdown-menu`. Uses combobox/listbox ARIA pattern for proper form integration and accessibility.

## Features

- ✅ **Single & Multi-Select**: Choose one or many values
- ✅ **Form Integration**: Hidden inputs, name/value props, works with React Hook Form
- ✅ **Proper ARIA**: Combobox/listbox pattern (not menu pattern)
- ✅ **No Submenus**: Only flat lists with groups (as recommended for select controls)
- ✅ **Type-ahead Search**: Built-in search/filter functionality
- ✅ **Virtualization**: Handle huge lists efficiently
- ✅ **Async Loading**: Dynamic options with loaders
- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Theme System**: Consistent styling with other bazza-ui components
- ✅ **TypeScript**: Fully typed with great inference

## Installation

```bash
npm install @bazza-ui/select
# or
bun add @bazza-ui/select
```

## Basic Usage

### Simple Select

```tsx
import { Select } from '@bazza-ui/select'

function FruitSelector() {
  const [fruit, setFruit] = useState('apple')

  return (
    <Select
      value={fruit}
      onValueChange={setFruit}
      placeholder="Select a fruit..."
      items={[
        { value: 'apple', label: 'Apple', icon: '🍎' },
        { value: 'banana', label: 'Banana', icon: '🍌' },
        { value: 'cherry', label: 'Cherry', icon: '🍒' },
      ]}
    />
  )
}
```

### Form Integration

```tsx
import { Select } from '@bazza-ui/select'

function MyForm() {
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="color">Choose a color:</label>
      <Select
        name="color"
        required
        aria-labelledby="color-label"
        items={[
          { value: 'red', label: 'Red' },
          { value: 'blue', label: 'Blue' },
          { value: 'green', label: 'Green' },
        ]}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### React Hook Form

```tsx
import { Select } from '@bazza-ui/select'
import { useForm } from 'react-hook-form'

function FormWithValidation() {
  const { register, handleSubmit, setValue, watch } = useForm()
  const color = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Select
        {...register('color', { required: true })}
        value={color}
        onValueChange={(val) => setValue('color', val)}
        items={colors}
      />
    </form>
  )
}
```

### MultiSelect

```tsx
import { MultiSelect } from '@bazza-ui/select'

function FruitBasket() {
  const [fruits, setFruits] = useState(['apple', 'banana'])

  return (
    <MultiSelect
      value={fruits}
      onValueChange={setFruits}
      placeholder="Select fruits..."
      max={3}  // Limit to 3 selections
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
        { value: 'date', label: 'Date' },
      ]}
    />
  )
}
```

## Advanced Usage

### Using Groups for Categorization

Since submenus are not supported (by design), use groups to organize options:

```tsx
import { Select } from '@bazza-ui/select'

<Select
  value={value}
  onValueChange={setValue}
  menu={{
    id: 'food',
    nodes: [
      {
        kind: 'group',
        id: 'fruits',
        heading: 'Fruits',
        nodes: [
          { kind: 'item', id: 'apple', label: 'Apple' },
          { kind: 'item', id: 'banana', label: 'Banana' },
        ]
      },
      { kind: 'separator' },
      {
        kind: 'group',
        id: 'vegetables',
        heading: 'Vegetables',
        nodes: [
          { kind: 'item', id: 'carrot', label: 'Carrot' },
          { kind: 'item', id: 'potato', label: 'Potato' },
        ]
      }
    ]
  }}
/>
```

### Custom Trigger

```tsx
import { Select } from '@bazza-ui/select'

<Select
  value={value}
  onValueChange={setValue}
  items={items}
  asChild
>
  <button className="custom-trigger">
    <Select.Value placeholder="Choose..." />
    <ChevronDownIcon />
  </button>
</Select>
```

### Composition API

For full control, use the composition API:

```tsx
import { Select } from '@bazza-ui/select'

<Select.Root value={value} onValueChange={setValue}>
  <Select.Trigger>
    <CustomTriggerButton>
      <Select.Value placeholder="Select..." />
    </CustomTriggerButton>
  </Select.Trigger>
  <Select.Content
    menu={{
      id: 'custom',
      nodes: [/* full menu definition */],
      loader: asyncLoader,
      virtualization: { enabled: true }
    }}
  />
</Select.Root>
```

### Programmatic Control

```tsx
import { Select, type SelectControl } from '@bazza-ui/select'
import { useRef } from 'react'

function ControlledSelect() {
  const controlRef = useRef<SelectControl>(null)

  return (
    <>
      <Select
        controlRef={controlRef}
        items={items}
      />
      <button onClick={() => controlRef.current?.open()}>
        Open Select
      </button>
      <button onClick={() => controlRef.current?.disable()}>
        Disable Select
      </button>
    </>
  )
}
```

### With Search/Filter

Search is built-in! Just add a placeholder to enable the search input:

```tsx
<Select
  items={largeItemsList}
  placeholder="Search..."
/>
```

### Virtualization for Large Lists

```tsx
<Select
  items={thousandsOfItems}
  defaults={{
    virtualization: {
      enabled: true,
      overscan: 5
    }
  }}
/>
```

### Async Loading

```tsx
import { Select } from '@bazza-ui/select'
import { createQueryLoader } from '@bazza-ui/loaders/query'

const loader = createQueryLoader({
  queryKey: ['fruits'],
  queryFn: async () => {
    const res = await fetch('/api/fruits')
    return res.json()
  }
})

<Select
  menu={{
    id: 'async-fruits',
    loader,
    nodes: [] // Will be populated by loader
  }}
/>
```

## Why No Submenus?

Select components are designed for choosing values, not navigating hierarchical commands. Submenus:

- ❌ Confuse users who expect flat option lists
- ❌ Break accessibility (screen readers expect simple listbox)
- ❌ Don't map to form semantics (what value does a submenu represent?)
- ❌ Are terrible on mobile
- ❌ Make value serialization complex

**Instead, use groups:**

```tsx
// ✅ DO: Use groups for categorization
<Select menu={{
  nodes: [
    { kind: 'group', heading: 'Category A', nodes: [...] },
    { kind: 'group', heading: 'Category B', nodes: [...] }
  ]
}} />

// ❌ DON'T: Submenus will throw an error
<Select menu={{
  nodes: [
    { kind: 'submenu', label: 'More', nodes: [...] } // Error!
  ]
}} />
```

## API Reference

### Select Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Current selected value (controlled) |
| `defaultValue` | `string` | Default value (uncontrolled) |
| `onValueChange` | `(value: string) => void` | Called when selection changes |
| `name` | `string` | Form field name for submission |
| `form` | `string` | Associate with a form by ID |
| `required` | `boolean` | Whether this field is required |
| `disabled` | `boolean` | Whether this select is disabled |
| `placeholder` | `string` | Placeholder text when no value selected |
| `items` | `SelectItemDef[]` | Simple array of items (most common) |
| `menu` | `SelectMenuDef` | Full menu definition (advanced) |
| `aria-label` | `string` | Accessible label |
| `aria-labelledby` | `string` | ID of element that labels this select |
| `aria-describedby` | `string` | ID of element that describes this select |
| `aria-invalid` | `boolean` | Whether this select has a validation error |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | Which side to position the listbox |
| `align` | `'start' \| 'center' \| 'end'` | How to align the listbox with trigger |
| `onOpenChange` | `(open: boolean) => void` | Called when the select opens/closes |
| `onBlur` | `() => void` | Called on blur (for form validation) |

### MultiSelect Props

Extends `SelectProps` with:

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string[]` | Current selected values (controlled) |
| `defaultValue` | `string[]` | Default values (uncontrolled) |
| `onValueChange` | `(values: string[]) => void` | Called when selection changes |
| `max` | `number` | Maximum number of selections allowed |
| `min` | `number` | Minimum number of selections required |
| `closeOnSelect` | `boolean` | Whether to close after selecting (default: false) |

### SelectItemDef

```typescript
interface SelectItemDef<TData = unknown> {
  value: string        // The value to submit when selected
  label: string        // Display label
  disabled?: boolean   // Whether this item is disabled
  icon?: ReactNode     // Optional icon
  description?: string // Optional description
  data?: TData         // Custom data attached to this item
}
```

## Accessibility

Select components follow the [ARIA Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/):

- **Trigger**: `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded`
- **Listbox**: `role="listbox"`, `aria-multiselectable` (for multi-select)
- **Options**: `role="option"`, `aria-selected`
- **Keyboard**: Arrow keys, Enter to select, Escape to close, type-ahead search

## Factory Functions

Create custom select instances with default themes:

```tsx
import { createSelect, createMultiSelect } from '@bazza-ui/select'

const MySelect = createSelect({
  slots: { /* custom slots */ },
  classNames: { /* custom classes */ },
  defaults: {
    surface: { vimBindings: false },
    item: { closeOnSelect: true }
  }
})
```

## Related Packages

- `@bazza-ui/dropdown-menu` - Action menus (supports submenus)
- `@bazza-ui/command-menu` - Command palette
- `@bazza-ui/context-menu` - Right-click menus
- `@bazza-ui/menu` - Core menu primitives
- `@bazza-ui/popup-menu` - Popup positioning & rendering

## License

MIT
