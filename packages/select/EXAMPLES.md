# Select Component Examples

Comprehensive examples for `@bazza-ui/select` and `@bazza-ui/multi-select`.

## Table of Contents

1. [Basic Single Select](#basic-single-select)
2. [Multi-Select](#multi-select)
3. [Form Integration](#form-integration)
4. [With React Hook Form](#with-react-hook-form)
5. [Custom Trigger](#custom-trigger)
6. [Grouped Options](#grouped-options)
7. [With Icons](#with-icons)
8. [Async Loading](#async-loading)
9. [Virtualized Large Lists](#virtualized-large-lists)
10. [Validation States](#validation-states)

---

## Basic Single Select

```tsx
import { Select } from '@bazza-ui/select'
import { useState } from 'react'

function BasicExample() {
  const [country, setCountry] = useState('us')

  return (
    <div>
      <label htmlFor="country">Country</label>
      <Select
        value={country}
        onValueChange={setCountry}
        placeholder="Select a country..."
        items={[
          { value: 'us', label: 'United States' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'ca', label: 'Canada' },
          { value: 'au', label: 'Australia' },
        ]}
      />
      <p>Selected: {country}</p>
    </div>
  )
}
```

---

## Multi-Select

```tsx
import { MultiSelect } from '@bazza-ui/select'
import { useState } from 'react'

function MultiSelectExample() {
  const [languages, setLanguages] = useState(['javascript', 'typescript'])

  return (
    <div>
      <label htmlFor="languages">Programming Languages</label>
      <MultiSelect
        value={languages}
        onValueChange={setLanguages}
        placeholder="Select languages..."
        max={5}  // Limit to 5 selections
        items={[
          { value: 'javascript', label: 'JavaScript' },
          { value: 'typescript', label: 'TypeScript' },
          { value: 'python', label: 'Python' },
          { value: 'rust', label: 'Rust' },
          { value: 'go', label: 'Go' },
          { value: 'java', label: 'Java' },
        ]}
      />
      <p>Selected: {languages.join(', ')}</p>
    </div>
  )
}
```

---

## Form Integration

```tsx
import { Select } from '@bazza-ui/select'

function FormExample() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    console.log('Submitted:', {
      size: formData.get('size'),
      color: formData.get('color'),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="size">Size</label>
        <Select
          name="size"
          required
          placeholder="Select size..."
          items={[
            { value: 's', label: 'Small' },
            { value: 'm', label: 'Medium' },
            { value: 'l', label: 'Large' },
            { value: 'xl', label: 'Extra Large' },
          ]}
        />
      </div>

      <div>
        <label htmlFor="color">Color</label>
        <Select
          name="color"
          required
          placeholder="Select color..."
          items={[
            { value: 'red', label: 'Red' },
            { value: 'blue', label: 'Blue' },
            { value: 'green', label: 'Green' },
          ]}
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## With React Hook Form

```tsx
import { Select } from '@bazza-ui/select'
import { useForm, Controller } from 'react-hook-form'

interface FormData {
  country: string
  state: string
}

function ReactHookFormExample() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      country: '',
      state: '',
    }
  })

  const onSubmit = (data: FormData) => {
    console.log('Form data:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="country">Country</label>
        <Controller
          name="country"
          control={control}
          rules={{ required: 'Country is required' }}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              aria-invalid={!!errors.country}
              aria-describedby={errors.country ? 'country-error' : undefined}
              items={[
                { value: 'us', label: 'United States' },
                { value: 'uk', label: 'United Kingdom' },
              ]}
            />
          )}
        />
        {errors.country && (
          <span id="country-error" role="alert">
            {errors.country.message}
          </span>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## Custom Trigger

```tsx
import { Select } from '@bazza-ui/select'

function CustomTriggerExample() {
  const [value, setValue] = useState('')

  return (
    <Select
      value={value}
      onValueChange={setValue}
      items={[
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ]}
      asChild
    >
      <button className="fancy-button">
        <span className="icon">⚙️</span>
        <Select.Value placeholder="Choose an option" />
        <span className="chevron">▼</span>
      </button>
    </Select>
  )
}
```

---

## Grouped Options

```tsx
import { Select } from '@bazza-ui/select'

function GroupedExample() {
  const [food, setFood] = useState('')

  return (
    <Select
      value={food}
      onValueChange={setFood}
      placeholder="Select food..."
      menu={{
        id: 'food-menu',
        nodes: [
          {
            kind: 'group',
            id: 'fruits',
            heading: 'Fruits',
            nodes: [
              { kind: 'item', id: 'apple', label: 'Apple' },
              { kind: 'item', id: 'banana', label: 'Banana' },
              { kind: 'item', id: 'cherry', label: 'Cherry' },
            ]
          },
          { kind: 'separator' },
          {
            kind: 'group',
            id: 'vegetables',
            heading: 'Vegetables',
            nodes: [
              { kind: 'item', id: 'carrot', label: 'Carrot' },
              { kind: 'item', id: 'broccoli', label: 'Broccoli' },
              { kind: 'item', id: 'spinach', label: 'Spinach' },
            ]
          },
          { kind: 'separator' },
          {
            kind: 'group',
            id: 'proteins',
            heading: 'Proteins',
            nodes: [
              { kind: 'item', id: 'chicken', label: 'Chicken' },
              { kind: 'item', id: 'beef', label: 'Beef' },
              { kind: 'item', id: 'tofu', label: 'Tofu' },
            ]
          }
        ]
      }}
    />
  )
}
```

---

## With Icons

```tsx
import { Select } from '@bazza-ui/select'

function IconExample() {
  const [status, setStatus] = useState('pending')

  return (
    <Select
      value={status}
      onValueChange={setStatus}
      items={[
        {
          value: 'success',
          label: 'Success',
          icon: <CheckCircleIcon className="text-green-500" />,
          description: 'Everything went well'
        },
        {
          value: 'pending',
          label: 'Pending',
          icon: <ClockIcon className="text-yellow-500" />,
          description: 'Waiting for completion'
        },
        {
          value: 'error',
          label: 'Error',
          icon: <XCircleIcon className="text-red-500" />,
          description: 'Something went wrong'
        },
      ]}
    />
  )
}
```

---

## Async Loading

```tsx
import { Select } from '@bazza-ui/select'
import { createQueryLoader } from '@bazza-ui/loaders/query'
import { useQuery } from '@tanstack/react-query'

// Define loader
const usersLoader = createQueryLoader({
  queryKey: ['users'],
  queryFn: async () => {
    const res = await fetch('/api/users')
    const users = await res.json()
    return users.map(user => ({
      kind: 'item' as const,
      id: user.id,
      label: user.name,
      value: user.id,
    }))
  }
})

function AsyncExample() {
  const [selectedUser, setSelectedUser] = useState('')

  return (
    <Select
      value={selectedUser}
      onValueChange={setSelectedUser}
      placeholder="Search users..."
      menu={{
        id: 'users',
        loader: usersLoader,
        nodes: []  // Will be populated by loader
      }}
    />
  )
}
```

---

## Virtualized Large Lists

```tsx
import { Select } from '@bazza-ui/select'

function VirtualizedExample() {
  // Generate 10,000 items
  const items = Array.from({ length: 10000 }, (_, i) => ({
    value: `item-${i}`,
    label: `Item ${i + 1}`,
  }))

  const [selected, setSelected] = useState('')

  return (
    <Select
      value={selected}
      onValueChange={setSelected}
      placeholder="Search 10,000 items..."
      items={items}
      defaults={{
        virtualization: {
          enabled: true,
          overscan: 5,
          itemHeight: 40,
        }
      }}
    />
  )
}
```

---

## Validation States

```tsx
import { Select } from '@bazza-ui/select'
import { useState } from 'react'

function ValidationExample() {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)
  const hasError = touched && !value

  return (
    <div>
      <label htmlFor="priority">Priority</label>
      <Select
        value={value}
        onValueChange={setValue}
        onBlur={() => setTouched(true)}
        required
        aria-invalid={hasError}
        aria-describedby={hasError ? 'priority-error' : undefined}
        placeholder="Select priority..."
        items={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' },
        ]}
      />
      {hasError && (
        <span id="priority-error" role="alert" className="error">
          Priority is required
        </span>
      )}
    </div>
  )
}
```

---

## Composition API (Full Control)

```tsx
import { Select } from '@bazza-ui/select'

function AdvancedComposition() {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <Select.Root
      value={value}
      onValueChange={setValue}
      open={open}
      onOpenChange={setOpen}
    >
      <div className="select-wrapper">
        <Select.Trigger asChild>
          <button className="custom-trigger">
            <Select.Value placeholder="Choose..." />
            <ChevronIcon className={open ? 'rotate-180' : ''} />
          </button>
        </Select.Trigger>

        <Select.Content
          side="bottom"
          align="start"
          sideOffset={8}
          menu={{
            id: 'custom',
            nodes: [
              { kind: 'item', id: '1', label: 'Option 1' },
              { kind: 'item', id: '2', label: 'Option 2' },
            ]
          }}
        />
      </div>
    </Select.Root>
  )
}
```

---

## Programmatic Control

```tsx
import { Select, type SelectControl } from '@bazza-ui/select'
import { useRef } from 'react'

function ProgrammaticExample() {
  const selectRef = useRef<SelectControl>(null)

  return (
    <div>
      <Select
        controlRef={selectRef}
        items={[
          { value: '1', label: 'Option 1' },
          { value: '2', label: 'Option 2' },
        ]}
      />

      <div className="controls">
        <button onClick={() => selectRef.current?.open()}>
          Open
        </button>
        <button onClick={() => selectRef.current?.close()}>
          Close
        </button>
        <button onClick={() => selectRef.current?.toggle()}>
          Toggle
        </button>
        <button onClick={() => selectRef.current?.disable()}>
          Disable
        </button>
        <button onClick={() => selectRef.current?.enable()}>
          Enable
        </button>
      </div>
    </div>
  )
}
```

---

## All Examples Combined

Full demo with all features:

```tsx
import { Select, MultiSelect } from '@bazza-ui/select'
import { useState } from 'react'

export function SelectDemo() {
  return (
    <div className="space-y-8">
      <section>
        <h2>Basic Select</h2>
        <BasicExample />
      </section>

      <section>
        <h2>Multi-Select</h2>
        <MultiSelectExample />
      </section>

      <section>
        <h2>Form Integration</h2>
        <FormExample />
      </section>

      <section>
        <h2>Grouped Options</h2>
        <GroupedExample />
      </section>

      <section>
        <h2>With Icons</h2>
        <IconExample />
      </section>

      <section>
        <h2>Validation</h2>
        <ValidationExample />
      </section>
    </div>
  )
}
```
