'use client'

import type {
  NodeDef,
  SubpageContentRenderParams,
  SubpageDef,
  SubpageTriggerRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import { PlusIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import { toast } from 'sonner'
import { TextMorph } from 'torph/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  BrailleMorphSpinner,
  DropdownMenu,
  LabelWithBreadcrumbs,
} from '@/registry/ui/dropdown-menu'
import { LabelDot } from '../deep-search-linear/components'
import { LabelsIcon } from '../deep-search-subpages-linear/icons'

type LabelRecord = {
  id: string
  name: string
  color: string
}

type LabelCreationStatus = 'idle' | 'creating' | 'created'

const labelData: LabelRecord[] = [
  { id: 'frontend', name: 'Frontend', color: 'orange' },
  { id: 'backend', name: 'Backend', color: 'teal' },
  { id: 'api', name: 'API', color: 'red' },
  { id: 'security', name: 'Security', color: 'sky' },
  { id: 'testing', name: 'Testing', color: 'yellow' },
  { id: 'documentation', name: 'Documentation', color: 'rose' },
]

const CREATABLE_LABEL_COLORS = [
  { id: 'red', label: 'Red' },
  { id: 'orange', label: 'Orange' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
  { id: 'violet', label: 'Violet' },
  { id: 'pink', label: 'Pink' },
] as const

function normalizeLabelName(value: string) {
  return value.trim().toLowerCase()
}

function toLabelId(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return slug || 'label'
}

function createCreateLabelSubpage(params: {
  labelName: string
  onCreateLabel: (name: string, color: string) => Promise<string | false>
  onCreatedLabelNavigateBack: (createdLabelId: string) => void
  isCreatingLabel: boolean
}): SubpageDef {
  const {
    labelName,
    onCreateLabel,
    onCreatedLabelNavigateBack,
    isCreatingLabel,
  } = params

  return {
    kind: 'subpage',
    id: `create-new-label-${labelName}`,
    value: `Create new label: ${labelName}`,
    renderTrigger: ({ props }: SubpageTriggerRenderParams) => (
      <DropdownMenu.SubpageTrigger {...props} disabled={isCreatingLabel}>
        <DropdownMenu.Icon render={<PlusIcon />}></DropdownMenu.Icon>
        <span className="whitespace-nowrap truncate">
          Create new label:{' '}
          <span className="text-muted-foreground">"{labelName}"</span>
        </span>
      </DropdownMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId }: SubpageContentRenderParams) => (
      <DropdownMenu.Subpage pageId={pageId}>
        <DropdownMenu.Surface>
          <DropdownMenu.Input
            placeholder="Pick color for label"
            disabled={isCreatingLabel}
          />
          <DropdownMenu.List>
            <DropdownMenu.Empty />
            {CREATABLE_LABEL_COLORS.map((color) => (
              <DropdownMenu.SubpageBackItem
                key={color.id}
                value={`${labelName}:${color.id}`}
                keywords={[labelName, color.label, 'create', 'label']}
                disabled={isCreatingLabel}
                onSelectAsync={async ({ goBack }) => {
                  const createdLabelId = await onCreateLabel(
                    labelName,
                    color.id,
                  )

                  if (!createdLabelId) {
                    return false
                  }

                  goBack()
                  onCreatedLabelNavigateBack(createdLabelId)
                  return false
                }}
              >
                <DropdownMenu.Icon>
                  <LabelDot color={color.id} />
                </DropdownMenu.Icon>
                {color.label}
              </DropdownMenu.SubpageBackItem>
            ))}
          </DropdownMenu.List>
        </DropdownMenu.Surface>
      </DropdownMenu.Subpage>
    ),
  }
}

function buildLabelContent(params: {
  labels: LabelRecord[]
  selectedLabelIds: Set<string>
  labelSearchQuery: string
  onLabelCheckedChange: (labelId: string, checked: boolean) => void
  onCreateLabel: (name: string, color: string) => Promise<string | false>
  onCreatedLabelNavigateBack: (createdLabelId: string) => void
  isCreatingLabel: boolean
  labelCreationStatus: LabelCreationStatus
  creatingLabelName: string | null
  highlightedLabelId: string | null
}): NodeDef[] {
  const {
    labels,
    selectedLabelIds,
    labelSearchQuery,
    onLabelCheckedChange,
    onCreateLabel,
    onCreatedLabelNavigateBack,
    isCreatingLabel,
    labelCreationStatus,
    creatingLabelName,
    highlightedLabelId,
  } = params

  const trimmedQuery = labelSearchQuery.trim()
  const normalizedQuery = normalizeLabelName(trimmedQuery)
  const normalizedCreatingLabelName = creatingLabelName
    ? normalizeLabelName(creatingLabelName)
    : ''

  const hasExactMatch =
    normalizedQuery.length > 0 &&
    labels.some((label) => normalizeLabelName(label.name) === normalizedQuery)

  const shouldKeepCreateSubpageMounted =
    labelCreationStatus === 'creating' &&
    normalizedCreatingLabelName === normalizedQuery

  const nodes: NodeDef[] = labels.map((label) => ({
    kind: 'checkbox-item',
    id: label.id,
    value: label.name,
    keywords: [label.name],
    checked: selectedLabelIds.has(label.id),
    onCheckedChange: (checked) =>
      onLabelCheckedChange(label.id, checked === true),
    render: ({ props }) => (
      <DropdownMenu.CheckboxItem
        {...props}
        disabled={isCreatingLabel}
        data-created-label-id={label.id}
        data-created-label-target={
          highlightedLabelId === label.id ? '' : undefined
        }
      >
        <DropdownMenu.CheckboxItemIndicator className="opacity-0 data-checked:opacity-100 data-unchecked:group-data-highlighted/row:opacity-100" />
        <DropdownMenu.Icon>
          <LabelDot color={label.color} />
        </DropdownMenu.Icon>
        <LabelWithBreadcrumbs label={label.name} />
      </DropdownMenu.CheckboxItem>
    ),
  }))

  if (
    normalizedQuery.length > 0 &&
    (!hasExactMatch || shouldKeepCreateSubpageMounted)
  ) {
    nodes.push(
      createCreateLabelSubpage({
        labelName: trimmedQuery,
        onCreateLabel,
        onCreatedLabelNavigateBack,
        isCreatingLabel,
      }),
    )
  }

  return nodes
}

export default function DropdownMenuLinearSubpageLabelCreation() {
  const [labels, setLabels] = React.useState<LabelRecord[]>(() => [
    ...labelData.sort((a, b) => a.name.localeCompare(b.name)),
  ])
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<Set<string>>(
    () => new Set(),
  )
  const [labelSearchQuery, setLabelSearchQuery] = React.useState('')
  const [isCreatingLabel, setIsCreatingLabel] = React.useState(false)
  const [labelCreationStatus, setLabelCreationStatus] =
    React.useState<LabelCreationStatus>('idle')
  const [creatingLabelName, setCreatingLabelName] = React.useState<
    string | null
  >(null)
  const [creatingLabelColor, setCreatingLabelColor] = React.useState<string>(
    CREATABLE_LABEL_COLORS[0].id,
  )
  const [pendingCreatedLabelId, setPendingCreatedLabelId] = React.useState<
    string | null
  >(null)

  const createdLabelIndex = React.useRef(0)
  const hideCreationHeaderTimeoutRef = React.useRef<number | null>(null)

  const clearHideCreationHeaderTimeout = React.useCallback(() => {
    if (hideCreationHeaderTimeoutRef.current === null) {
      return
    }

    window.clearTimeout(hideCreationHeaderTimeoutRef.current)
    hideCreationHeaderTimeoutRef.current = null
  }, [])

  React.useEffect(() => {
    return () => {
      clearHideCreationHeaderTimeout()
    }
  }, [clearHideCreationHeaderTimeout])

  const handleLabelCheckedChange = React.useCallback(
    (labelId: string, checked: boolean) => {
      setSelectedLabelIds((prev) => {
        const next = new Set(prev)

        if (checked) {
          next.add(labelId)
        } else {
          next.delete(labelId)
        }

        return next
      })
    },
    [],
  )

  const handleCreateLabel = React.useCallback(
    async (name: string, color: string) => {
      if (isCreatingLabel) {
        return false
      }

      const trimmedName = name.trim()

      if (!trimmedName) {
        return false
      }

      const normalizedName = normalizeLabelName(trimmedName)
      const exists = labels.some(
        (label) => normalizeLabelName(label.name) === normalizedName,
      )

      if (exists) {
        toast(`Label "${trimmedName}" already exists.`)
        return false
      }

      clearHideCreationHeaderTimeout()
      setCreatingLabelName(trimmedName)
      setCreatingLabelColor(color)
      setIsCreatingLabel(true)
      setLabelCreationStatus('creating')

      let didCreate = false

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000))

        createdLabelIndex.current += 1
        const createdLabelId = `${toLabelId(trimmedName)}-${createdLabelIndex.current}`

        setLabels((prevLabels) =>
          [
            ...prevLabels,
            {
              id: createdLabelId,
              name: trimmedName,
              color,
            },
          ].sort((a, b) => a.name.localeCompare(b.name)),
        )

        setSelectedLabelIds((prev) => {
          const next = new Set(prev)
          next.add(createdLabelId)
          return next
        })

        setLabelSearchQuery(trimmedName)
        didCreate = true
        setLabelCreationStatus('created')

        hideCreationHeaderTimeoutRef.current = window.setTimeout(() => {
          setLabelCreationStatus('idle')
          setCreatingLabelName(null)
          hideCreationHeaderTimeoutRef.current = null
        }, 2000)

        toast(`Created label "${trimmedName}".`)
        return createdLabelId
      } finally {
        setIsCreatingLabel(false)

        if (!didCreate) {
          setCreatingLabelName(null)
          setLabelCreationStatus('idle')
        }
      }
    },
    [isCreatingLabel, labels, clearHideCreationHeaderTimeout],
  )

  const handleCreatedLabelNavigateBack = React.useCallback(
    (createdLabelId: string) => {
      setLabelSearchQuery('')
      setPendingCreatedLabelId(createdLabelId)
    },
    [],
  )

  const handleLabelHighlightChange = React.useCallback((id: string | null) => {
    if (!id) {
      return
    }

    const colonIndex = id.lastIndexOf(':')
    if (colonIndex === -1) {
      return
    }

    const colorId = id.slice(colonIndex + 1)
    if (CREATABLE_LABEL_COLORS.some((c) => c.id === colorId)) {
      setCreatingLabelColor(colorId)
    }
  }, [])

  React.useEffect(() => {
    if (!pendingCreatedLabelId) {
      return
    }

    let canceled = false
    let frame = 0
    let attempts = 0

    const highlightAndScroll = () => {
      if (canceled) {
        return
      }

      const target = document.querySelector<HTMLElement>(
        '[data-created-label-target]',
      )

      if (target) {
        target.scrollIntoView({ block: 'nearest' })

        if (typeof window.PointerEvent === 'function') {
          target.dispatchEvent(
            new PointerEvent('pointermove', { bubbles: true }),
          )
        } else {
          target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
        }

        setPendingCreatedLabelId(null)
        return
      }

      if (attempts >= 16) {
        setPendingCreatedLabelId(null)
        return
      }

      attempts += 1
      frame = window.requestAnimationFrame(highlightAndScroll)
    }

    frame = window.requestAnimationFrame(highlightAndScroll)

    return () => {
      canceled = true
      window.cancelAnimationFrame(frame)
    }
  }, [pendingCreatedLabelId])

  const autoHighlightFirst = React.useMemo(() => {
    if (!pendingCreatedLabelId) {
      return true
    }

    const createdLabel = labels.find(
      (label) => label.id === pendingCreatedLabelId,
    )
    return createdLabel?.name ?? true
  }, [labels, pendingCreatedLabelId])

  const content = React.useMemo(
    () =>
      buildLabelContent({
        labels,
        selectedLabelIds,
        labelSearchQuery,
        onLabelCheckedChange: handleLabelCheckedChange,
        onCreateLabel: handleCreateLabel,
        onCreatedLabelNavigateBack: handleCreatedLabelNavigateBack,
        isCreatingLabel,
        labelCreationStatus,
        creatingLabelName,
        highlightedLabelId: pendingCreatedLabelId,
      }),
    [
      labels,
      selectedLabelIds,
      labelSearchQuery,
      handleLabelCheckedChange,
      handleCreateLabel,
      handleCreatedLabelNavigateBack,
      isCreatingLabel,
      labelCreationStatus,
      creatingLabelName,
      pendingCreatedLabelId,
    ],
  )

  const trimmedQuery = labelSearchQuery.trim()

  return (
    <DropdownMenu.Root
      onHighlightChange={handleLabelHighlightChange}
      onOpenChange={(open) => {
        if (!open) {
          clearHideCreationHeaderTimeout()
          setLabelSearchQuery('')
          setLabelCreationStatus('idle')
          setCreatingLabelName(null)
        }
      }}
    >
      <DropdownMenu.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full size-7 text-muted-foreground hover:text-primary aria-expanded:text-primary"
          />
        }
      >
        <PlusIcon />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner side="right" align="start" alignOffset={-44}>
          <DropdownMenu.Popup
            render={({ className, children, ...props }, state) => (
              <>
                <AnimatePresence>
                  {(state.hasOpenSubpage || labelCreationStatus !== 'idle') && (
                    <motion.div
                      className="absolute -z-10 -top-8 pb-4 left-0 right-0 rounded-t-2xl bg-muted border"
                      initial={{
                        y: 50,
                        filter: 'blur(4px)',
                        opacity: 0,
                        scale: 0.95,
                      }}
                      animate={{
                        y: 0,
                        filter: 'blur(0px)',
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{
                        y: 50,
                        filter: 'blur(4px)',
                        opacity: 0,
                        scale: 0.95,
                      }}
                      transition={{
                        duration: 0.2,
                        ease: 'easeOut',
                      }}
                    >
                      <div className="px-4.5 py-2 text-xs flex items-center gap-2">
                        <AnimatePresence mode="wait" initial={false}>
                          {labelCreationStatus === 'idle' ? (
                            <motion.div
                              key="idle"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.18, ease: 'easeOut' }}
                            >
                              <LabelsIcon />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="braille"
                              initial={{ opacity: 0, scale: 0.75 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.75 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                              <BrailleMorphSpinner
                                className="size-4"
                                mode={
                                  labelCreationStatus === 'creating'
                                    ? 'loading'
                                    : 'success'
                                }
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="inline-flex items-center gap-1.5">
                          <TextMorph className="text-muted-foreground">
                            {labelCreationStatus === 'creating'
                              ? 'Creating'
                              : labelCreationStatus === 'created'
                                ? 'Created'
                                : 'Create'}
                          </TextMorph>
                          <div className="flex items-center gap-1">
                            <LabelDot
                              color={creatingLabelColor}
                              className="size-2"
                            />
                            <span>
                              {labelCreationStatus === 'idle'
                                ? trimmedQuery
                                : (creatingLabelName ?? trimmedQuery)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div {...props} className={cn(className, '!outline-none')}>
                  {children}
                </div>
              </>
            )}
          >
            <DropdownMenu.Surface
              content={content}
              deepSearch={{ enabled: true, minLength: 0 }}
              search={labelSearchQuery}
              onSearchChange={setLabelSearchQuery}
              autoHighlightFirst={autoHighlightFirst}
            >
              <DropdownMenu.Input
                placeholder="Change labels..."
                disabled={isCreatingLabel}
              />
              <DropdownMenu.List virtualized />
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
