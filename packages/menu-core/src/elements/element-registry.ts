/** What the registry needs of an element: DOM `Node.contains`. */
export interface ContainingNode<N> {
  contains(other: N | null): boolean
}

/** The part of a menu tree an element renders. */
export type ElementRole =
  | 'trigger'
  | 'positioner'
  | 'popup'
  | 'surface'
  | 'backdrop'

type Entry<N> = readonly [role: ElementRole, element: N, surfaceId?: string]

/**
 * The elements one menu tree renders, registered by the parts that render
 * them, so a check of whether a node is part of the tree reads what the tree
 * registered and never attributes on the page. A portaled submenu counts
 * because its elements registered, not because of where it sits in the DOM.
 *
 * Exempt elements sit outside the tree but don't dismiss it, such as a
 * suggestion menu's host input. A tree rendered
 * inside this one nests its registry (`nest`), and parts claim events on
 * content they portal out of their element (`claim`).
 */
export class ElementRegistry<N extends ContainingNode<N> = Node> {
  readonly #entries = new Set<Entry<N>>()
  readonly #nested = new Set<ElementRegistry<N>>()
  readonly #claimed = new WeakSet<object>()
  /**
   * The exempt elements, read on each check. The tree's root sets it on each
   * render.
   */
  getExempt: (() => ReadonlyArray<N | null | undefined>) | undefined
  /**
   * The press outside the tree's elements that the tree's root saw in the
   * current task, if any. The root sets it from its pointer listener and
   * clears it once the task ends: a focus-out the press causes in that task
   * reaches the root as the press.
   */
  outsidePressThisTask: object | null = null

  /**
   * Registers an element until the returned function removes it. A popup
   * passes the id of the surface it opens with.
   */
  add(role: ElementRole, element: N, surfaceId?: string): () => void {
    const entry: Entry<N> = [role, element, surfaceId]
    this.#entries.add(entry)
    return () => {
      this.#entries.delete(entry)
    }
  }

  /**
   * Nests the registry of a menu tree rendered inside this one (a select in a
   * dropdown menu's popup) until the returned function removes it: what the
   * nested tree owns, this one owns too, at any depth.
   */
  nest(registry: ElementRegistry<N>): () => void {
    this.#nested.add(registry)
    return () => {
      this.#nested.delete(registry)
    }
  }

  /**
   * Whether `target` is inside an element the tree registered, or one a
   * nested tree did.
   */
  owns(target: N | null): boolean {
    for (const [, element] of this.#entries) {
      if (element.contains(target)) return true
    }
    for (const registry of this.#nested) {
      if (registry.owns(target)) return true
    }
    return false
  }

  /**
   * Marks an event as dispatched through one of the tree's parts in the UI
   * framework's tree. Content a part renders through a portal (a consumer's
   * popover opened from a menu item) sits outside every registered element in
   * the DOM, but its events still pass through that part.
   */
  claim(event: object): void {
    this.#claimed.add(event)
  }

  /** Whether a part of the tree, or of a tree nested in it, claimed `event`. */
  claimed(event: object): boolean {
    if (this.#claimed.has(event)) return true
    for (const registry of this.#nested) {
      if (registry.claimed(event)) return true
    }
    return false
  }

  /**
   * Whether `target` is inside a backdrop the tree registered: a press there
   * is outside its popups, though the tree owns the element.
   */
  inBackdrop(target: N | null): boolean {
    for (const [role, element] of this.#entries) {
      if (role === 'backdrop' && element.contains(target)) return true
    }
    return false
  }

  /** Whether `target` is inside an exempt element. */
  isExempt(target: N | null): boolean {
    return !!this.getExempt?.().some((element) => element?.contains(target))
  }

  /**
   * The surface id of the innermost popup this tree registered holding
   * `target` (nested trees' aren't counted), or `null` when no popup does.
   */
  surfaceFor(target: N | null): string | null {
    return this.#popupFor(target)?.[2] ?? null
  }

  /**
   * The innermost registered popup element holding `target`, this tree's or
   * a nested tree's.
   */
  popupFor(target: N | null): N | null {
    let found = this.#popupFor(target)?.[1] ?? null
    for (const registry of this.#nested) {
      const popup = registry.popupFor(target)
      if (popup && (!found || found.contains(popup))) found = popup
    }
    return found
  }

  #popupFor(target: N | null): Entry<N> | undefined {
    let found: Entry<N> | undefined
    for (const entry of this.#entries) {
      const [role, element] = entry
      if (
        role === 'popup' &&
        element.contains(target) &&
        (!found || found[1].contains(element))
      ) {
        found = entry
      }
    }
    return found
  }
}
