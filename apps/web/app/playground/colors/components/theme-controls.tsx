import {
  type ModeInput,
  presets,
  type ThemeInput,
  type ThemeMode,
} from '@bazza-ui/colors'
import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type FieldError = Readonly<{ path: string; message: string }> | null

type ThemeControlsProps = {
  input: ThemeInput
  error: FieldError
  onChange: (input: ThemeInput) => void
  onReset: () => void
}

const selectClassName =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function ThemeControls({
  input,
  error,
  onChange,
  onReset,
}: ThemeControlsProps) {
  const update = <Key extends keyof ThemeInput>(
    key: Key,
    value: ThemeInput[Key],
  ) => onChange({ ...input, [key]: value })

  const updateMode = (
    mode: ThemeMode,
    field: keyof ModeInput,
    value: string | number | undefined,
  ) => {
    const nextOverride: ModeInput = { ...input.modes?.[mode] }
    if (value === undefined) delete nextOverride[field]
    else if (field === 'contrast') nextOverride.contrast = value as number
    else nextOverride[field] = value as string

    const modes = { ...input.modes }
    if (Object.keys(nextOverride).length > 0) modes[mode] = nextOverride
    else delete modes[mode]
    onChange({
      ...input,
      modes: Object.keys(modes).length > 0 ? modes : undefined,
    })
  }

  const applyPreset = (event: ChangeEvent<HTMLSelectElement>) => {
    const preset = presets.find(({ id }) => id === event.currentTarget.value)
    if (!preset) return
    onChange({
      ...preset.input,
      focusStrategy: input.focusStrategy,
      stateStrategy: input.stateStrategy,
      prefix: input.prefix,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.16em]">
          Generator input
        </p>
        <h2 className="mt-1 font-semibold text-xl">Theme controls</h2>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-2">
          <Label htmlFor="color-preset">Preset</Label>
          <select
            id="color-preset"
            className={selectClassName}
            value=""
            onChange={applyPreset}
          >
            <option value="">Choose a curated preset</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          className="self-end"
          type="button"
          variant="outline"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <TextField
          id="neutral"
          label="Neutral"
          value={input.neutral}
          error={error}
          onChange={(value) => update('neutral', value)}
        />
        <TextField
          id="accent"
          label="Accent"
          value={input.accent}
          error={error}
          onChange={(value) => update('accent', value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="contrast">Contrast</Label>
          <Input
            id="contrast"
            className="w-20 text-right font-mono"
            type="number"
            min={0}
            max={100}
            value={Number.isFinite(input.contrast) ? input.contrast : ''}
            aria-invalid={error?.path === 'contrast'}
            aria-describedby={
              error?.path === 'contrast' ? 'contrast-error' : undefined
            }
            onChange={(event) =>
              update('contrast', event.currentTarget.valueAsNumber)
            }
          />
        </div>
        <Label className="sr-only" htmlFor="contrast-range">
          Contrast range
        </Label>
        <input
          id="contrast-range"
          className="h-2 w-full cursor-pointer accent-foreground"
          type="range"
          min={0}
          max={100}
          value={Number.isFinite(input.contrast) ? input.contrast : 0}
          onChange={(event) =>
            update('contrast', event.currentTarget.valueAsNumber)
          }
        />
        <ErrorMessage id="contrast-error" error={error} path="contrast" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <SelectField
          id="focus-strategy"
          label="Focus strategy"
          value={input.focusStrategy ?? 'accent'}
          options={[
            ['accent', 'Accent'],
            ['neutral', 'Neutral'],
          ]}
          error={error}
          path="focusStrategy"
          onChange={(value) =>
            update('focusStrategy', value as ThemeInput['focusStrategy'])
          }
        />
        <SelectField
          id="state-strategy"
          label="State strategy"
          value={input.stateStrategy ?? 'overlay'}
          options={[
            ['overlay', 'Overlay'],
            ['explicit', 'Explicit'],
          ]}
          error={error}
          path="stateStrategy"
          onChange={(value) =>
            update('stateStrategy', value as ThemeInput['stateStrategy'])
          }
        />
      </div>

      <TextField
        id="destructive"
        label="Destructive override"
        value={input.destructive ?? ''}
        placeholder="Generated default"
        error={error}
        onChange={(value) => update('destructive', value || undefined)}
      />
      <TextField
        id="prefix"
        label="Variable prefix"
        value={input.prefix ?? ''}
        error={error}
        onChange={(value) => update('prefix', value)}
      />

      <div className="space-y-3 border-t pt-5">
        <p className="text-muted-foreground text-xs leading-5">
          Mode overrides are optional. Blank fields inherit the base input.
        </p>
        {(['light', 'dark'] as const).map((mode) => (
          <details key={mode} className="group rounded-md border bg-muted/10">
            <summary className="cursor-pointer select-none px-3 py-2 font-medium text-sm capitalize marker:text-muted-foreground">
              {mode} overrides
            </summary>
            <div className="grid gap-4 border-t p-3">
              <TextField
                id={`${mode}-neutral`}
                label={`${capitalize(mode)} neutral override`}
                value={input.modes?.[mode]?.neutral ?? ''}
                error={error}
                path={`modes.${mode}.neutral`}
                onChange={(value) =>
                  updateMode(mode, 'neutral', value || undefined)
                }
              />
              <TextField
                id={`${mode}-accent`}
                label={`${capitalize(mode)} accent override`}
                value={input.modes?.[mode]?.accent ?? ''}
                error={error}
                path={`modes.${mode}.accent`}
                onChange={(value) =>
                  updateMode(mode, 'accent', value || undefined)
                }
              />
              <div className="space-y-2">
                <Label htmlFor={`${mode}-contrast`}>
                  {capitalize(mode)} contrast override
                </Label>
                <Input
                  id={`${mode}-contrast`}
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Inherited"
                  value={
                    Number.isFinite(input.modes?.[mode]?.contrast)
                      ? input.modes?.[mode]?.contrast
                      : ''
                  }
                  aria-invalid={error?.path === `modes.${mode}.contrast`}
                  aria-describedby={
                    error?.path === `modes.${mode}.contrast`
                      ? `${mode}-contrast-error`
                      : undefined
                  }
                  onChange={(event) =>
                    updateMode(
                      mode,
                      'contrast',
                      event.currentTarget.value === ''
                        ? undefined
                        : event.currentTarget.valueAsNumber,
                    )
                  }
                />
                <ErrorMessage
                  id={`${mode}-contrast-error`}
                  error={error}
                  path={`modes.${mode}.contrast`}
                />
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

function TextField({
  id,
  label,
  value,
  placeholder,
  error,
  path = id,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder?: string
  error: FieldError
  path?: string
  onChange: (value: string) => void
}) {
  const invalid = error?.path === path
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <ErrorMessage id={`${id}-error`} error={error} path={path} />
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  options,
  error,
  path,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: readonly (readonly [string, string])[]
  error: FieldError
  path: string
  onChange: (value: string) => void
}) {
  const invalid = error?.path === path
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className={selectClassName}
        value={value}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
      <ErrorMessage id={`${id}-error`} error={error} path={path} />
    </div>
  )
}

function ErrorMessage({
  id,
  error,
  path,
}: {
  id: string
  error: FieldError
  path: string
}) {
  if (error?.path !== path) return null
  return (
    <p id={id} className="font-mono text-destructive text-xs" role="alert">
      {error.message}
    </p>
  )
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}
