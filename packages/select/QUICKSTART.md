# Quick Start Guide

Get up and running with `@bazza-ui/select` in 5 minutes.

## Installation

```bash
bun add @bazza-ui/select
# or
npm install @bazza-ui/select
```

## Your First Select

```tsx
import { Select } from '@bazza-ui/select'
import { useState } from 'react'

function App() {
  const [fruit, setFruit] = useState('apple')

  return (
    <Select
      value={fruit}
      onValueChange={setFruit}
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
      ]}
    />
  )
}
```

**That's it!** You now have a fully functional, accessible select component.

---

## Common Patterns

### Form Integration

```tsx
<form>
  <Select
    name="color"
    required
    items={[
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
    ]}
  />
  <button type="submit">Submit</button>
</form>
```

### Multi-Select

```tsx
import { MultiSelect } from '@bazza-ui/select'

<MultiSelect
  value={['apple', 'banana']}
  onValueChange={setFruits}
  items={fruits}
/>
```

### With Icons

```tsx
<Select
  items={[
    { value: 'success', label: 'Success', icon: '✅' },
    { value: 'error', label: 'Error', icon: '❌' },
  ]}
/>
```

### Grouped Options

```tsx
<Select
  menu={{
    id: 'menu',
    nodes: [
      {
        kind: 'group',
        heading: 'Fruits',
        nodes: [
          { kind: 'item', id: 'apple', label: 'Apple' },
          { kind: 'item', id: 'banana', label: 'Banana' },
        ]
      },
      {
        kind: 'group',
        heading: 'Vegetables',
        nodes: [
          { kind: 'item', id: 'carrot', label: 'Carrot' },
        ]
      }
    ]
  }}
/>
```

---

## Props Cheat Sheet

### Essential Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Current value (controlled) |
| `onValueChange` | `(value: string) => void` | Change handler |
| `items` | `SelectItemDef[]` | Array of options |
| `placeholder` | `string` | Placeholder text |

### Form Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Form field name |
| `required` | `boolean` | Is required |
| `disabled` | `boolean` | Is disabled |

### Advanced Props

| Prop | Type | Description |
|------|------|-------------|
| `menu` | `SelectMenuDef` | Full menu definition |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | Position |
| `controlRef` | `Ref<SelectControl>` | Programmatic control |

---

## TypeScript

Full type inference:

```tsx
interface Fruit {
  name: string
  color: string
}

const fruits: SelectItemDef<Fruit>[] = [
  {
    value: 'apple',
    label: 'Apple',
    data: { name: 'Apple', color: 'red' }  // Fully typed!
  }
]

<Select<Fruit>
  items={fruits}
  onValueChange={(value) => {
    // value is inferred as string
  }}
/>
```

---

## Styling

Select uses the theme system from `@bazza-ui/popup-menu`:

```tsx
import { createSelect } from '@bazza-ui/select'

const MySelect = createSelect({
  classNames: {
    surface: 'my-custom-surface',
    item: 'my-custom-item',
  }
})
```

---

## Migration from Native Select

**Before (native):**
```tsx
<select name="fruit" value={fruit} onChange={(e) => setFruit(e.target.value)}>
  <option value="apple">Apple</option>
  <option value="banana">Banana</option>
</select>
```

**After (bazza-ui):**
```tsx
<Select
  name="fruit"
  value={fruit}
  onValueChange={setFruit}
  items={[
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
  ]}
/>
```

---

## Common Mistakes

### ❌ Don't use submenus
```tsx
// This will throw an error!
<Select menu={{
  nodes: [
    { kind: 'submenu', label: 'More' }  // ❌ Error!
  ]
}} />
```

### ✅ Use groups instead
```tsx
<Select menu={{
  nodes: [
    {
      kind: 'group',
      heading: 'Category',
      nodes: [/* items */]
    }
  ]
}} />
```

---

## Next Steps

- 📖 Read [README.md](./README.md) for full API reference
- 💡 Check [EXAMPLES.md](./EXAMPLES.md) for more patterns
- 🔧 Review [IMPLEMENTATION.md](./IMPLEMENTATION.md) for internals
- 🎉 See [SUMMARY.md](./SUMMARY.md) for overview

---

**Happy selecting!** 🎯
