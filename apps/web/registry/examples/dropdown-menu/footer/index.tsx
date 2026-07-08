'use client'

import { PlusIcon } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

const LABEL_COLORS = ['orange', 'teal', 'red', 'sky', 'violet'] as const

const LABEL_STYLES_BG: Record<(typeof LABEL_COLORS)[number], string> = {
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
  red: 'bg-red-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
}

type LabelColor = (typeof LABEL_COLORS)[number]

type LabelRecord = {
  id: string
  name: string
  color: LabelColor
  checked?: boolean
}

const labelsData: LabelRecord[] = [
  { id: 'frontend', name: 'Frontend', color: 'orange' },
  { id: 'backend', name: 'Backend', color: 'teal' },
  { id: 'api', name: 'API', color: 'red' },
  { id: 'security', name: 'Security', color: 'sky' },
  { id: 'design', name: 'Design', color: 'violet' },
]

function createLabelId(name: string, index: number) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return `${slug || 'label'}-${index}`
}

export default function FooterDemo() {
  const [labels, setLabels] = React.useState<LabelRecord[]>(labelsData)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [labelName, setLabelName] = React.useState('')
  const labelNameId = React.useId()

  function handleLabelCheckedChange(id: string, checked: boolean) {
    setLabels((prev) =>
      prev.map((label) => (label.id === id ? { ...label, checked } : label)),
    )
  }

  function handleCreateLabel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = labelName.trim()

    if (!name) return

    setLabels((prev) => {
      const color = LABEL_COLORS[prev.length % LABEL_COLORS.length] ?? 'orange'

      return [
        ...prev,
        {
          id: createLabelId(name, prev.length + 1),
          name,
          color,
          checked: true,
        },
      ]
    })
    toast(`Created label: ${name}`)
    setLabelName('')
    setPopoverOpen(false)
  }

  return (
    <div className="flex flex-col items-center gap-y-8">
      <span className="max-w-sm text-center text-muted-foreground text-sm">
        Press Tab to reach the footer, then create a label without closing the
        menu.
      </span>
      <DropdownMenu.Root
        open={menuOpen}
        onOpenChange={(open) => {
          // Keep the menu open while the create-label popover is open:
          // clicks inside the portaled popover register as outside presses.
          if (!open && popoverOpen) return
          setMenuOpen(open)
        }}
      >
        <DropdownMenu.Trigger render={<Button variant="outline" />}>
          Labels
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.Input placeholder="Search labels..." />
                <DropdownMenu.List>
                  {labels.map((label) => (
                    <DropdownMenu.CheckboxItem
                      key={label.id}
                      id={label.name}
                      checked={label.checked}
                      onCheckedChange={(checked) =>
                        handleLabelCheckedChange(label.id, checked)
                      }
                    >
                      <DropdownMenu.CheckboxItemIndicator />
                      <DropdownMenu.Icon>
                        <div
                          className={cn(
                            LABEL_STYLES_BG[label.color],
                            'size-2.5 rounded-full',
                          )}
                        />
                      </DropdownMenu.Icon>
                      {label.name}
                    </DropdownMenu.CheckboxItem>
                  ))}
                  <DropdownMenu.Empty />
                </DropdownMenu.List>
                <DropdownMenu.Footer>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <PlusIcon className="size-4" />
                        Create
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-72"
                      // React events from this portaled content still bubble to the
                      // Footer focus-zone handlers. Stop propagation so Tab/Escape
                      // stay scoped to the popover form.
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <form className="space-y-3" onSubmit={handleCreateLabel}>
                        <div className="space-y-2">
                          <Label htmlFor={labelNameId}>Label name</Label>
                          <Input
                            id={labelNameId}
                            value={labelName}
                            onChange={(event) =>
                              setLabelName(event.target.value)
                            }
                            placeholder="Bug"
                            autoFocus
                          />
                        </div>
                        <Button type="submit" size="sm" className="w-full">
                          Create label
                        </Button>
                      </form>
                    </PopoverContent>
                  </Popover>
                </DropdownMenu.Footer>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
