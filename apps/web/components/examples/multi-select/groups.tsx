'use client'

import { useState } from 'react'
import { MultiSelect } from '@/registry/multi-select'
import { Button } from '@/components/ui/button'

export function Groups() {
  const [values, setValues] = useState<string[]>([])

  return (
    <div className="flex flex-col items-center gap-4">
      <MultiSelect
        value={values}
        onValueChange={setValues}
        placeholder="Search programming languages..."
        menu={{
          id: 'languages-menu',
          nodes: [
            {
              kind: 'group',
              id: 'frontend',
              heading: 'Frontend',
              nodes: [
                { kind: 'item', id: 'javascript', label: 'JavaScript', variant: 'checkbox' },
                { kind: 'item', id: 'typescript', label: 'TypeScript', variant: 'checkbox' },
                { kind: 'item', id: 'html', label: 'HTML', variant: 'checkbox' },
                { kind: 'item', id: 'css', label: 'CSS', variant: 'checkbox' },
              ],
            },
            { kind: 'separator' },
            {
              kind: 'group',
              id: 'backend',
              heading: 'Backend',
              nodes: [
                { kind: 'item', id: 'python', label: 'Python', variant: 'checkbox' },
                { kind: 'item', id: 'java', label: 'Java', variant: 'checkbox' },
                { kind: 'item', id: 'go', label: 'Go', variant: 'checkbox' },
                { kind: 'item', id: 'rust', label: 'Rust', variant: 'checkbox' },
              ],
            },
            { kind: 'separator' },
            {
              kind: 'group',
              id: 'database',
              heading: 'Database',
              nodes: [
                { kind: 'item', id: 'sql', label: 'SQL', variant: 'checkbox' },
                { kind: 'item', id: 'nosql', label: 'NoSQL', variant: 'checkbox' },
              ],
            },
          ],
        }}
      >
        <Button variant="outline" className="w-64">
          {values.length > 0 ? `${values.length} languages selected` : 'Select languages...'}
        </Button>
      </MultiSelect>
      {values.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{values.join(', ')}</span>
        </p>
      )}
    </div>
  )
}
