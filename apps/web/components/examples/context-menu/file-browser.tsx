'use client'

import type { MenuDef } from '@bazza-ui/context-menu'
import {
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  FolderPlus,
  Share2,
  Star,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ContextMenu } from '@/registry/context-menu'

export function ContextMenu_FileBrowser() {
  return (
    <div className="grid gap-4 grid-cols-3">
      {files.map((file) => (
        <ContextMenu key={file.id} menu={getMenuForFile(file)}>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors">
            <FileText className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium">{file.name}</span>
            <span className="text-xs text-muted-foreground">{file.size}</span>
          </div>
        </ContextMenu>
      ))}
    </div>
  )
}

const files = [
  { id: '1', name: 'Project.pdf', size: '2.4 MB' },
  { id: '2', name: 'Report.docx', size: '1.8 MB' },
  { id: '3', name: 'Photo.jpg', size: '3.2 MB' },
]

function getMenuForFile(file: {
  id: string
  name: string
  size: string
}): MenuDef {
  return {
    id: `file-menu-${file.id}`,
    nodes: [
      {
        kind: 'item',
        label: 'Open',
        icon: <Eye className="size-4" />,
        onSelect: () => toast(`Opening ${file.name}`),
      },
      {
        kind: 'item',
        label: 'Rename',
        icon: <Edit className="size-4" />,
        onSelect: () => toast(`Renaming ${file.name}`),
      },
      { kind: 'separator', id: 'sep-1' },
      {
        kind: 'item',
        label: 'Download',
        icon: <Download className="size-4" />,
        onSelect: () => toast(`Downloading ${file.name}`),
      },
      {
        kind: 'item',
        label: 'Copy',
        icon: <Copy className="size-4" />,
        onSelect: () => toast(`Copied ${file.name}`),
      },
      { kind: 'separator', id: 'sep-2' },
      {
        kind: 'submenu',
        label: 'Share',
        icon: <Share2 className="size-4" />,
        nodes: [
          {
            kind: 'item',
            label: 'Get Link',
            onSelect: () => toast('Link copied to clipboard'),
          },
          {
            kind: 'item',
            label: 'Email',
            onSelect: () => toast('Opening email'),
          },
          {
            kind: 'submenu',
            label: 'Send to',
            nodes: [
              {
                kind: 'item',
                label: 'Slack',
                onSelect: () => toast('Sharing to Slack'),
              },
              {
                kind: 'item',
                label: 'Teams',
                onSelect: () => toast('Sharing to Teams'),
              },
              {
                kind: 'item',
                label: 'Discord',
                onSelect: () => toast('Sharing to Discord'),
              },
            ],
          },
        ],
      },
      {
        kind: 'submenu',
        label: 'Move to',
        icon: <FolderPlus className="size-4" />,
        nodes: [
          {
            kind: 'item',
            label: 'Documents',
            onSelect: () => toast(`Moving ${file.name} to Documents`),
          },
          {
            kind: 'item',
            label: 'Projects',
            onSelect: () => toast(`Moving ${file.name} to Projects`),
          },
          {
            kind: 'item',
            label: 'Archive',
            onSelect: () => toast(`Moving ${file.name} to Archive`),
          },
        ],
      },
      { kind: 'separator', id: 'sep-3' },
      {
        kind: 'item',
        label: 'Add to Favorites',
        icon: <Star className="size-4" />,
        onSelect: () => toast(`Added ${file.name} to favorites`),
      },
      { kind: 'separator', id: 'sep-4' },
      {
        kind: 'item',
        label: 'Delete',
        icon: <Trash2 className="size-4" />,
        onSelect: () => toast(`Deleted ${file.name}`),
      },
    ],
  }
}
