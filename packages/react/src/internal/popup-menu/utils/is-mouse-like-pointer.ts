/**
 * On some Linux + Chromium setups, mouse inputs may report pointerType as "pen".
 */
export function isMouseLikePointerType(
  pointerType: string | undefined,
  strict = false,
): boolean {
  const mouseLikeTypes: Array<string | undefined> = ['mouse', 'pen']

  if (!strict) {
    mouseLikeTypes.push('', undefined)
  }

  return mouseLikeTypes.includes(pointerType)
}
