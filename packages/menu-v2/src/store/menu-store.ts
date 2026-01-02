import * as React from 'react'
import { createSelector, ReactStore } from '@base-ui/utils/store'
import type {
  MenuState,
  MenuContext,
  RowRecord,
  SurfaceState,
} from './types.js'

const ROOT_SURFACE_ID = 'root'

/**
 * Selectors for the menu store
 */
const selectors = {
  open: createSelector((state: MenuState) => state.open),
  disabled: createSelector((state: MenuState) => state.disabled),
  query: createSelector((state: MenuState) => state.query),
  direction: createSelector((state: MenuState) => state.direction),
  vimBindings: createSelector((state: MenuState) => state.vimBindings),
  loop: createSelector((state: MenuState) => state.loop),
  activeSurfaceId: createSelector((state: MenuState) => state.activeSurfaceId),
  order: createSelector((state: MenuState) => state.order),

  /** Get active ID for a specific surface */
  activeId: createSelector((state: MenuState, surfaceId: string) => {
    const surface = state.surfaces.get(surfaceId)
    return surface?.activeId ?? null
  }),

  /** Check if a specific row is active */
  isActive: createSelector((state: MenuState, rowId: string) => {
    // Find which surface this row belongs to
    const row = state.rows.get(rowId)
    if (!row) return false
    const surface = state.surfaces.get(row.surfaceId)
    return surface?.activeId === rowId
  }),

  /** Get a specific surface */
  surface: createSelector((state: MenuState, surfaceId: string) => {
    return state.surfaces.get(surfaceId)
  }),

  /** Get a specific row */
  row: createSelector((state: MenuState, rowId: string) => {
    return state.rows.get(rowId)
  }),
}

/**
 * Create initial menu state
 */
function createInitialState(initialState?: Partial<MenuState>): MenuState {
  return {
    open: false,
    disabled: false,
    query: '',
    direction: 'ltr',
    vimBindings: false,
    loop: true,
    surfaces: new Map([
      [
        ROOT_SURFACE_ID,
        {
          id: ROOT_SURFACE_ID,
          parentId: null,
          open: true,
          activeId: null,
          depth: 0,
        },
      ],
    ]),
    activeSurfaceId: ROOT_SURFACE_ID,
    rows: new Map(),
    order: [],
    ...initialState,
  }
}

/**
 * Create initial menu context
 */
function createInitialContext(): MenuContext {
  return {
    inputRef: React.createRef<HTMLInputElement>(),
    listRef: React.createRef<HTMLDivElement>(),
    onOpenChange: undefined,
    onQueryChange: undefined,
  }
}

/**
 * Menu store class extending Base UI's ReactStore
 */
export class MenuStore extends ReactStore<
  MenuState,
  MenuContext,
  typeof selectors
