'use client'

import { useState } from 'react'
import { MultiSelect } from '@/registry/ui/multi-select'

export function Groups() {
  const [values, setValues] = useState<string[]>([])

  return (
    <div className="flex flex-col items-center gap-4">
      <MultiSelect
        value={values}
        onValueChange={setValues}
        menu={{
          id: 'languages-menu',
          nodes: [
            {
              kind: 'group',
              id: 'frontend',
              heading: 'Frontend',
              nodes: [
                { kind: 'item', id: 'javascript', label: 'JavaScript' },
                { kind: 'item', id: 'typescript', label: 'TypeScript' },
                {
                  kind: 'item',
                  id: 'html',
                  label: 'HTML',
                },
                { kind: 'item', id: 'css', label: 'CSS' },
              ],
            },
            {
              kind: 'group',
              id: 'backend',
              heading: 'Backend',
              nodes: [
                {
                  kind: 'item',
                  id: 'python',
                  label: 'Python',
                },
                {
                  kind: 'item',
                  id: 'java',
                  label: 'Java',
                },
                { kind: 'item', id: 'go', label: 'Go' },
                {
                  kind: 'item',
                  id: 'rust',
                  label: 'Rust',
                },
              ],
            },
            {
              kind: 'group',
              id: 'database',
              heading: 'Database',
              nodes: [
                { kind: 'item', id: 'sql', label: 'SQL' },
                {
                  kind: 'item',
                  id: 'nosql',
                  label: 'NoSQL',
                },
              ],
            },
          ],
        }}
      >
        <MultiSelect.Trigger>
          <MultiSelect.Value placeholder="Search programming languages..." />
        </MultiSelect.Trigger>
      </MultiSelect>
      {values.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Selected:{' '}
          <span className="font-medium text-foreground">
            {values.join(', ')}
          </span>
        </p>
      )}
    </div>
  )
}
