import * as React from 'react'
import { renderIcon } from '@bazza-ui/menu'
import type { ContextMenuSlots } from '../types.js'

/**
 * Default slot implementations for context menu.
 * These provide basic, unstyled rendering for all required slots.
 */
export function defaultSlots<T>(): Required<ContextMenuSlots<T>> {
  return {
    Content: ({ children, bind }) => (
      <div {...bind.getContentProps()}>{children}</div>
    ),
    Input: ({ bind }) => <input {...bind.getInputProps()} />,
    List: ({ children, bind }) => <ul {...bind.getListProps()}>{children}</ul>,
    Item: ({ node, bind }) => {
      const props = bind.getRowProps()
      return (
        <li {...props}>
          {node.icon ? <span aria-hidden>{renderIcon(node.icon)}</span> : null}
          <span>{node.label ?? String(node.id)}</span>
        </li>
      )
    },
    SubmenuTrigger: ({ node, bind }) => (
      <li {...bind.getRowProps()}>
        {node.icon ? <span aria-hidden>{renderIcon(node.icon)}</span> : null}
        <span>{node.label ?? String(node.id)}</span>
        <span aria-hidden>▶</span>
      </li>
    ),
    GroupHeading: ({ node, bind }) => (
      <div {...bind.getGroupHeadingProps()}>{node.heading}</div>
    ),
    Separator: () => (
      // biome-ignore lint/a11y/useFocusableInteractive: separator is decorative
      <div role="separator" aria-orientation="horizontal" />
    ),
  }
}
