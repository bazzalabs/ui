export const contrastT = (contrast: number): number => contrast / 100
export const smoothstep = (
  edge0: number,
  edge1: number,
  value: number,
): number => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
export const surfaceLightness = (
  mode: 'light' | 'dark',
  depth: number,
  contrast: number,
): number => {
  const t = contrastT(contrast)
  return mode === 'light'
    ? Math.min(0.995, 0.965 - 0.02 * t + depth * (0.00875 + 0.00375 * t))
    : Math.min(0.995, 0.1 + depth * (0.025 + 0.0125 * t))
}
export const surfaceChroma = (
  mode: 'light' | 'dark',
  lightness: number,
  neutralChroma: number,
): number =>
  mode === 'light'
    ? neutralChroma * 0.35
    : neutralChroma * smoothstep(0.15, 0.35, lightness) * 0.35
