import { PlusIcon } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

const CREATABLE_LABEL_COLORS = [
  { id: 'red', label: 'Red' },
  { id: 'orange', label: 'Orange' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
  { id: 'violet', label: 'Violet' },
  { id: 'pink', label: 'Pink' },
] as const

export const LABEL_STYLES_BG = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  neutral: 'bg-neutral-500',
} as const

export type TW_COLOR = keyof typeof LABEL_STYLES_BG

type LabelRecord = {
  id: string
  name: string
  color: TW_COLOR
  checked?: boolean
}

const labelsData: LabelRecord[] = [
  { id: 'frontend', name: 'Frontend', color: 'orange' },
  { id: 'backend', name: 'Backend', color: 'teal' },
  { id: 'api', name: 'API', color: 'red' },
  { id: 'security', name: 'Security', color: 'sky' },
  { id: 'testing', name: 'Testing', color: 'yellow' },
  { id: 'documentation', name: 'Documentation', color: 'rose' },
]

export default function SubpageDemo() {
  const [labels, setLabels] = React.useState<LabelRecord[]>(labelsData)
  const [search, setSearch] = React.useState<string>('')

  const selectedLabels = React.useMemo(
    () => labels.filter((label) => label.checked),
    [labels],
  )

  const hasSelectedLabels = React.useMemo(
    () => selectedLabels.length > 0,
    [selectedLabels.length],
  )

  const normalizedSearch = React.useMemo(
    () => search.trim().toLowerCase(),
    [search],
  )

  const foundExactMatch = React.useMemo(
    () => labels.find((label) => normalizedSearch === label.name.toLowerCase()),
    [labels, normalizedSearch],
  )

  function createLabel(value: LabelRecord) {
    setLabels((prev) => [...prev, { ...value, checked: true }])
    toast(`Created label: ${value.name}`)
  }

  function handleLabelCheckedChange(id: string, checked: boolean) {
    setLabels((prev) =>
      prev.map((label) => (label.id === id ? { ...label, checked } : label)),
    )
  }

  return (
    <div className="flex flex-col items-center gap-y-8">
      <div className="flex flex-col items-center gap-y-2 text-sm text-muted-foreground">
        <span>Select labels to add them to the list.</span>
        <span>
          Then, search for a label that doesn't exist (e.g. "Bug") and create
          it.
        </span>
      </div>
      <DropdownMenu.Root>
        <div className="flex items-center gap-2">
          {selectedLabels.map((label) => (
            <div
              key={label.id}
              className="rounded-2xl border px-2.5 h-7.5 flex items-center gap-2"
            >
              <div
                className={cn(
                  LABEL_STYLES_BG[label.color],
                  'size-2.5 rounded-full',
                )}
              />
              <span className="text-sm">{label.name}</span>
            </div>
          ))}
          <DropdownMenu.Trigger
            render={
              <Button
                variant="ghost"
                className={cn(
                  'h-7.5',
                  hasSelectedLabels && 'size-7.5 rounded-full',
                )}
                size={hasSelectedLabels ? 'icon' : 'sm'}
              />
            }
          >
            <PlusIcon />
            {selectedLabels.length === 0 && 'Add label'}
          </DropdownMenu.Trigger>
        </div>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner disableAnchorTracking>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface search={search} onSearchChange={setSearch}>
                <DropdownMenu.Input placeholder="Add or change labels..." />
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
                  {normalizedSearch.length > 0 && !foundExactMatch && (
                    <DropdownMenu.SubpageTrigger
                      targetPageId="create-label"
                      forceMount
                    >
                      <DropdownMenu.Icon render={<PlusIcon />} />
                      <span className="whitespace-nowrap truncate">
                        Create new label:{' '}
                        <span className="text-muted-foreground">
                          "{search}"
                        </span>
                      </span>
                    </DropdownMenu.SubpageTrigger>
                  )}
                  <DropdownMenu.Empty />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
              <DropdownMenu.Subpage pageId="create-label">
                <DropdownMenu.Surface>
                  <DropdownMenu.Input placeholder="Choose color for label" />
                  <DropdownMenu.List>
                    {CREATABLE_LABEL_COLORS.map((color) => (
                      <DropdownMenu.SubpageBackItem
                        key={color.id}
                        value={color.label}
                        onSelect={() =>
                          createLabel({
                            id: search,
                            name: search,
                            color: color.id,
                          })
                        }
                      >
                        <DropdownMenu.Icon>
                          <div
                            className={cn(
                              LABEL_STYLES_BG[color.id],
                              'size-2.5 rounded-full',
                            )}
                          />
                        </DropdownMenu.Icon>

                        {color.label}
                      </DropdownMenu.SubpageBackItem>
                    ))}
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Subpage>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
