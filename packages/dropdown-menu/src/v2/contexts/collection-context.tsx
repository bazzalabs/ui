import * as React from 'react'
import type {
  Collection,
  CollectionActions,
  NodeKind,
  NodeRegistration,
} from '../types.js'

// ============================================================================
// Collection Context
// ============================================================================

/**
 * Context value for the collection system.
 * Provides access to registered nodes and actions to register/unregister.
 */
export interface CollectionContextValue<TData = unknown> {
  /** The collection state */
  collection: Collection<TData>
  /** Actions to manipulate the collection */
  actions: CollectionActions<TData>
}

const CollectionContext = React.createContext<CollectionContextValue | null>(
  null,
)

CollectionContext.displayName = 'CollectionContext'

// ============================================================================
// Submenu Path Context
// ============================================================================

/**
 * Context for tracking the current submenu path.
 * Each nested submenu extends this path.
 */
const SubmenuPathContext = React.createContext<string[]>([])

SubmenuPathContext.displayName = 'SubmenuPathContext'

// ============================================================================
// Group Context
// ============================================================================

/**
 * Context for tracking the current group ID.
 */
const GroupContext = React.createContext<string | null>(null)

GroupContext.displayName = 'GroupContext'

// ============================================================================
// Collection Provider
// ============================================================================

export interface CollectionProviderProps {
  children: React.ReactNode
}

/**
 * Creates the initial empty collection state.
 */
function createCollection<TData = unknown>(): Collection<TData> {
  return {
    nodes: new Map(),
    order: [],
    submenuLabels: new Map(),
  }
}

/**
 * Provider component that manages the collection state.
 * Should wrap the entire menu tree.
 */
export function CollectionProvider({ children }: CollectionProviderProps) {
  const collectionRef = React.useRef<Collection>(createCollection())
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  const actions = React.useMemo<CollectionActions>(() => {
    return {
      register: (node: NodeRegistration) => {
        const collection = collectionRef.current
        collection.nodes.set(node.id, node)

        // Add to order if not already present
        if (!collection.order.includes(node.id)) {
          collection.order.push(node.id)
        }

        forceUpdate()

        // Return unregister function
        return () => {
          actions.unregister(node.id)
        }
      },

      unregister: (id: string) => {
        const collection = collectionRef.current
        collection.nodes.delete(id)
        collection.order = collection.order.filter((nodeId) => nodeId !== id)
        forceUpdate()
      },

      registerSubmenuLabel: (id: string, label: string) => {
        collectionRef.current.submenuLabels.set(id, label)
      },

      getNode: (id: string) => {
        return collectionRef.current.nodes.get(id)
      },

      getAllNodes: () => {
        return Array.from(collectionRef.current.nodes.values())
      },

      getSearchableNodes: () => {
        const searchableKinds: NodeKind[] = [
          'item',
          'checkbox-item',
          'radio-item',
          'submenu-trigger',
        ]
        return Array.from(collectionRef.current.nodes.values()).filter((node) =>
          searchableKinds.includes(node.kind),
        )
      },

      getNavigableIds: () => {
        const navigableKinds: NodeKind[] = [
          'item',
          'checkbox-item',
          'radio-item',
          'submenu-trigger',
        ]
        return collectionRef.current.order.filter((id) => {
          const node = collectionRef.current.nodes.get(id)
          return node && navigableKinds.includes(node.kind) && !node.disabled
        })
      },

      getSubmenuLabel: (id: string) => {
        return collectionRef.current.submenuLabels.get(id)
      },
    }
  }, [])

  const value = React.useMemo<CollectionContextValue>(
    () => ({
      collection: collectionRef.current,
      actions,
    }),
    [actions],
  )

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  )
}

// ============================================================================
// Submenu Path Provider
// ============================================================================

export interface SubmenuPathProviderProps {
  /** ID of this submenu */
  submenuId: string
  children: React.ReactNode
}

/**
 * Provider that extends the submenu path for nested submenus.
 */
export function SubmenuPathProvider({
  submenuId,
  children,
}: SubmenuPathProviderProps) {
  const parentPath = React.useContext(SubmenuPathContext)
  const path = React.useMemo(
    () => [...parentPath, submenuId],
    [parentPath, submenuId],
  )

  return (
    <SubmenuPathContext.Provider value={path}>
      {children}
    </SubmenuPathContext.Provider>
  )
}

// ============================================================================
// Group Provider
// ============================================================================

export interface GroupProviderProps {
  /** ID of this group */
  groupId: string
  children: React.ReactNode
}

/**
 * Provider that sets the group ID for nested items.
 */
export function GroupProvider({ groupId, children }: GroupProviderProps) {
  return (
    <GroupContext.Provider value={groupId}>{children}</GroupContext.Provider>
  )
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the collection context.
 * Throws if used outside of CollectionProvider.
 */
export function useCollection<
  TData = unknown,
>(): CollectionContextValue<TData> {
  const context = React.useContext(CollectionContext)
  if (!context) {
    throw new Error('useCollection must be used within a CollectionProvider')
  }
  return context as CollectionContextValue<TData>
}

/**
 * Hook to access the collection context, or null if not in a provider.
 * Useful for optional collection participation.
 */
export function useCollectionOptional<
  TData = unknown,
>(): CollectionContextValue<TData> | null {
  return React.useContext(
    CollectionContext,
  ) as CollectionContextValue<TData> | null
}

/**
 * Hook to get the current submenu path.
 */
export function useSubmenuPath(): string[] {
  return React.useContext(SubmenuPathContext)
}

/**
 * Hook to get the current group ID.
 */
export function useGroupId(): string | null {
  return React.useContext(GroupContext)
}

// ============================================================================
// Registration Hook
// ============================================================================

export interface UseRegisterNodeOptions<TData = unknown> {
  /** Unique ID for the node */
  id: string
  /** Type of node */
  kind: NodeKind
  /** Text content for searching */
  textValue: string
  /** Additional search keywords */
  keywords?: string[]
  /** Whether the node is disabled */
  disabled?: boolean
  /** Custom data associated with this node */
  data?: TData
  /** Function to render this node */
  render: () => React.ReactNode
  /** Ref to the DOM element */
  ref?: React.RefObject<HTMLElement | null>
}

/**
 * Hook to register a node with the collection.
 * Automatically handles registration/unregistration and path context.
 */
export function useRegisterNode<TData = unknown>(
  options: UseRegisterNodeOptions<TData>,
): void {
  const { actions } = useCollection<TData>()
  const parentPath = useSubmenuPath()
  const groupId = useGroupId()

  const { id, kind, textValue, keywords, disabled, data, render, ref } = options

  React.useEffect(() => {
    const registration: NodeRegistration<TData> = {
      id,
      kind,
      textValue,
      keywords,
      disabled,
      parentPath,
      groupId,
      data,
      render,
      ref,
    }

    const unregister = actions.register(registration)
    return unregister
  }, [
    actions,
    id,
    kind,
    textValue,
    keywords,
    disabled,
    parentPath,
    groupId,
    data,
    render,
    ref,
  ])
}

/**
 * Hook to register a submenu label for breadcrumbs.
 */
export function useRegisterSubmenuLabel(id: string, label: string): void {
  const { actions } = useCollection()

  React.useEffect(() => {
    actions.registerSubmenuLabel(id, label)
  }, [actions, id, label])
}
