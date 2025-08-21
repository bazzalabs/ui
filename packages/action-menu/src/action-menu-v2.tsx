/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
import { composeEventHandlers } from '@radix-ui/primitive'
import { composeRefs } from '@radix-ui/react-compose-refs'
import { DismissableLayer } from '@radix-ui/react-dismissable-layer'
import * as Popper from '@radix-ui/react-popper'
import { Presence } from '@radix-ui/react-presence'
import { Primitive } from '@radix-ui/react-primitive'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'

/* =========================================================================== */
/* ============================ Data model (generic) ========================== */
/* =========================================================================== */

export type MenuNodeKind = 'item' | 'group' | 'submenu'

export type BaseNode<K extends MenuNodeKind> = {
  id: string
  kind: K
  hidden?: boolean
}

export type Searchable = {
  label?: string
  keywords?: string[]
}

export type Renderable = {
  /** Optional visual fallback; if you use renderers, you can set this to () => null */
  render?: () => React.ReactNode
}

/** Item row with per-instance data payload `T` */
export type ItemNode<T = unknown> = BaseNode<'item'> &
  Searchable &
  Renderable & {
    data?: T
    onSelect?: () => void
  }

/** A group on the current surface; children share the same item payload `T` */
export type GroupNode<T = unknown> = BaseNode<'group'> & {
  heading?: string
  nodes: (ItemNode<T> | SubmenuNode<any>)[]
}

/** Submenu whose children can have a *different* payload shape `TChild` */
export type SubmenuNode<TChild = unknown> = BaseNode<'submenu'> &
  Searchable &
  Renderable & {
    title?: string
    nodes: MenuNode<TChild>[]
  }

/** A menu surface carrying items with payload `T` */
export type MenuData<T = unknown> = {
  id: string
  title?: string
  nodes?: MenuNode<T>[]
}

/** Nodes that can appear on a surface with payload `T` */
export type MenuNode<T = unknown> =
  | ItemNode<T>
  | GroupNode<T>
  | SubmenuNode<any>

/* =========================================================================== */
/* =========================== Renderer & bind APIs ========================== */
/* =========================================================================== */

type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
type ButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>

export type RowBindAPI = {
  /** Whether our internal focus thinks this row is focused (basic for now) */
  focused: boolean
  /** Basic disabled flag (not wired yet in this proto) */
  disabled: boolean
  /**
   * Returns our fully-wired props (role, ids, data-*, and base handlers).
   * Your props are composed *after* ours.
   */
  getRowProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    id: string
    role: 'option'
    tabIndex: -1
    'data-action-menu-item-id': string
    'data-focused'?: 'true' | undefined
    'aria-selected'?: boolean
    'aria-disabled'?: boolean
  }
}

export type ContentBindAPI = {
  /**
   * Returns our menu-surface props (role, ids, data-*, etc.).
   * Your props are composed *after* ours.
   */
  getContentProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    role: 'menu'
    tabIndex: -1
    'data-slot': 'action-menu-content'
    'data-state': 'open' | 'closed'
    'data-action-menu-surface': true
    'data-surface-id': string
  }
}

export type Renderers<T = unknown> = {
  /**
   * Item renderer for nodes with payload `T`.
   * Use `bind.getRowProps()` to opt-in to handling the row element yourself.
   * If you *don't* call it, we'll auto-wrap your JSX with a wired row.
   */
  item: (args: { node: ItemNode<T>; bind: RowBindAPI }) => React.ReactNode
  /**
   * Content renderer for a surface whose items use payload `T`.
   * Use `bind.getContentProps()` to own the surface element; otherwise we auto-wrap.
   */
  content: (args: {
    menu: MenuData<T>
    children: React.ReactNode
    bind: ContentBindAPI
  }) => React.ReactNode
}

/* Default minimal renderers (safe fallbacks) */
function defaultRenderers<T>(): Renderers<T> {
  return {
    item: ({ node }) =>
      node.render ? (
        node.render()
      ) : (
        <span>{node.label ?? String(node.id)}</span>
      ),
    content: ({ children }) => <>{children}</>,
  }
}

/* =========================================================================== */
/* =========================== Utils: props composition ====================== */
/* =========================================================================== */

const HANDLER_KEYS = [
  'onClick',
  'onKeyDown',
  'onKeyUp',
  'onMouseDown',
  'onMouseUp',
  'onMouseEnter',
  'onMouseLeave',
  'onPointerDown',
  'onPointerUp',
  'onFocus',
  'onBlur',
] as const

function mergeProps<
  A extends Record<string, any>,
  B extends Record<string, any>,
