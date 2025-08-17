'use client'

import {
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

// keep toRenderFn
// NEW: re-export provider + internal impls for the styled layer
export {
  __ItemImpl,
  __SubTriggerImpl,
  ComponentsProvider,
  toRenderFn,
} from './action-menu.js'

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
  // (optional) expose via the namespace as well:
  // ComponentsProvider,
}

export type {
  ActionMenuContentProps,
  ActionMenuGroupProps,
  ActionMenuInputProps,
  ActionMenuItemProps,
  ActionMenuListProps,
  ActionMenuProps,
  ActionMenuSubContentProps,
  ActionMenuSubProps,
  ActionMenuSubTriggerProps,
  ActionMenuTriggerProps,
  // (optional) helpful for typing user renderers
  RenderCtx,
} from './action-menu.js'
