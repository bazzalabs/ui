import { useScopedTheme } from '../../contexts/theme-context.js'
import type { ContentBindAPI } from '../../types.js'

export interface PopupProps {
  bind: ContentBindAPI
  children: React.ReactNode
}

/**
 * Popup component - The visual wrapper.
 * Renders the Content slot and applies styling.
 */
export function Popup({ bind, children }: PopupProps) {
  const { slots } = useScopedTheme()
  const Content = slots.Content

  return <Content bind={bind}>{children}</Content>
}
