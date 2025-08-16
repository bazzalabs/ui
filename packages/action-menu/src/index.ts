'use client'

import {
  type ActionMenuContentProps,
  type ActionMenuGroupProps,
  type ActionMenuInputProps,
  type ActionMenuItemProps,
  type ActionMenuListProps,
  type ActionMenuProps,
  type ActionMenuSubContentProps,
  type ActionMenuSubProps,
  type ActionMenuSubTriggerProps,
  type ActionMenuTriggerProps,
  Content,
  Group,
  Input,
  Item,
  List,
  Root,
  Sub,
  SubContent,
  SubTrigger,
  Trigger,
} from './action-menu.js'

export { toRenderFn } from './action-menu.js'

export const ActionMenu = {
  Root,
  Trigger,
  Content,
  Item,
  Input,
  List,
  Group,
  Sub,
  SubContent,
  SubTrigger,
}

export type {
  ActionMenuProps,
  ActionMenuTriggerProps,
  ActionMenuContentProps,
  ActionMenuInputProps,
  ActionMenuListProps,
  ActionMenuGroupProps,
  ActionMenuItemProps,
  ActionMenuSubProps,
  ActionMenuSubTriggerProps,
  ActionMenuSubContentProps,
}
