import type { SurfaceSlots } from '../types.js'
import { renderIcon } from './react-utils.js'

export function defaultSlots<T>(): Required<SurfaceSlots<T>> {
  return {
    Content: ({ children, bind }) => (
      <div {...bind.getContentProps()}>{children}</div>
    ),
    Header: () => null,
    Input: ({ value, onChange, bind }) => (
      <input
        {...bind.getInputProps({
          value,
          onChange: (e) => onChange(e.target.value),
        })}
      />
    ),
    List: ({ children, bind }) => (
      <div {...bind.getListProps()}>{children}</div>
    ),
    Empty: ({ query }) => (
      <div data-slot="action-menu-empty">
        No results{query ? ` for "${query}"` : ''}.
      </div>
    ),
    Item: ({ node, bind }) => {
      const props = bind.getRowProps()
      const variant = node.variant ?? 'button'
      const isChecked = props['data-checked'] ?? false

      return (
        <li {...props}>
          {variant === 'checkbox' && (
            <span aria-hidden data-indicator="checkbox">
              {isChecked ? '☑' : '☐'}
            </span>
          )}
          {variant === 'radio' && (
            <span aria-hidden data-indicator="radio">
              {isChecked ? '◉' : '○'}
            </span>
          )}
          {node.icon ? <span aria-hidden>{renderIcon(node.icon)}</span> : null}
          <span>{node.label ?? String(node.id)}</span>
        </li>
      )
    },
    SubmenuTrigger: ({ node, bind }) => (
      <li {...bind.getRowProps()}>
        {node.icon ? <span aria-hidden>{renderIcon(node.icon)}</span> : null}
        <span>{node.label ?? node.title ?? String(node.id)}</span>
      </li>
    ),
    Footer: () => null,
  }
}