>(base: A, overrides?: B): A & B {
  if (!overrides) return base as A & B
  const merged: any = { ...base, ...overrides }
  // merge className
  if (base.className || (overrides as any).className) {
    merged.className = [base.className, (overrides as any).className]
      .filter(Boolean)
      .join(' ')
  }
  // compose known handlers (base first, then override)
  for (const key of HANDLER_KEYS) {
    const a = (base as any)[key]
    const b = (overrides as any)[key]
    if (a || b) merged[key] = composeEventHandlers(a, b)
  }
  // compose ref
  if (base.ref || (overrides as any).ref) {
    merged.ref = composeRefs(base.ref, (overrides as any).ref)
  }
  return merged
}

function isElementWithProp(node: React.ReactNode, propName: string) {
  return React.isValidElement(node) && propName in (node.props as any)
}

/* ================================================================================================
 * Constants, tiny helpers
 * ============================================================================================== */

function isInBounds(x: number, y: number, rect: DOMRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

/* ================================================================================================
 * Root-level context (open state + anchor)
 * ============================================================================================== */

type ActionMenuRootContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  modal: boolean
  anchorRef: React.RefObject<HTMLButtonElement | null>
}

const RootCtx = React.createContext<ActionMenuRootContextValue | null>(null)
const useRootCtx = () => {
  const ctx = React.useContext(RootCtx)
  if (!ctx)
    throw new Error('useActionMenu must be used within an ActionMenu.Root')
  return ctx
}

/* ================================================================================================
 * Submenu context (reserved for later)
 * ============================================================================================== */

type SubContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  triggerRef: React.RefObject<HTMLDivElement | HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  parentSurfaceId: string
  triggerItemId: string | null
  setTriggerItemId: (id: string | null) => void
  parentSetActiveId: (id: string | null) => void
  childSurfaceId: string
  ownerScopeId: string
}
const SubCtx = React.createContext<SubContextValue | null>(null)

/* ================================================================================================
 * Focus context -- which surface owns the real DOM focus
 * ============================================================================================== */

type FocusOwnerCtxValue = {
  ownerId: string | null
  setOwnerId: (id: string | null) => void
}
const FocusOwnerCtx = React.createContext<FocusOwnerCtxValue | null>(null)
const useFocusOwner = () => {
  const ctx = React.useContext(FocusOwnerCtx)
  if (!ctx) throw new Error('FocusOwnerCtx missing')
  return ctx
}

/* ================================================================================================
 * Root
 * ============================================================================================== */

export interface ActionMenuProps extends DivProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

export const Root = React.forwardRef<HTMLDivElement, ActionMenuProps>(
  (
    {
      children,
      open: openProp,
      defaultOpen,
      onOpenChange,
      modal = true,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? false,
      onChange: onOpenChange,
    })
    const anchorRef = React.useRef<HTMLButtonElement | null>(null)
    const [ownerId, setOwnerId] = React.useState<string | null>(null)

    return (
      <RootCtx.Provider
        value={{
          open,
          onOpenChange: setOpen,
          onOpenToggle: () => setOpen((v) => !v),
          anchorRef,
          modal,
        }}
      >
        <FocusOwnerCtx.Provider value={{ ownerId, setOwnerId }}>
          <Popper.Root>
            <Primitive.div ref={ref} {...props}>
              {children}
            </Primitive.div>
          </Popper.Root>
        </FocusOwnerCtx.Provider>
      </RootCtx.Provider>
    )
  },
)
Root.displayName = 'ActionMenu.Root'

/* ================================================================================================
 * Trigger (Popper anchor)
 * ============================================================================================== */

export interface ActionMenuTriggerProps extends ButtonProps {}

export const Trigger = React.forwardRef<
  HTMLButtonElement,
  ActionMenuTriggerProps
>(
  (
    { children, disabled, onPointerDown, onKeyDown, ...props },
    forwardedRef,
  ) => {
    const root = useRootCtx()

    return (
      <Popper.Anchor asChild>
        <Primitive.button
          {...props}
          data-slot="action-menu-trigger"
          ref={composeRefs(forwardedRef, root.anchorRef)}
          disabled={disabled}
          onPointerDown={composeEventHandlers(onPointerDown, (event) => {
            if (!disabled && event.button === 0 && event.ctrlKey === false) {
              const willOpen = !root.open
              root.onOpenToggle()
              if (willOpen) event.preventDefault()
            }
          })}
          onKeyDown={composeEventHandlers(onKeyDown, (event) => {
            if (disabled) return
            if (event.key === 'Enter' || event.key === ' ') root.onOpenToggle()
            if (event.key === 'ArrowDown') root.onOpenChange(true)
            if (['Enter', ' ', 'ArrowDown'].includes(event.key))
              event.preventDefault()
          })}
          aria-haspopup="menu"
          aria-expanded={root.open}
        >
          {children}
        </Primitive.button>
      </Popper.Anchor>
    )
  },
)
Trigger.displayName = 'ActionMenu.Trigger'

