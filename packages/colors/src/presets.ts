import type { ThemeInput } from './theme/types.js'
export type ThemePresetInput = Pick<
  ThemeInput,
  'neutral' | 'accent' | 'contrast'
> &
  Partial<Pick<ThemeInput, 'destructive' | 'modes'>>
export type ThemePreset = Readonly<{
  id: string
  name: string
  description: string
  input: ThemePresetInput
}>
export const presets: readonly ThemePreset[] = [
  {
    id: 'warm-red',
    name: 'Warm red',
    description: 'Warm red accent',
    input: { neutral: 'oklch(0.60 0.025 55)', accent: '#e11d48', contrast: 50 },
  },
  {
    id: 'cool-blue',
    name: 'Cool blue',
    description: 'Cool blue accent',
    input: { neutral: 'oklch(0.60 0.03 250)', accent: '#2563eb', contrast: 50 },
  },
  {
    id: 'achromatic-yellow',
    name: 'Achromatic yellow',
    description: 'Achromatic neutral with yellow accent',
    input: { neutral: '#808080', accent: '#eab308', contrast: 50 },
  },
  {
    id: 'high-chroma-purple',
    name: 'High-chroma purple',
    description: 'High-chroma purple accent',
    input: { neutral: '#737373', accent: 'oklch(0.55 0.30 300)', contrast: 50 },
  },
  {
    id: 'high-chroma-green',
    name: 'High-chroma green',
    description: 'High-chroma green accent',
    input: { neutral: '#737373', accent: 'oklch(0.60 0.25 145)', contrast: 50 },
  },
  {
    id: 'minimum-contrast',
    name: 'Minimum contrast',
    description: 'Minimum contrast',
    input: { neutral: '#737373', accent: '#2563eb', contrast: 0 },
  },
  {
    id: 'maximum-contrast',
    name: 'Maximum contrast',
    description: 'Maximum contrast',
    input: { neutral: '#737373', accent: '#2563eb', contrast: 100 },
  },
]
