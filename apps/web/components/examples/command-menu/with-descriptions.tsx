'use client'

import {
  BellIcon,
  CalendarIcon,
  FileIcon,
  HomeIcon,
  MailIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/command-menu'

export function CommandMenu_WithDescriptions() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open Command Menu
      </Button>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        placeholder="Search commands..."
        classNames={{
          item: 'h-14',
        }}
        menu={{
          id: 'root',
          defaults: {
            item: {
              onSelect: ({ node }) => {
                toast(`Navigated to: ${node.label}`)
                setOpen(false)
              },
            },
          },
          nodes: [
            {
              kind: 'group',
              id: 'navigation',
              heading: 'Navigation',
              nodes: [
                {
                  kind: 'item',
                  id: 'home',
                  label: 'Home',
                  description: 'Go to the home page',
                  icon: <HomeIcon className="size-4" />,
                  keywords: ['home', 'dashboard', 'index'],
                },
                {
                  kind: 'item',
                  id: 'profile',
                  label: 'Profile',
                  description: 'View and edit your profile',
                  icon: <UserIcon className="size-4" />,
                  keywords: ['profile', 'account', 'user'],
                },
                {
                  kind: 'item',
                  id: 'settings',
                  label: 'Settings',
                  description: 'Manage your preferences',
                  icon: <SettingsIcon className="size-4" />,
                  keywords: ['settings', 'preferences', 'config'],
                },
              ],
            },
            {
              kind: 'group',
              id: 'productivity',
              heading: 'Productivity',
              nodes: [
                {
                  kind: 'item',
                  id: 'files',
                  label: 'Files',
                  description: 'Browse and manage your files',
                  icon: <FileIcon className="size-4" />,
                  keywords: ['files', 'documents', 'browse'],
                },
                {
                  kind: 'item',
                  id: 'search',
                  label: 'Search',
                  description: 'Search across all your content',
                  icon: <SearchIcon className="size-4" />,
                  keywords: ['search', 'find', 'query'],
                },
                {
                  kind: 'item',
                  id: 'calendar',
                  label: 'Calendar',
                  description: 'View your schedule and events',
                  icon: <CalendarIcon className="size-4" />,
                  keywords: ['calendar', 'events', 'schedule'],
                },
              ],
            },
            {
              kind: 'group',
              id: 'communication',
              heading: 'Communication',
              nodes: [
                {
                  kind: 'item',
                  id: 'messages',
                  label: 'Messages',
                  description: 'Check your direct messages',
                  icon: <MailIcon className="size-4" />,
                  keywords: ['messages', 'mail', 'inbox'],
                },
                {
                  kind: 'item',
                  id: 'notifications',
                  label: 'Notifications',
                  description: 'View all notifications',
                  icon: <BellIcon className="size-4" />,
                  keywords: ['notifications', 'alerts', 'updates'],
                },
              ],
            },
          ],
        }}
      />
    </>
  )
}