> {
  constructor(initialState?: Partial<MenuState>) {
    super(createInitialState(initialState), createInitialContext(), selectors)
  }

  /**
   * Hook to create/get a menu store instance
   */
  static useStore(
    externalStore: MenuStore | undefined,
    initialState?: Partial<MenuState>,
  ): MenuStore {
    const storeRef = React.useRef<MenuStore | undefined>(undefined)
    if (!storeRef.current) {
      storeRef.current = externalStore ?? new MenuStore(initialState)
    }
    return storeRef.current
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation Actions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Navigate to the first item
   */
  first(surfaceId: string = ROOT_SURFACE_ID): void {
    const order = this.getOrderForSurface(surfaceId)
    if (order.length === 0) return

    const firstId = this.findNextEnabledRow(order, -1, 1)
    if (firstId) {
      this.setActiveId(surfaceId, firstId)
    }
  }

  /**
   * Navigate to the last item
   */
  last(surfaceId: string = ROOT_SURFACE_ID): void {
    const order = this.getOrderForSurface(surfaceId)
    if (order.length === 0) return

    const lastId = this.findNextEnabledRow(order, order.length, -1)
    if (lastId) {
      this.setActiveId(surfaceId, lastId)
    }
  }

  /**
   * Navigate to the next item
   */
  next(surfaceId: string = ROOT_SURFACE_ID): void {
    const order = this.getOrderForSurface(surfaceId)
    if (order.length === 0) return

    const surface = this.state.surfaces.get(surfaceId)
    const currentIndex = surface?.activeId
      ? order.indexOf(surface.activeId)
      : -1

    const nextId = this.findNextEnabledRow(order, currentIndex, 1)
    if (nextId) {
      this.setActiveId(surfaceId, nextId)
    }
  }

  /**
   * Navigate to the previous item
   */
  prev(surfaceId: string = ROOT_SURFACE_ID): void {
    const order = this.getOrderForSurface(surfaceId)
    if (order.length === 0) return

    const surface = this.state.surfaces.get(surfaceId)
    const currentIndex = surface?.activeId
      ? order.indexOf(surface.activeId)
      : order.length

    const prevId = this.findNextEnabledRow(order, currentIndex, -1)
    if (prevId) {
      this.setActiveId(surfaceId, prevId)
    }
  }

  /**
   * Set the active (highlighted) item
   */
  setActiveId(surfaceId: string, id: string | null): void {
    const surface = this.state.surfaces.get(surfaceId)
    if (!surface) return

    const newSurfaces = new Map(this.state.surfaces)
    newSurfaces.set(surfaceId, { ...surface, activeId: id })
    this.set('surfaces', newSurfaces)

    // Scroll into view if needed
    if (id) {
      const row = this.state.rows.get(id)
      row?.ref.current?.scrollIntoView({ block: 'nearest' })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Row Registry
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register a row (item) in the menu
   */
  registerRow(row: RowRecord): void {
    const newRows = new Map(this.state.rows)
    newRows.set(row.id, row)

    // Update order - add at end for now
    // TODO: Could use DOM order detection for proper ordering
    const newOrder = this.state.order.includes(row.id)
      ? this.state.order
      : [...this.state.order, row.id]

    this.update({
      rows: newRows,
      order: newOrder,
    })
  }

  /**
   * Unregister a row from the menu
   */
  unregisterRow(id: string): void {
    const newRows = new Map(this.state.rows)
    newRows.delete(id)

    const newOrder = this.state.order.filter((rowId) => rowId !== id)

    this.update({
      rows: newRows,
      order: newOrder,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Surface Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register a surface (submenu level)
   */
  registerSurface(surface: SurfaceState): void {
    const newSurfaces = new Map(this.state.surfaces)
    newSurfaces.set(surface.id, surface)
    this.set('surfaces', newSurfaces)
  }

  /**
   * Unregister a surface
   */
  unregisterSurface(id: string): void {
    const newSurfaces = new Map(this.state.surfaces)
    newSurfaces.delete(id)
    this.set('surfaces', newSurfaces)
  }

  /**
   * Open a surface (submenu)
   */
  openSurface(id: string): void {
    const surface = this.state.surfaces.get(id)
    if (!surface) return

    const newSurfaces = new Map(this.state.surfaces)
    newSurfaces.set(id, { ...surface, open: true })
    this.update({
      surfaces: newSurfaces,
      activeSurfaceId: id,
    })
  }

  /**
   * Close a surface (submenu)
   */
  closeSurface(id: string): void {
    const surface = this.state.surfaces.get(id)
    if (!surface) return

    const newSurfaces = new Map(this.state.surfaces)
    newSurfaces.set(id, { ...surface, open: false })

    // Set active surface to parent
    this.update({
      surfaces: newSurfaces,
      activeSurfaceId: surface.parentId ?? ROOT_SURFACE_ID,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Query
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Set the search query
   */
  setQuery(query: string): void {
    this.set('query', query)
    this.context.onQueryChange?.(query)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Open/Close
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Set the open state
   */
  setOpen(open: boolean): void {
    this.set('open', open)
    this.context.onOpenChange?.(open)

    // Reset query when closing
    if (!open) {
      this.set('query', '')
    }
  }

  /**
   * Toggle the open state
   */
  toggle(): void {
    this.setOpen(!this.state.open)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the order array for a specific surface
   */
  private getOrderForSurface(surfaceId: string): string[] {
    // Filter order to only include rows belonging to this surface
    return this.state.order.filter((id) => {
      const row = this.state.rows.get(id)
      return row?.surfaceId === surfaceId
    })
  }

  /**
   * Find the next enabled row in the given direction
   */
  private findNextEnabledRow(
    order: string[],
    startIndex: number,
    direction: 1 | -1,
  ): string | null {
    const len = order.length
    if (len === 0) return null

    let index = startIndex + direction
    let iterations = 0

    while (iterations < len) {
      // Handle wrapping
      if (this.state.loop) {
        if (index < 0) index = len - 1
        if (index >= len) index = 0
      } else {
        if (index < 0 || index >= len) return null
      }

      const id = order[index]
      const row = this.state.rows.get(id!)
      if (row && !row.disabled) {
        return id!
      }

      index += direction
      iterations++
    }

    return null
  }
}

export { ROOT_SURFACE_ID }
