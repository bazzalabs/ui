import type { ReactNode } from 'react'

export type SidebarAudience = 'public' | 'private' | 'preview'

export type SidebarBasicItem = {
  title: string
  url: string
}

export type MenuItem =
  | {
      type: 'link'
      title: ReactNode
      url: string
    }
  | {
      type: 'collapsible'
      title: ReactNode
      items: MenuItem[]
    }

type ComponentItemBase = {
  title: ReactNode
  badge?: ReactNode
  audience?: SidebarAudience
}

export type ComponentItem =
  | (ComponentItemBase & {
      type: 'single'
      url: string
    })
  | (ComponentItemBase & {
      type: 'collapsible'
      urlPrefix: string
      groups: Array<{
        groupName: string
        items: MenuItem[]
      }>
    })
