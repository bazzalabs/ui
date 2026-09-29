'use client'

import { ScrollArea } from '@base-ui/react/scroll-area'
import { SuggestionMenu as Primitive } from '@bazza-ui/react/suggestion-menu'
import { cva } from 'class-variance-authority'
import * as React from 'react'
import { forwardRef, useCallback, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'

const itemVariants = cva([
  'group/row flex items-center gap-2 text-sm select-none cursor-default',
  'data-[highlighted]:text-accent-foreground',
  'h-8 px-4 w-full overflow-hidden relative z-[1]',
  // Highlight background, inset from the popup edges.
  'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
  'data-[highlighted]:before:bg-accent',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 aria-disabled:opacity-50',
])

const scrollAreaViewportVariants = cva('scroll-py-1 overscroll-none', {
  variants: {
    withScrollFade: {
      true: [
        // Gradient fade at the scroll edges, from Base UI ScrollArea's overflow variables.
        'before:[--scroll-area-overflow-y-start:inherit] after:[--scroll-area-overflow-y-end:inherit]',
        'before:block after:block',
        'before:absolute after:absolute before:left-0 after:left-0 before:top-0 after:bottom-0',
        'before:w-full after:w-full before:z-10 after:z-10',
        'before:pointer-events-none after:pointer-events-none',
        'before:bg-gradient-to-b before:from-popover before:to-transparent',
        'after:bg-gradient-to-t after:from-popover after:to-transparent',
        'before:h-[min(24px,var(--scroll-area-overflow-y-start,0px))] after:h-[min(24px,var(--scroll-area-overflow-y-end,24px))]',
      ],
      false: '',
    },
  },
  defaultVariants: {
    withScrollFade: true,
  },
})

const Root = Primitive.Root

const Portal = Primitive.Portal

const Positioner = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Positioner>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <Primitive.Positioner
    ref={ref}
    sideOffset={sideOffset}
    className={cn('z-50 outline-none', className)}
    {...props}
  />
))
Positioner.displayName = 'SuggestionMenu.Positioner'

const Popup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Popup>
>(({ className, ...props }, ref) => (
  <Primitive.Popup
    ref={ref}
    className={(state) =>
      cn(
        'w-64 rounded-lg border bg-popover text-popover-foreground text-sm',
        'drop-shadow-xl overflow-hidden outline-none',
        'origin-(--transform-origin)',
        'opacity-100 scale-100 transition-[opacity,scale] duration-150 ease-out',
        'motion-reduce:transition-none',
        'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
        'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
        typeof className === 'function' ? className(state) : className,
      )
    }
    {...props}
  />
))
Popup.displayName = 'SuggestionMenu.Popup'

const Surface = Primitive.Surface

export interface ListProps
  extends Omit<React.ComponentProps<typeof Primitive.List>, 'render'> {
  viewportRef?: React.Ref<HTMLDivElement>
  /** Maximum height of the scrollable area; never taller than the room left on screen. */
  maxHeight?: string | number
  /** Whether to fade the list out at its scroll edges. */
  withScrollFade?: boolean
}

const List = forwardRef<HTMLDivElement, ListProps>(
  (
    {
      className,
      viewportRef,
      maxHeight = 320,
      withScrollFade = true,
      children,
      ...props
    },
    ref,
  ) => {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null)
    const mergedViewportRef = useCallback(
      (node: HTMLDivElement | null) => {
        scrollContainerRef.current = node
        if (typeof viewportRef === 'function') viewportRef(node)
        else if (viewportRef) viewportRef.current = node
      },
      [viewportRef],
    )
    const maxHeightValue =
      typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight

    return (
      <ScrollArea.Root>
        <ScrollArea.Viewport
          ref={mergedViewportRef}
          className={scrollAreaViewportVariants({ withScrollFade })}
          style={{
            maxHeight: `min(${maxHeightValue}, var(--available-height, ${maxHeightValue}))`,
          }}
        >
          <Primitive.List
            ref={ref}
            className={(state) =>
              cn(
                // ScrollArea.Content sets `min-width: fit-content`, which lets the
                // widest row push past the popup's width; rows truncate instead.
                'py-1 outline-none !min-w-0',
                typeof className === 'function' ? className(state) : className,
              )
            }
            render={<ScrollArea.Content />}
            scrollContainerRef={scrollContainerRef}
            {...props}
          >
            {children}
          </Primitive.List>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className={cn(
            'z-10 mx-0.5 my-2 flex w-1 touch-none select-none rounded-full bg-border/50',
            'opacity-0 data-[hovering]:opacity-100 data-[scrolling]:opacity-100 hover:w-1.5',
            'transition-[width,opacity] duration-150 ease-out',
          )}
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-muted-foreground/50" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    )
  },
)
List.displayName = 'SuggestionMenu.List'

