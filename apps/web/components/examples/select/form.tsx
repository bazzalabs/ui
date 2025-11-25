'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/registry/select'

export function Form() {
  const [submitted, setSubmitted] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const color = formData.get('color')
    setSubmitted(color as string)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label htmlFor="color" className="text-sm font-medium mb-2 block">
            Choose a color <span className="text-destructive">*</span>
          </label>
          <Select
            name="color"
            required
            placeholder="Select a color..."
            items={[
              { value: 'red', label: 'Red' },
              { value: 'blue', label: 'Blue' },
              { value: 'green', label: 'Green' },
              { value: 'yellow', label: 'Yellow' },
              { value: 'purple', label: 'Purple' },
            ]}
          />
        </div>
        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
      {submitted && (
        <p className="text-sm text-muted-foreground">
          Submitted:{' '}
          <span className="font-medium text-foreground">{submitted}</span>
        </p>
      )}
    </div>
  )
}
