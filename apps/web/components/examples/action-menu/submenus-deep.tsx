'use client'

import {
  BookOpen,
  Bug,
  FileText,
  FileType,
  FileType2,
  FolderOpen,
  Image,
  Keyboard,
  Languages,
  Lightbulb,
  MenuIcon,
  Moon,
  Palette,
  Presentation,
  Redo,
  Replace,
  Ruler,
  Search,
  Shapes,
  SpellCheck,
  Sun,
  Table,
  Undo,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_SubmenusDeep() {
  return (
    <ActionMenu.Root modal={false}>
      <ActionMenu.Trigger asChild>
        <Button variant="secondary" className="group">
          <MenuIcon className="size-4 shrink-0 group-hover:text-primary group-aria-[expanded=true]:text-primary text-muted-foreground" />
          Menu
        </Button>
      </ActionMenu.Trigger>
      <ActionMenu.Positioner>
        <ActionMenu.Surface
          menu={{
            id: 'root',
            nodes: [
              {
                kind: 'submenu',
                id: 'file',
                label: 'File',
                nodes: [
                  {
                    kind: 'submenu',
                    id: 'new',
                    label: 'New',
                    nodes: [
                      {
                        kind: 'item',
                        id: 'new-doc',
                        label: 'Document',
                        icon: FileText,
                      },
                      {
                        kind: 'item',
                        id: 'new-sheet',
                        label: 'Spreadsheet',
                        icon: Table,
                      },
                      {
                        kind: 'item',
                        id: 'new-slide',
                        label: 'Presentation',
                        icon: Presentation,
                      },
                    ],
                  },
                  {
                    kind: 'submenu',
                    id: 'export',
                    label: 'Export',
                    nodes: [
                      {
                        kind: 'item',
                        id: 'export-pdf',
                        label: 'PDF',
                        icon: FileType,
                      },
                      {
                        kind: 'item',
                        id: 'export-docx',
                        label: 'Word (.docx)',
                        icon: FileType2,
                      },
                      {
                        kind: 'submenu',
                        id: 'export-image',
                        label: 'Image',
                        nodes: [
                          {
                            kind: 'item',
                            id: 'export-png',
                            label: 'PNG',
                            icon: Image,
                          },
                          {
                            kind: 'item',
                            id: 'export-jpg',
                            label: 'JPG',
                            icon: Image,
                          },
                          {
                            kind: 'submenu',
                            id: 'export-vector',
                            label: 'Vector',
                            nodes: [
                              {
                                kind: 'item',
                                id: 'export-svg',
                                label: 'SVG',
                                icon: Shapes,
                              },
                              {
                                kind: 'item',
                                id: 'export-eps',
                                label: 'EPS',
                                icon: Ruler,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  { kind: 'item', id: 'close', label: 'Close', icon: X },
                ],
              },
              {
                kind: 'submenu',
                id: 'edit',
                label: 'Edit',
                nodes: [
                  { kind: 'item', id: 'undo', label: 'Undo', icon: Undo },
                  { kind: 'item', id: 'redo', label: 'Redo', icon: Redo },
                  {
                    kind: 'submenu',
                    id: 'find-replace',
                    label: 'Find & Replace',
                    nodes: [
                      { kind: 'item', id: 'find', label: 'Find', icon: Search },
                      {
                        kind: 'item',
                        id: 'replace',
                        label: 'Replace',
                        icon: Replace,
                      },
                    ],
                  },
                ],
              },
              {
                kind: 'submenu',
                id: 'view',
                label: 'View',
                nodes: [
                  {
                    kind: 'item',
                    id: 'zoom-in',
                    label: 'Zoom In',
                    icon: ZoomIn,
                  },
                  {
                    kind: 'item',
                    id: 'zoom-out',
                    label: 'Zoom Out',
                    icon: ZoomOut,
                  },
                  {
                    kind: 'submenu',
                    id: 'themes',
                    label: 'Themes',
                    nodes: [
                      {
                        kind: 'item',
                        id: 'light-theme',
                        label: 'Light',
                        icon: Sun,
                      },
                      {
                        kind: 'item',
                        id: 'dark-theme',
                        label: 'Dark',
                        icon: Moon,
                      },
                      {
                        kind: 'submenu',
                        id: 'custom-theme',
                        label: 'Custom',
                        nodes: [
                          {
                            kind: 'item',
                            id: 'color-picker',
                            label: 'Pick Colors',
                            icon: Palette,
                          },
                          {
                            kind: 'item',
                            id: 'import-theme',
                            label: 'Import Theme',
                            icon: FolderOpen,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                kind: 'submenu',
                id: 'tools',
                label: 'Tools',
                nodes: [
                  {
                    kind: 'item',
                    id: 'spellcheck',
                    label: 'Spelling & Grammar',
                    icon: SpellCheck,
                  },
                  {
                    kind: 'submenu',
                    id: 'translate',
                    label: 'Translate',
                    nodes: [
                      {
                        kind: 'item',
                        id: 'to-english',
                        label: 'English',
                        icon: Languages,
                      },
                      {
                        kind: 'item',
                        id: 'to-french',
                        label: 'French',
                        icon: Languages,
                      },
                      {
                        kind: 'item',
                        id: 'to-spanish',
                        label: 'Spanish',
                        icon: Languages,
                      },
                    ],
                  },
                ],
              },
              {
                kind: 'submenu',
                id: 'help',
                label: 'Help',
                nodes: [
                  {
                    kind: 'item',
                    id: 'docs',
                    label: 'Documentation',
                    icon: BookOpen,
                  },
                  {
                    kind: 'item',
                    id: 'keyboard-shortcuts',
                    label: 'Keyboard Shortcuts',
                    icon: Keyboard,
                  },
                  {
                    kind: 'submenu',
                    id: 'feedback',
                    label: 'Feedback',
                    nodes: [
                      {
                        kind: 'item',
                        id: 'report-bug',
                        label: 'Report a Bug',
                        icon: Bug,
                      },
                      {
                        kind: 'item',
                        id: 'feature-request',
                        label: 'Request a Feature',
                        icon: Lightbulb,
                      },
                    ],
                  },
                ],
              },
            ],
          }}
        />
      </ActionMenu.Positioner>
    </ActionMenu.Root>
  )
}