const Item = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={(state) =>
      cn(
        itemVariants(),
        typeof className === 'function' ? className(state) : className,
      )
    }
    {...props}
  />
))
Item.displayName = 'SuggestionMenu.Item'

const LinkItem = forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<typeof Primitive.LinkItem>
>(({ className, ...props }, ref) => (
  <Primitive.LinkItem
    ref={ref}
    className={(state) =>
      cn(
        itemVariants(),
        typeof className === 'function' ? className(state) : className,
      )
    }
    {...props}
  />
))
LinkItem.displayName = 'SuggestionMenu.LinkItem'

const Group = Primitive.Group

const GroupLabel = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <Primitive.GroupLabel
    ref={ref}
    className={(state) =>
      cn(
        'mt-3 mb-1 px-4 text-xs font-medium text-muted-foreground',
        // A label that opens the list, or follows a separator, needs less room above it.
        'data-[first]:mt-1 [[bazzaui-suggestion-menu-separator]+*>&]:mt-2',
        typeof className === 'function' ? className(state) : className,
      )
    }
    {...props}
  />
))
GroupLabel.displayName = 'SuggestionMenu.GroupLabel'

const Separator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Separator>
>(({ className, ...props }, ref) => (
  <Primitive.Separator
    ref={ref}
    className={(state) =>
      cn(
        'my-1 h-px w-full bg-border',
        typeof className === 'function' ? className(state) : className,
      )
    }
    {...props}
  />
))
Separator.displayName = 'SuggestionMenu.Separator'

const Icon = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.Icon>
>(({ className, ...props }, ref) => (
  <Primitive.Icon
    ref={ref}
    className={(state) =>
      cn(
        'flex size-4 min-h-4 min-w-4 shrink-0 items-center justify-center',
        'text-muted-foreground group-data-[highlighted]/row:text-primary',
        typeof className === 'function' ? className(state) : className,
      )
    }
    {...props}
  />
))
Icon.displayName = 'SuggestionMenu.Icon'

export interface ShortcutProps extends React.ComponentProps<'span'> {
  /** The keys, shown one `<kbd>` each, e.g. `['⌘', '⌥', '1']`. */
  keys: string[]
}

/**
 * An editor shortcut shown at the end of a row, as a hint for next time.
 * It's only a label: the menu doesn't bind the keys, so typing stays with the host.
 */
const Shortcut = forwardRef<HTMLSpanElement, ShortcutProps>(
  ({ className, keys, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'ml-auto flex shrink-0 items-center gap-0.5 pl-4',
        'text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    >
      {keys.map((key, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: keys can repeat and never reorder
        <kbd key={i} className="min-w-3 text-center font-sans">
          {key}
        </kbd>
      ))}
    </span>
  ),
)
Shortcut.displayName = 'SuggestionMenu.Shortcut'

const Empty = forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Primitive.Empty>, 'children'> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <Primitive.Empty
    ref={ref}
    className={(state) =>
      cn(
        'flex h-8 items-center justify-center text-sm text-muted-foreground',
        typeof className === 'function' ? className(state) : className,
      )
    }
    {...props}
  >
    {children ?? 'No results.'}
  </Primitive.Empty>
))
Empty.displayName = 'SuggestionMenu.Empty'

