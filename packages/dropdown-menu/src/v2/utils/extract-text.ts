import * as React from 'react'

/**
 * Recursively extracts text content from React children.
 * Used to automatically derive textValue for search/typeahead.
 */
export function extractTextContent(children: React.ReactNode): string {
  let text = ''

  React.Children.forEach(children, (child) => {
    if (typeof child === 'string') {
      text += child
    } else if (typeof child === 'number') {
      text += String(child)
    } else if (React.isValidElement(child)) {
      const props = child.props as { children?: React.ReactNode }
      if (props.children) {
        text += extractTextContent(props.children)
      }
    }
  })

  return text.trim()
}

/**
 * Converts a text string to a valid ID.
 * Lowercases and replaces spaces/special chars with hyphens.
 */
export function textToId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
