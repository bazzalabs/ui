export type ButtonVariant =
  | 'primary-neutral'
  | 'primary-accent'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
export type ButtonVisualState = 'rest' | 'hover' | 'active' | 'focus'
export type ButtonStateStrategy = 'overlay' | 'explicit'

export type ButtonStateTokens = Readonly<{
  background: string
  foreground: string
  border: string
  boxShadow: string
}>
export type ButtonVariantTokens = Readonly<{
  rest: ButtonStateTokens
  hover: ButtonStateTokens
  active: ButtonStateTokens
  focus: ButtonStateTokens
}>
export type ButtonTokens = Readonly<Record<ButtonVariant, ButtonVariantTokens>>

export type ButtonContrastDiagnostic = Readonly<{
  kind: 'gated'
  path: string
  property: 'background' | 'foreground' | 'border' | 'focus-shadow'
  foreground: string
  background: string
  measured: number
  required: number
  pass: boolean
}>
export type ButtonStateDifferenceDiagnostic = Readonly<{
  kind: 'gated'
  path: string
  property: 'background'
  rest: string
  state: string
  renderedRest: string
  renderedState: string
  measured: number
  required: number
  pass: boolean
}>
export type ButtonStructuralDiagnostic = Readonly<{
  kind: 'informational'
  path: string
  property: 'underline'
  foreground: string
  background: string
  measured: number
}>
export type ButtonDiagnostic =
  | ButtonContrastDiagnostic
  | ButtonStateDifferenceDiagnostic
  | ButtonStructuralDiagnostic
export type ButtonResults = Readonly<{
  tokens: ButtonTokens
  diagnostics: readonly ButtonDiagnostic[]
}>