/* ================================================================================================
 * Positioner
 * ============================================================================================== */

export interface ActionMenuPositionerProps {
  children: React.ReactElement // typically <ActionMenu.Content/>
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  /** Root-only: keep menu open when clicking the trigger/anchor unless true */
  closeOnAnchorPointerDown?: boolean
}

export const Positioner: React.FC<ActionMenuPositionerProps> = ({
  children,
  side,
  align = 'start',
  sideOffset = 8,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding = 8,
  closeOnAnchorPointerDown = true,
}) => {
  const sub = React.useContext(SubCtx)
  const root = useRootCtx()

  const isSub = !!sub
  const present = isSub ? sub!.open : root.open
  const defaultSide = isSub ? 'right' : 'bottom'
  const resolvedSide = side ?? defaultSide

  const childIsSubContent =
    (children as any)?.type?.displayName === 'ActionMenu.SubContent'

  const close = React.useCallback(() => {
    if (isSub) return
    root.onOpenChange(false)
  }, [isSub, root, sub])

  return (
    <>
      {/* Keep API parity; no submenu content yet in this proto */}
      {isSub && childIsSubContent
        ? React.cloneElement(
            children as React.ReactElement,
            {
              indexOnly: true,
            } as any,
          )
        : null}
      <Presence present={present}>
        <Popper.Content
          side={resolvedSide}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          asChild
        >
          <DismissableLayer
            onEscapeKeyDown={close}
            onDismiss={closeOnAnchorPointerDown ? close : undefined}
            disableOutsidePointerEvents={isSub ? undefined : root.modal}
            onInteractOutside={
              isSub
                ? undefined
                : (event) => {
                    const target = event.target as Node | null
                    const anchor = root.anchorRef.current
                    if (
                      !closeOnAnchorPointerDown &&
                      anchor &&
                      target &&
                      anchor.contains(target)
                    ) {
                      event.preventDefault()
                    }
                  }
            }
            asChild
          >
            {children}
          </DismissableLayer>
        </Popper.Content>
      </Presence>
    </>
  )
}
Positioner.displayName = 'ActionMenu.Positioner'

/* ================================================================================================
 * Content (generic) — minimal prototype + bind/content auto-wrap
 * ============================================================================================== */

export interface ActionMenuContentProps<T = unknown>
  extends Omit<DivProps, 'dir' | 'children'> {
  /** Surface items’ data shape for this menu */
  menu: MenuData<T>
  /**
   * Per-instance renderers (merged over sensible defaults). If you omit both
   * this and `createActionMenu({ renderers })`, we use defaults.
   */
  renderers?: Partial<Renderers<T>>
  /** Keep the prop for parity; unused in this proto */
  vimBindings?: boolean
}