const Loading = forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Primitive.Loading>, 'children'> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <Primitive.Loading
    ref={ref}
    className={(state) =>
      cn(
        'flex h-8 items-center justify-center text-sm text-muted-foreground',
        typeof className === 'function' ? className(state) : className,
      )
    }
    {...props}
  >
    {children ?? (
      <DiamondSpinner role="img" aria-label="Loading" className="size-5" />
    )}
  </Primitive.Loading>
))
Loading.displayName = 'SuggestionMenu.Loading'

export const SuggestionMenu = {
  Root,
  Portal,
  Positioner,
  Popup,
  Surface,
  List,
  Item,
  LinkItem,
  Group,
  GroupLabel,
  Separator,
  Icon,
  Shortcut,
  Empty,
  Loading,
  createHandle: Primitive.createHandle,
  attachTextTrigger: Primitive.attachTextTrigger,
  useTextTrigger: Primitive.useTextTrigger,
  useDataList: Primitive.useDataList,
  useAsyncMenuCoordinator: Primitive.useAsyncMenuCoordinator,
}

// ============================================================================
// Utility Components
// ============================================================================

// Braille-style morphing spinner (loading -> success)
type BrailleMorphMode = 'loading' | 'success'

type BrailleGridCell = {
  row: number
  col: number
}

type BraillePoint = {
  x: number
  y: number
}

const toBrailleCellKey = (cell: BrailleGridCell) => `${cell.row}:${cell.col}`

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

function createDiamondGridCells(
  rows: number,
  cols: number,
  radius: number,
): BrailleGridCell[] {
  const centerRow = Math.floor(rows / 2)
  const centerCol = Math.floor(cols / 2)
  const cells: BrailleGridCell[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol)

      if (distance <= radius) {
        cells.push({ row, col })
      }
    }
  }

  return cells
}

function createDiamondLoadingPath(
  rows: number,
  cols: number,
  radius: number,
): BrailleGridCell[] {
  const centerRow = Math.floor(rows / 2)
  const centerCol = Math.floor(cols / 2)

  const ring = createDiamondGridCells(rows, cols, radius).filter((cell) => {
    const distance =
      Math.abs(cell.row - centerRow) + Math.abs(cell.col - centerCol)

    return distance === radius
  })

  if (ring.length === 0) {
    return []
  }

  const sortedByAngle = [...ring].sort((a, b) => {
    const aAngle = Math.atan2(a.row - centerRow, a.col - centerCol)
    const bAngle = Math.atan2(b.row - centerRow, b.col - centerCol)
    return aAngle - bAngle
  })

  const startIndex = sortedByAngle.findIndex((cell) => {
    return cell.col === centerCol - radius && cell.row === centerRow
  })

  if (startIndex === -1) {
    return sortedByAngle
  }

  return [
    ...sortedByAngle.slice(startIndex),
    ...sortedByAngle.slice(0, startIndex),
  ]
}

function sampleLinePoints(
  from: BraillePoint,
  to: BraillePoint,
  count: number,
  includeStart: boolean,
): BraillePoint[] {
  const safeCount = Math.max(2, count)
  const points: BraillePoint[] = []

  for (let i = 0; i < safeCount; i += 1) {
    if (!includeStart && i === 0) {
      continue
    }

    const t = i / (safeCount - 1)
    points.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    })
  }

  return points
}

export interface BrailleMorphSpinnerProps
  extends React.SVGProps<SVGSVGElement> {
  mode?: BrailleMorphMode
  rows?: number
  cols?: number
  gridRadius?: number
  dotSize?: number
  gap?: number
  loadingDotSize?: number
  successDotSize?: number
  loadingTrailLength?: number
  loadingFrameDurationMs?: number
  successFadeDurationMs?: number
  rotateDurationMs?: number
  successDrawDurationMs?: number
  successDrawStaggerMs?: number
  checkShortArm?: number
  checkLongArm?: number
  checkPivotRow?: number
  checkPivotCol?: number
}

