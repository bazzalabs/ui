'use client'

import { CommandMenu as Primitive } from '@bazza-ui/react/command-menu'
import { Kbd as KbdPrimitive } from '@bazza-ui/react/kbd'
import { cva } from 'class-variance-authority'
import { ChevronLeftIcon } from 'lucide-react'
import type * as React from 'react'
import { forwardRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { LabelWithBreadcrumbs } from '../dropdown-menu'

const menuItemVariants = cva(
  [
    'group group/row flex items-center text-sm select-none cursor-default',
    'data-[highlighted]:text-accent-foreground',
    'h-9 px-3',
    'w-full gap-2',
    'overflow-hidden',
    'relative z-[1]',
    'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
    'data-[highlighted]:before:bg-accent',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        item: '',
        checkbox: '',
        subpageTrigger: 'justify-between',
        subpageBackItem: '',
      },
    },
    defaultVariants: {
      variant: 'item',
    },
  },
)

const inputVariants = cva([
  'h-12 w-full border-0 border-b bg-transparent px-4 text-sm outline-none',
  'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'caret-blue-500',
])

const listVariants = cva([
  'max-h-[min(420px,60vh)] overflow-y-auto p-1 outline-none',
])

const kbdKeyVariants = cva([
  'inline-flex h-5 min-w-5 items-center justify-center',
  'rounded border bg-muted px-1 font-mono text-[10px] font-medium leading-none text-muted-foreground',
])

const Root = Primitive.Root

const Trigger = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Primitive.Trigger>
>(({ className, ...props }, ref) => (
  <Primitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium outline-none',
      'focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
))
Trigger.displayName = 'CommandMenu.Trigger'

const Portal = Primitive.Portal

const Backdrop = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Backdrop>
>(({ className, ...props }, ref) => (
  <Primitive.Backdrop
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40',
      'opacity-100 transition-opacity duration-150 ease-out',
      'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
      className,
    )}
    {...props}
  />
))
Backdrop.displayName = 'CommandMenu.Backdrop'

const Popup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Popup>
>(({ className, ...props }, ref) => (
  <Primitive.Popup
    ref={ref}
    className={(state) =>
      cn(
        'fixed top-[20%] left-1/2 z-50 -translate-x-1/2',
        'w-[min(640px,90vw)] rounded-xl border bg-popover text-popover-foreground shadow-lg',
        'overflow-hidden',
        'opacity-100 scale-100 transition-[opacity,scale] duration-150 ease-out',
        'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
        'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
        typeof className === 'function' ? className(state) : className,
      )
    }
    {...props}
  />
))
Popup.displayName = 'CommandMenu.Popup'

const Header = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Header>
>(({ className, ...props }, ref) => (
  <Primitive.Header
    ref={ref}
    className={cn(
      'flex items-center justify-between border-b px-4 py-2 text-xs font-medium text-muted-foreground',
      className,
    )}
    {...props}
  />
))
Header.displayName = 'CommandMenu.Header'

const Input = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Primitive.Input>
>(({ className, placeholder = 'Search commands...', ...props }, ref) => (
  <Primitive.Input
    ref={ref}
    className={cn(inputVariants(), className)}
    placeholder={placeholder}
    {...props}
  />
))
Input.displayName = 'CommandMenu.Input'

const List = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.List>
>(({ className, ...props }, ref) => (
  <Primitive.List
    ref={ref}
    className={cn(listVariants(), className)}
    {...props}
  />
))
List.displayName = 'CommandMenu.List'

const Item = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn(menuItemVariants({ variant: 'item' }), className)}
    {...props}
  />
))
Item.displayName = 'CommandMenu.Item'

const CheckboxItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.CheckboxItem>
>(({ className, checked, onCheckedChange, children, ...props }, ref) => (
  <Primitive.CheckboxItem
    ref={ref}
    checked={checked}
    onCheckedChange={onCheckedChange}
    className={cn(menuItemVariants({ variant: 'checkbox' }), className)}
    {...props}
  >
    {children}
  </Primitive.CheckboxItem>
))
CheckboxItem.displayName = 'CommandMenu.CheckboxItem'

const CheckboxItemIndicator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.CheckboxItemIndicator>
>(({ className, keepMounted = true, ...props }, ref) => (
  <Primitive.CheckboxItemIndicator
    ref={ref}
    className={cn(
      'flex items-center justify-center shrink-0 relative',
      "after:absolute after:inset-x-0 after:-inset-y-2 after:content-['']",
      className,
    )}
    keepMounted={keepMounted}
    render={(props, state) => (
      <Checkbox
        {...props}
        checked={state.checked}
        onClick={(e) => {
          e.stopPropagation()
          state.toggle()
        }}
      />
    )}
    {...props}
  />
))
CheckboxItemIndicator.displayName = 'CommandMenu.CheckboxItemIndicator'

const Group = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Group>
>(({ className, ...props }, ref) => (
  <Primitive.Group ref={ref} className={cn('py-1', className)} {...props} />
))
Group.displayName = 'CommandMenu.Group'

const GroupLabel = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <Primitive.GroupLabel
    ref={ref}
    className={cn(
      'px-3 py-1.5 text-xs font-medium text-muted-foreground',
      className,
    )}
    {...props}
  />
))
GroupLabel.displayName = 'CommandMenu.GroupLabel'