/** Internal generic base so `createActionMenu<T>()` can close over `T` */
const ContentBase = React.forwardRef(function ContentBaseInner<T>(
  {
    menu,
    renderers: rOverrides,
    vimBindings = true,
    ...props
  }: ActionMenuContentProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const root = useRootCtx()
  const surfaceId = React.useId()
  const { ownerId, setOwnerId } = useFocusOwner()
  const isOwner = ownerId === surfaceId
  const surfaceRef = React.useRef<HTMLDivElement | null>(null)
  const composedRef = composeRefs(ref, surfaceRef)

  const renderers = React.useMemo<Renderers<T>>(
    () => ({ ...defaultRenderers<T>(), ...(rOverrides as any) }),
    [rOverrides],
  )

  React.useEffect(() => {
    if (!root.open) {
      setOwnerId(null)
      return
    }
    if (root.open && ownerId === null) {
      setOwnerId(surfaceId)
    }
  }, [root.open, ownerId, surfaceId, setOwnerId])

  React.useEffect(() => {
    if (!root.open || !isOwner) return
    const id = requestAnimationFrame(() => {
      // focus management can live here in later iterations
    })
    return () => cancelAnimationFrame(id)
  }, [root.open, isOwner])

  // Base content props we’ll either apply directly (if user calls bind)
  // or use to auto-wrap the renderer result.
  const baseContentProps = React.useMemo(
    () =>
      ({
        ref: composedRef,
        role: 'menu',
        tabIndex: -1,
        'data-slot': 'action-menu-content',
        'data-state': root.open ? 'open' : 'closed',
        'data-action-menu-surface': true as const,
        'data-surface-id': surfaceId,
        onMouseMove: (e: React.MouseEvent) => {
          const rect = surfaceRef.current?.getBoundingClientRect()
          if (!rect || !isInBounds(e.clientX, e.clientY, rect)) return
          setOwnerId(surfaceId)
        },
        ...props,
      }) as const,
    [composedRef, root.open, surfaceId, setOwnerId, props],
  )

  const bind: ContentBindAPI = {
    getContentProps: (overrides) =>
      mergeProps(baseContentProps as any, overrides),
  }

  const children = renderMenu<T>(menu, renderers)

  const body = renderers.content({ menu, children, bind })

  // If they didn’t use bind.getContentProps(), auto-wrap with our container
  if (!isElementWithProp(body, 'data-action-menu-surface')) {
    return <Primitive.div {...(baseContentProps as any)}>{body}</Primitive.div>
  }
  return body as React.ReactElement
}) as <T>(
  p: ActionMenuContentProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof Primitive.div>

/* Public export: generic-friendly but usable directly (any) */
export const Content = React.forwardRef<
  HTMLDivElement,
  ActionMenuContentProps<any>
>((p, ref) => <ContentBase {...p} ref={ref} />)
Content.displayName = 'ActionMenu.Content'

/* =========================================================================== */
/* =============================== Rendering ================================= */
/* =========================================================================== */

function renderMenu<T>(menu: MenuData<T>, renderers: Renderers<T>) {
  return (menu.nodes ?? []).map((node) => {
    if (node.hidden) return null
    if (node.kind === 'item')
      return <ItemRow key={node.id} node={node} renderer={renderers.item} />
    if (node.kind === 'group') {
      return (
        <div key={node.id} role="group" data-action-menu-group>
          {node.heading ? (
            <div data-action-menu-group-heading role="presentation">
              {node.heading}
            </div>
          ) : null}
          {node.nodes.map((child) => {
            if (child.hidden) return null
            return child.kind === 'item' ? (
              <ItemRow
                key={child.id}
                node={child as ItemNode<T>}
                renderer={renderers.item}
              />
            ) : (
              // Submenu visuals are out-of-scope for this proto; show fallback if provided
              (child.render?.() ?? null)
            )
          })}
        </div>
      )
    }
    // Submenu at root level — fallback only in this proto
    return node.render?.() ?? null
  })
}

function ItemRow<T>({
  node,
  renderer,
}: {
  node: ItemNode<T>
  renderer: Renderers<T>['item']
}) {
  // Base row behavior/attributes we always want
  const baseRowProps = React.useMemo(
    () =>
      ({
        id: node.id,
        ref: React.createRef<HTMLElement>(),
        role: 'option' as const,
        tabIndex: -1,
        'data-action-menu-item-id': node.id,
        'data-focused': undefined,
        'aria-selected': undefined,
        'aria-disabled': false,
        onPointerDown: (e: React.PointerEvent) => {
          // keep click semantics predictable
          if (e.button === 0 && e.ctrlKey === false) e.preventDefault()
        },
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          node.onSelect?.()
        },
      }) as const,
    [node.id, node.onSelect],
  )

  const bind: RowBindAPI = {
    focused: false,
    disabled: false,
    getRowProps: (overrides) =>
      mergeProps(baseRowProps as any, overrides as any),
  }

  const visual = renderer({ node, bind })

  // If they *did* call bind.getRowProps(), their returned element will carry
  // data-action-menu-item-id. Otherwise, we auto-wrap with our wired <div>.
  if (isElementWithProp(visual, 'data-action-menu-item-id')) {
    return visual as React.ReactElement
  }

  const fallbackVisual =
    visual ??
    (node.render ? node.render() : <span>{node.label ?? String(node.id)}</span>)

  return <div {...(baseRowProps as any)}>{fallbackVisual}</div>
}

/* =========================================================================== */
/* ============================ createActionMenu<T> =========================== */
/* =========================================================================== */

/**
 * Factory that returns a *typed* ActionMenu for items with payload `T`.
 * You can also provide per-instance default renderers here.
 */
export function createActionMenu<T>(opts?: {
  renderers?: Partial<Renderers<T>>
}) {
  const defaults = {
    ...defaultRenderers<T>(),
    ...(opts?.renderers as any),
  } as Renderers<T>

  const ContentTyped = React.forwardRef<
    HTMLDivElement,
    ActionMenuContentProps<T>
  >(({ renderers, ...rest }, ref) => {
    const merged = React.useMemo<Renderers<T>>(
      () => ({ ...defaults, ...(renderers as any) }),
      [renderers],
    )
    return <ContentBase<T> {...(rest as any)} renderers={merged} ref={ref} />
  })
  ContentTyped.displayName = 'ActionMenu.Content'

  return {
    Root,
    Trigger,
    Positioner,
    Content: ContentTyped,
  }
}
