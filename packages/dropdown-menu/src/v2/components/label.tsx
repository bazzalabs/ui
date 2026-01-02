import * as React from 'react'
import { useGroupId, useRegisterNode } from '../contexts/collection-context.js'
import { extractTextContent } from '../utils/extract-text.js'

// ============================================================================
// Types
// ============================================================================

export interface LabelProps extends React.ComponentPropsWithoutRef<'div'> {}

// ============================================================================
// Component
// ============================================================================

/**
 * A label for a group of menu items.
 * Not focusable or selectable.
 *
 * @example
 * ```tsx
 * <Menu.Group>
 *   <Menu.Label>Actions</Menu.Label>
 *   <Menu.Item>Copy</Menu.Item>
 *   <Menu.Item>Paste</Menu.Item>
 * </Menu.Group>
 * ```
 */
export const MenuLabel = React.forwardRef<HTMLDivElement, LabelProps>(
  function MenuLabel({ children, ...props }, forwardedRef) {
    const groupId = useGroupId()
    const textValue = extractTextContent(children)
    const id = groupId ? `${groupId}-label` : undefined

    // Register as a label node (not searchable, not navigable)
    useRegisterNode({
      id: id ?? `label-${React.useId()}`,
      kind: 'label',
      textValue,
      disabled: true, // Labels are never navigable
      render: () => children,
    })

    return (
      <div ref={forwardedRef} role="presentation" id={id} {...props}>
        {children}
      </div>
    )
  },
) as MenuLabel

MenuLabel.displayName = 'Menu.Label'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuLabel {
  (props: LabelProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element
  displayName?: string
}

export namespace MenuLabel {
  export type Props = LabelProps
}
