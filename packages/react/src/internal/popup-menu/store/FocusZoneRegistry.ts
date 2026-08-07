/**
 * Per-menu-tree registry of focus zones. Plain class (not a ReactStore):
 * it is only read imperatively inside event handlers and effects.
 * Created lazily by PopupMenuProviders; submenus inherit it via context.
 */
export class FocusZoneRegistry {
  private zones = new Map<string, Map<string, HTMLElement>>()

  registerZone(
    surfaceId: string,
    zoneId: string,
    element: HTMLElement,
  ): () => void {
    let surfaceZones = this.zones.get(surfaceId)
    if (!surfaceZones) {
      surfaceZones = new Map()
      this.zones.set(surfaceId, surfaceZones)
    }
    surfaceZones.set(zoneId, element)
    return () => {
      const current = this.zones.get(surfaceId)
      current?.delete(zoneId)
      if (current && current.size === 0) {
        this.zones.delete(surfaceId)
      }
    }
  }

  /** Zone elements for a surface, in DOM order. */
  getZoneElements(surfaceId: string): HTMLElement[] {
    const surfaceZones = this.zones.get(surfaceId)
    if (!surfaceZones) return []
    return [...surfaceZones.values()].sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
  }
}
