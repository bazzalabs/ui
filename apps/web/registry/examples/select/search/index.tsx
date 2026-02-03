'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/registry/ui/select'

const countries = [
  { value: 'us', label: 'United States', keywords: ['america', 'usa'] },
  { value: 'uk', label: 'United Kingdom', keywords: ['britain', 'england'] },
  { value: 'ca', label: 'Canada', keywords: ['north america'] },
  { value: 'au', label: 'Australia', keywords: ['oceania', 'down under'] },
  { value: 'de', label: 'Germany', keywords: ['deutschland', 'europe'] },
  { value: 'fr', label: 'France', keywords: ['europe', 'paris'] },
  { value: 'jp', label: 'Japan', keywords: ['asia', 'nippon'] },
  { value: 'br', label: 'Brazil', keywords: ['south america'] },
]

export default function SelectSearch() {
  const [value, setValue] = React.useState('')

  return (
    <Select.Root value={value} onValueChange={setValue}>
      <Select.Trigger render={<Button variant="outline" />}>
        <Select.Value placeholder="Select a country..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Surface>
              <Select.Input placeholder="Search countries..." />
              <Select.List>
                {countries.map((country) => (
                  <Select.Item
                    key={country.value}
                    value={country.value}
                    keywords={country.keywords}
                  >
                    <Select.ItemLabel>{country.label}</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.List>
              <Select.Empty>No countries found</Select.Empty>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
