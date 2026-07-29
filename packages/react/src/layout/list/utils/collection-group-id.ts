export function encodeCollectionGroupId(id: string): string {
  return `list:${id.length}:${id}`
}
