export type ThemeMode = 'light' | 'dark'
export type FocusStrategy = 'accent' | 'neutral'
export type StateStrategy = 'overlay' | 'explicit'
export type ModeInput = Partial<
  Pick<ThemeInput, 'neutral' | 'accent' | 'contrast'>
>
export type ThemeInput = {
  neutral: string
  accent: string
  contrast: number
  destructive?: string
  focusStrategy?: FocusStrategy
  stateStrategy?: StateStrategy
  prefix?: string
  modes?: { light?: ModeInput; dark?: ModeInput }
}
export type ResolvedModeInput = {
  neutral: string
  accent: string
  contrast: number
}
export type CoreTokens = {
  surface: { 0: string; 1: string; 2: string; 3: string; 4: string }
  foreground: {
    strong: string
    default: string
    muted: string
    disabled: string
  }
  border: { subtle: string; default: string; strong: string }
  focus: { ring: string }
  selection: { background: string; foreground: string }
  shadow: { 0: string; 1: string; 2: string; 3: string; 4: string }
  glow: { accent: string }
  opacity: { disabled: string }
}
export type GatedDiagnostic = {
  kind: 'gated'
  path: string
  foreground: string
  background: string
  measured: number
  required: number
  pass: boolean
}
export type InformationalDiagnostic = {
  kind: 'informational'
  path: string
  foreground: string
  background: string
  measured: number
}
export type ThemeDiagnostic = GatedDiagnostic | InformationalDiagnostic
export type GeneratedMode = {
  input: ResolvedModeInput
  tokens: CoreTokens
  diagnostics: readonly ThemeDiagnostic[]
}
export type GeneratedTheme = {
  input: ThemeInput
  prefix: string
  light: GeneratedMode
  dark: GeneratedMode
}
export type ThemeInputErrorCode =
  | 'invalid-input'
  | 'invalid-contrast'
  | 'invalid-prefix'
  | 'reserved-prefix'
export class ThemeInputError extends Error {
  readonly code: ThemeInputErrorCode
  readonly path: string
  readonly input: unknown
  constructor(
    code: ThemeInputErrorCode,
    path: string,
    input: unknown,
    message = `${code} at ${path}`,
  ) {
    super(message)
    this.name = 'ThemeInputError'
    this.code = code
    this.path = path
    this.input = input
  }
}