export const BrailleMorphSpinner = ({
  className,
  mode = 'loading',
  rows = 7,
  cols = 7,
  gridRadius,
  dotSize = 7,
  gap = 8,
  loadingDotSize = 9,
  successDotSize = 10,
  loadingTrailLength = 5,
  loadingFrameDurationMs = 80,
  successFadeDurationMs = 180,
  rotateDurationMs = 240,
  successDrawDurationMs = 260,
  successDrawStaggerMs = 70,
  checkShortArm = 3,
  checkLongArm = 4,
  checkPivotRow,
  checkPivotCol,
  ...props
}: BrailleMorphSpinnerProps) => {
  const [loadingFrame, setLoadingFrame] = React.useState(0)
  const [successPhase, setSuccessPhase] = React.useState<
    'idle' | 'fading' | 'drawing'
  >(() => (mode === 'success' ? 'drawing' : 'idle'))
  const previousModeRef = React.useRef<BrailleMorphMode>(mode)

  const safeRows = Math.max(3, rows)
  const safeCols = Math.max(3, cols)
  const resolvedRadius = clamp(
    gridRadius ?? Math.floor(Math.min(safeRows, safeCols) / 2),
    1,
    Math.floor(Math.min(safeRows, safeCols) / 2),
  )

  const centerRow = Math.floor(safeRows / 2)
  const centerCol = Math.floor(safeCols / 2)

  const resolvedPivotRow = clamp(
    checkPivotRow ?? Math.min(safeRows - 1, centerRow + 2),
    0,
    safeRows - 1,
  )
  const resolvedPivotCol = clamp(checkPivotCol ?? centerCol, 0, safeCols - 1)

  const step = dotSize + gap
  const maxDotSize = Math.max(dotSize, loadingDotSize, successDotSize)
  const padding = Math.ceil(maxDotSize / 2) + 1
  const viewWidth = padding * 2 + step * (safeCols - 1)
  const viewHeight = padding * 2 + step * (safeRows - 1)

  const getRectProps = useCallback(
    (size: number, cell: BrailleGridCell) => {
      const centerX = padding + cell.col * step
      const centerY = padding + cell.row * step

      return {
        x: centerX - size / 2,
        y: centerY - size / 2,
        width: size,
        height: size,
      }
    },
    [padding, step],
  )

  const getPointRectProps = useCallback((size: number, point: BraillePoint) => {
    return {
      x: point.x - size / 2,
      y: point.y - size / 2,
      width: size,
      height: size,
    }
  }, [])

  const baseCells = useMemo(() => {
    return createDiamondGridCells(safeRows, safeCols, resolvedRadius)
  }, [safeRows, safeCols, resolvedRadius])

  const loadingPath = useMemo(() => {
    return createDiamondLoadingPath(safeRows, safeCols, resolvedRadius)
  }, [safeRows, safeCols, resolvedRadius])

  const checkPivotPoint = useMemo(() => {
    const xOffset = step * 0.25

    return {
      x: clamp(
        padding + resolvedPivotCol * step - xOffset,
        padding,
        viewWidth - padding,
      ),
      y: padding + resolvedPivotRow * step,
    }
  }, [padding, resolvedPivotCol, resolvedPivotRow, step, viewWidth])

  const successPoints = useMemo(() => {
    const start: BraillePoint = {
      x: clamp(checkPivotPoint.x - step * 1.35, padding, viewWidth - padding),
      y: clamp(checkPivotPoint.y - step * 1.2, padding, viewHeight - padding),
    }
    const end: BraillePoint = {
      x: clamp(checkPivotPoint.x + step * 2.7, padding, viewWidth - padding),
      y: clamp(checkPivotPoint.y - step * 3.6, padding, viewHeight - padding),
    }

    const shortArmPointCount = Math.max(2, checkShortArm)
    const longArmPointCount = Math.max(3, checkLongArm + 1)

    return [
      ...sampleLinePoints(start, checkPivotPoint, shortArmPointCount, true),
      ...sampleLinePoints(checkPivotPoint, end, longArmPointCount, false),
    ]
  }, [
    checkPivotPoint,
    step,
    padding,
    viewWidth,
    viewHeight,
    checkShortArm,
    checkLongArm,
  ])

  const loadingTrailByKey = useMemo(() => {
    const byKey = new Map<string, number>()

    if (loadingPath.length === 0) {
      return byKey
    }

    const pathLength = loadingPath.length
    const trailLength = clamp(loadingTrailLength, 1, pathLength)

    for (let trailIndex = 0; trailIndex < trailLength; trailIndex += 1) {
      const pathIndex =
        (loadingFrame - trailIndex + pathLength * 8) % pathLength
      const cell = loadingPath[pathIndex]
      const opacity = 1 - trailIndex / (trailLength + 1)

      if (!cell) {
        continue
      }

      byKey.set(toBrailleCellKey(cell), opacity)
    }

    return byKey
  }, [loadingPath, loadingFrame, loadingTrailLength])

  React.useEffect(() => {
    if (mode !== 'loading' || loadingPath.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setLoadingFrame((frame) => (frame + 1) % loadingPath.length)
    }, loadingFrameDurationMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [mode, loadingPath, loadingFrameDurationMs])

  React.useEffect(() => {
    if (mode === previousModeRef.current) {
      return
    }

    if (mode === 'success') {
      setSuccessPhase('fading')

      const timeoutId = window.setTimeout(() => {
        setSuccessPhase('drawing')
      }, successFadeDurationMs)

      previousModeRef.current = mode

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    setSuccessPhase('idle')
    previousModeRef.current = mode
  }, [mode, successFadeDurationMs])

  return (
    <svg
      className={cn('fill-current size-6', className)}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <style>
        {`
          @keyframes braille-grid-to-square {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(45deg);
            }
          }

          @keyframes braille-loading-fade-out {
            0% {
              opacity: var(--from-opacity, 1);
            }
            100% {
              opacity: 0;
            }
          }

          @keyframes braille-check-in {
            0% {
              opacity: 0;
              transform: scale(0.4);
            }
            60% {
              opacity: 1;
              transform: scale(1.12);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>

      <g
        key={mode === 'success' ? 'success' : 'loading'}
        style={
          mode === 'success' && successPhase === 'drawing'
            ? {
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: `braille-grid-to-square ${rotateDurationMs}ms cubic-bezier(.2,.8,.3,1) forwards`,
              }
            : undefined
        }
      >
        {baseCells.map((cell) => (
          <rect
            key={`bg-${toBrailleCellKey(cell)}`}
            className="fill-current/20"
            {...getRectProps(dotSize, cell)}
          />
        ))}

        {mode === 'loading' &&
          baseCells.map((cell) => {
            const opacity = loadingTrailByKey.get(toBrailleCellKey(cell))

            if (opacity === undefined) {
              return null
            }

            return (
              <rect
                key={`loading-${toBrailleCellKey(cell)}`}
                {...getRectProps(loadingDotSize, cell)}
                style={{ opacity }}
              />
            )
          })}

        {mode === 'success' &&
          successPhase === 'fading' &&
          baseCells.map((cell) => {
            const opacity = loadingTrailByKey.get(toBrailleCellKey(cell))

            if (opacity === undefined) {
              return null
            }

            return (
              <rect
                key={`fade-${toBrailleCellKey(cell)}`}
                {...getRectProps(loadingDotSize, cell)}
                style={{
                  opacity,
                  ['--from-opacity' as string]: opacity,
                  animation: `braille-loading-fade-out ${successFadeDurationMs}ms ease-out forwards`,
                }}
              />
            )
          })}
      </g>

      {mode === 'success' &&
        successPhase === 'drawing' &&
        successPoints.map((point, index) => (
          <rect
            key={`success-${point.x.toFixed(2)}-${point.y.toFixed(2)}`}
            {...getPointRectProps(successDotSize, point)}
            style={{
              opacity: 0,
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: `braille-check-in ${successDrawDurationMs}ms cubic-bezier(.2,.8,.3,1) forwards`,
              animationDelay: `${rotateDurationMs + index * successDrawStaggerMs}ms`,
            }}
          />
        ))}
    </svg>
  )
}

export const DiamondSpinner = ({
  className,
  ...props
}: Omit<React.SVGProps<SVGSVGElement>, 'mode'>) => {
  return <BrailleMorphSpinner className={className} {...props} mode="loading" />
}
