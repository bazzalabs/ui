'use client'

import type {
  ListCellProps,
  ListGroupHeaderProps,
  ListRootProps,
  ListRowProps,
} from '@bazza-ui/react/layout/list'
import { List as Primitive } from '@bazza-ui/react/layout/list'
import { cva } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const rootClassName = 'w-full text-sm'

const rowVariants = cva([
  'group/row relative z-[1] cursor-default select-none text-sm outline-none',
  'before:absolute before:inset-y-0 before:inset-x-1 before:z-[-1]',
  'not-data-[selected]:hover:before:bg-muted/60',
  'not-data-[selected]:hover:before:rounded-lg',
  'data-[selected]:before:bg-muted',
  'data-[first-selected]:before:rounded-t-lg',
  'data-[last-selected]:before:rounded-b-lg',
  'data-[keyboard-active]:before:ring-2',
  'data-[keyboard-active]:before:ring-inset',
  'data-[keyboard-active]:before:ring-ring/40',
  'data-[disabled]:opacity-50',
])

const cellVariants = cva(
  'flex h-11 min-w-0 items-center px-3 whitespace-nowrap',
)

const groupHeaderVariants = cva(
  'z-10 flex h-9 items-center gap-2 border-b bg-background px-4 text-xs font-medium text-muted-foreground data-[collapsed]:border-b-0',
)

const Root = React.forwardRef<HTMLDivElement, ListRootProps>(
  ({ className, ...props }, ref) => (
    <Primitive.Root
      ref={ref}
      className={(state) =>
        cn(
          rootClassName,
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  ),
)
Root.displayName = 'List.Root'

const Row = React.forwardRef<HTMLDivElement, ListRowProps>(
  ({ className, ...props }, ref) => (
    <Primitive.Row
      ref={ref}
      className={(state) =>
        cn(
          rowVariants(),
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  ),
)
Row.displayName = 'List.Row'

const Cell = React.forwardRef<HTMLDivElement, ListCellProps>(
  ({ className, ...props }, ref) => (
    <Primitive.Cell
      ref={ref}
      className={(state) =>
        cn(
          cellVariants(),
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  ),
)
Cell.displayName = 'List.Cell'

const GroupHeader = React.forwardRef<HTMLDivElement, ListGroupHeaderProps>(
  ({ className, ...props }, ref) => (
    <Primitive.GroupHeader
      ref={ref}
      className={(state) =>
        cn(
          groupHeaderVariants(),
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  ),
)
GroupHeader.displayName = 'List.GroupHeader'

const { Group, GroupRows, Spacer, useStore } = Primitive

export const List = {
  Root,
  Row,
  Cell,
  Group,
  GroupHeader,
  GroupRows,
  Spacer,
  useStore,
}
