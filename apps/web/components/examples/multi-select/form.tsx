'use client'

import { useState } from 'react'
import { MultiSelect } from '@/registry/multi-select'
import { Button } from '@/components/ui/button'

export function Form() {
  const [submitted, setSubmitted] = useState<string[] | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const colors = formData.getAll('colors')
    setSubmitted(colors as string[])
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label htmlFor="colors" className="text-sm font-medium mb-2 block">
            Choose colors <span className="text-muted-foreground">(min 1, max 3)</span>
          </label>
          <MultiSelect
            name="colors"
            required
            min={1}
            max={3}
            placeholder="Select colors..."
            items={[
              { value: 'red', label: 'Red' },
              { value: 'blue', label: 'Blue' },
              { value: 'green', label: 'Green' },
              { value: 'yellow', label: 'Yellow' },
              { value: 'purple', label: 'Purple' },
              { value: 'orange', label: 'Orange' },
            ]}
          >
            <Button variant="outline" className="w-full">
              Select colors...
            </Button>
          </MultiSelect>
        </div>
        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
      {submitted && (
        <p className="text-sm text-muted-foreground">
          Submitted: <span className="font-medium text-foreground">{submitted.join(', ')}</span>
        </p>
      )}
    </div>
  )
}