const Separator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Separator>
>(({ className, ...props }, ref) => (
  <Primitive.Separator
    ref={ref}
    className={cn('my-1 h-px w-full bg-border', className)}
    {...props}
  />
))
Separator.displayName = 'CommandMenu.Separator'

const Empty = forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Primitive.Empty>, 'children'> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <Primitive.Empty
    ref={ref}
    className={cn(
      'flex h-10 items-center justify-center text-sm text-muted-foreground',
      className,
    )}
    {...props}
  >
    {children ?? 'No commands found.'}
  </Primitive.Empty>
))
Empty.displayName = 'CommandMenu.Empty'

const Loading = forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Primitive.Loading>, 'children'> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <Primitive.Loading
    ref={ref}
    className={cn(
      'flex h-10 items-center justify-center text-sm text-muted-foreground',
      className,
    )}
    {...props}
  >
    {children ?? 'Loading...'}
  </Primitive.Loading>
))
Loading.displayName = 'CommandMenu.Loading'

const Shortcut = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.Shortcut>
>(({ className, ...props }, ref) => (
  <Primitive.Shortcut
    ref={ref}
    className={cn(
      'ml-auto flex items-center gap-1 pl-4 text-xs text-muted-foreground',
      className,
    )}
    {...props}
  />
))
Shortcut.displayName = 'CommandMenu.Shortcut'

const Icon = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.Icon>
>(({ className, ...props }, ref) => (
  <Primitive.Icon
    ref={ref}
    className={cn(
      'flex size-4 shrink-0 items-center justify-center text-muted-foreground',
      'group-data-[highlighted]/row:text-primary',
      className,
    )}
    {...props}
  />
))
Icon.displayName = 'CommandMenu.Icon'

const Subpage = Primitive.Subpage

const SubpageTrigger = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.SubpageTrigger>
>(({ className, ...props }, ref) => (
  <Primitive.SubpageTrigger
    ref={ref}
    className={cn(menuItemVariants({ variant: 'subpageTrigger' }), className)}
    {...props}
  />
))
SubpageTrigger.displayName = 'CommandMenu.SubpageTrigger'

const SubpageBack = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Primitive.SubpageBack>
>(({ className, children, ...props }, ref) => (
  <Primitive.SubpageBack
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground',
      'transition-colors duration-100 ease-out hover:bg-accent hover:text-accent-foreground',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children ?? (
      <>
        <ChevronLeftIcon className="size-3.5 shrink-0" />
        Back
      </>
    )}
  </Primitive.SubpageBack>
))
SubpageBack.displayName = 'CommandMenu.SubpageBack'

const SubpageBackItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.SubpageBackItem>
>(({ className, ...props }, ref) => (
  <Primitive.SubpageBackItem
    ref={ref}
    className={cn(menuItemVariants({ variant: 'subpageBackItem' }), className)}
    {...props}
  />
))
SubpageBackItem.displayName = 'CommandMenu.SubpageBackItem'

const Surface = Primitive.Surface

const KbdRoot = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof KbdPrimitive.Root>
>(({ className, ...props }, ref) => (
  <KbdPrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 text-muted-foreground',
      '[&_[data-kbd-key]]:inline-flex [&_[data-kbd-key]]:h-5 [&_[data-kbd-key]]:min-w-5',
      '[&_[data-kbd-key]]:items-center [&_[data-kbd-key]]:justify-center',
      '[&_[data-kbd-key]]:rounded [&_[data-kbd-key]]:border [&_[data-kbd-key]]:bg-muted',
      '[&_[data-kbd-key]]:px-1 [&_[data-kbd-key]]:font-mono [&_[data-kbd-key]]:text-[10px]',
      '[&_[data-kbd-key]]:font-medium [&_[data-kbd-key]]:leading-none [&_[data-kbd-key]]:text-muted-foreground',
      '[&_[data-kbd-separator]]:text-[10px] [&_[data-kbd-separator]]:text-muted-foreground/70',
      className,
    )}
    {...props}
  />
))
KbdRoot.displayName = 'CommandMenu.Kbd.Root'

const KbdKey = forwardRef<
  HTMLElement,
  React.ComponentProps<typeof KbdPrimitive.Key>
>(({ className, ...props }, ref) => (
  <KbdPrimitive.Key
    ref={ref}
    className={cn(kbdKeyVariants(), className)}
    {...props}
  />
))
KbdKey.displayName = 'CommandMenu.Kbd.Key'

const Kbd = Object.assign(KbdRoot, {
  Root: KbdRoot,
  Key: KbdKey,
})

export { LabelWithBreadcrumbs }

export const CommandMenu = {
  Root,
  Trigger,
  Portal,
  Backdrop,
  Popup,
  Header,
  Input,
  List,
  Item,
  CheckboxItem,
  CheckboxItemIndicator,
  Group,
  GroupLabel,
  Empty,
  Loading,
  Separator,
  Shortcut,
  Icon,
  Subpage,
  SubpageTrigger,
  SubpageBack,
  SubpageBackItem,
  Surface,
  Kbd,
}
