import { FlaskConicalIcon, LockKeyholeIcon } from 'lucide-react'
import type { ComponentItem, MenuItem, SidebarAudience } from './types'

export function isVisibleDocUrl(
  url: string,
  visibleDocUrls: Set<string> | null,
) {
  return visibleDocUrls ? visibleDocUrls.has(url) : true
}

export function isPrivateDocUrl(
  url: string,
  privateDocUrls: Set<string> | null,
) {
  return privateDocUrls ? privateDocUrls.has(url) : false
}

export function getComponentAudience(
  audience: SidebarAudience | undefined,
): SidebarAudience {
  return audience ?? 'public'
}

export function getComponentAudienceClassName(
  audience: SidebarAudience | undefined,
) {
  switch (getComponentAudience(audience)) {
    // case 'private':
    //   return 'text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200'
    // case 'preview':
    //   return 'text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200'
    default:
      return 'text-muted-foreground'
  }
}

export function getComponentAudienceBadge(
  audience: SidebarAudience | undefined,
) {
  switch (getComponentAudience(audience)) {
    case 'private':
      return (
        <LockKeyholeIcon className="size-3.5 text-amber-500 dark:text-amber-300" />
      )
    case 'preview':
      return (
        <FlaskConicalIcon className="size-3 stroke-2 text-purple-500 dark:text-purple-300" />
      )
    default:
      return null
  }
}

export function filterMenuItem(
  item: MenuItem,
  visibleDocUrls: Set<string> | null,
): MenuItem | null {
  if (item.type === 'link') {
    return isVisibleDocUrl(item.url, visibleDocUrls) ? item : null
  }

  const filteredItems = item.items
    .map((child) => filterMenuItem(child, visibleDocUrls))
    .filter((child): child is MenuItem => child !== null)

  if (filteredItems.length === 0) {
    return null
  }

  return {
    ...item,
    items: filteredItems,
  }
}

export function filterComponentItem(
  component: ComponentItem,
  visibleDocUrls: Set<string> | null,
): ComponentItem | null {
  if (component.type === 'single') {
    return isVisibleDocUrl(component.url, visibleDocUrls) ? component : null
  }

  const filteredGroups = component.groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => filterMenuItem(item, visibleDocUrls))
        .filter((item): item is MenuItem => item !== null),
    }))
    .filter((group) => group.items.length > 0)

  if (filteredGroups.length === 0) {
    return null
  }

  return {
    ...component,
    groups: filteredGroups,
  }
}

export function containsActiveUrl(item: MenuItem, pathname: string): boolean {
  if (item.type === 'link') {
    return item.url === pathname
  }

  return item.items.some((child) => containsActiveUrl(child, pathname))
}
