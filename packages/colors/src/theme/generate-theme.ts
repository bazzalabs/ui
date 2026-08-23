import { parseColorSeed } from '../color.js'
import { generateMode } from './core.js'
import type {
  GeneratedTheme,
  ModeInput,
  ResolvedModeInput,
  ThemeInput,
} from './types.js'
import { ThemeInputError } from './types.js'

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const own = (value: object, key: string): boolean => Object.hasOwn(value, key)
const stringField = (value: unknown, path: string): string => {
  if (typeof value !== 'string')
    throw new ThemeInputError('invalid-input', path, value)
  return value
}
const mode = (
  base: ThemeInput,
  override: ModeInput | undefined,
): ResolvedModeInput => ({
  neutral:
    override && own(override, 'neutral')
      ? stringField(override.neutral, 'neutral')
      : base.neutral,
  accent:
    override && own(override, 'accent')
      ? stringField(override.accent, 'accent')
      : base.accent,
  contrast:
    override && own(override, 'contrast')
      ? (override.contrast as number)
      : base.contrast,
})
const validateOverride = (
  value: unknown,
  path: string,
): ModeInput | undefined => {
  if (value === undefined) return undefined
  if (!isObject(value)) throw new ThemeInputError('invalid-input', path, value)
  for (const key of Object.keys(value))
    if (key !== 'neutral' && key !== 'accent' && key !== 'contrast')
      throw new ThemeInputError('invalid-input', `${path}.${key}`, value[key])
  if (own(value, 'neutral')) stringField(value.neutral, `${path}.neutral`)
  if (own(value, 'accent')) stringField(value.accent, `${path}.accent`)
  if (
    own(value, 'contrast') &&
    (typeof value.contrast !== 'number' || !Number.isFinite(value.contrast))
  )
    throw new ThemeInputError(
      'invalid-contrast',
      `${path}.contrast`,
      value.contrast,
    )
  return value as ModeInput
}
const validateMode = (value: ResolvedModeInput, path: string): void => {
  parseColorSeed(value.neutral, `${path}.neutral`)
  parseColorSeed(value.accent, `${path}.accent`)
  if (
    !Number.isFinite(value.contrast) ||
    value.contrast < 0 ||
    value.contrast > 100
  )
    throw new ThemeInputError(
      'invalid-contrast',
      `${path}.contrast`,
      value.contrast,
    )
}
export function generateTheme(input: ThemeInput): GeneratedTheme {
  if (!isObject(input))
    throw new ThemeInputError('invalid-input', 'input', input)
  const root = input as ThemeInput & Record<string, unknown>
  const neutral = stringField(root.neutral, 'neutral')
  const accent = stringField(root.accent, 'accent')
  parseColorSeed(neutral, 'neutral')
  parseColorSeed(accent, 'accent')
  if (root.destructive !== undefined) {
    const destructive = stringField(root.destructive, 'destructive')
    parseColorSeed(destructive, 'destructive')
  }
  if (
    !Number.isFinite(input.contrast) ||
    input.contrast < 0 ||
    input.contrast > 100
  )
    throw new ThemeInputError('invalid-contrast', 'contrast', input.contrast)
  const prefix = input.prefix === undefined ? 'bui' : input.prefix
  if (typeof prefix !== 'string')
    throw new ThemeInputError('invalid-prefix', 'prefix', prefix)
  if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(prefix))
    throw new ThemeInputError('invalid-prefix', 'prefix', prefix)
  if (prefix === 'color' || prefix === 'button')
    throw new ThemeInputError('reserved-prefix', 'prefix', prefix)
  if (
    input.focusStrategy !== undefined &&
    input.focusStrategy !== 'accent' &&
    input.focusStrategy !== 'neutral'
  )
    throw new ThemeInputError(
      'invalid-input',
      'focusStrategy',
      input.focusStrategy,
    )
  if (
    input.stateStrategy !== undefined &&
    input.stateStrategy !== 'overlay' &&
    input.stateStrategy !== 'explicit'
  )
    throw new ThemeInputError(
      'invalid-input',
      'stateStrategy',
      input.stateStrategy,
    )
  if (root.modes !== undefined && !isObject(root.modes))
    throw new ThemeInputError('invalid-input', 'modes', root.modes)
  const modes = root.modes as Record<string, unknown> | undefined
  if (modes)
    for (const key of Object.keys(modes))
      if (key !== 'light' && key !== 'dark')
        throw new ThemeInputError('invalid-input', `modes.${key}`, modes[key])
  const lightOverride = validateOverride(modes?.light, 'modes.light')
  const darkOverride = validateOverride(modes?.dark, 'modes.dark')
  if (modes && own(modes, 'light') && lightOverride === undefined)
    throw new ThemeInputError('invalid-input', 'modes.light', modes.light)
  if (modes && own(modes, 'dark') && darkOverride === undefined)
    throw new ThemeInputError('invalid-input', 'modes.dark', modes.dark)
  const light = mode(input, lightOverride)
  const dark = mode(input, darkOverride)
  validateMode(light, 'modes.light')
  validateMode(dark, 'modes.dark')
  const resolvedInput = {
    ...input,
    focusStrategy: input.focusStrategy ?? 'accent',
    stateStrategy: input.stateStrategy ?? 'overlay',
    prefix,
  }
  return {
    input: resolvedInput,
    prefix,
    light: generateMode(light, 'light', resolvedInput.focusStrategy),
    dark: generateMode(dark, 'dark', resolvedInput.focusStrategy),
  }
}
