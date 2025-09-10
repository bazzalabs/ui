/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: allowed */
/** biome-ignore-all lint/performance/noImgElement: allowed */
'use client'

import { type MenuDef, renderIcon } from '@bazza-ui/action-menu'
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  TableIcon,
  TypeIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { ActionMenu } from '@/registry/action-menu'

const MicrophoneTextIcon = (props: React.ComponentProps<'svg'>) => (
  <svg aria-hidden="true" viewBox="0 0 20 20" {...props}>
    <path d="M18.174 11.39a.626.626 0 0 1 1.028.712 6.58 6.58 0 0 1-4.8 2.815v1.933h3.425l.126.012a.625.625 0 0 1 0 1.225l-.126.013h-8.1a.625.625 0 0 1 0-1.25h3.425v-1.933a6.58 6.58 0 0 1-4.566-2.5l-.232-.315-.061-.112a.626.626 0 0 1 1.008-.695l.082.096.187.255a5.33 5.33 0 0 0 4.208 2.053 5.33 5.33 0 0 0 4.396-2.308"></path>
    <path d="M8.756 14.375a7.9 7.9 0 0 0 1.965 1.2l.13.05H.902a.625.625 0 1 1 0-1.25zm-1.624-3.333a1.88 1.88 0 0 0-.056 1.25H.9a.625.625 0 0 1 0-1.25zm6.645-8.867a2.875 2.875 0 0 1 2.875 2.875v4.1a2.875 2.875 0 1 1-5.75 0v-4.1a2.875 2.875 0 0 1 2.875-2.875m0 1.25c-.897 0-1.624.728-1.625 1.625v4.1a1.625 1.625 0 0 0 3.25 0v-4.1c0-.898-.727-1.625-1.625-1.625M9.652 8.958H.9a.625.625 0 1 1 0-1.25h8.752zm.171-4.583c-.11.372-.17.767-.17 1.175v.075H.9a.625.625 0 1 1 0-1.25z"></path>
  </svg>
)

const AIBlockIcon = (props: React.ComponentProps<'svg'>) => (
  <svg aria-hidden="true" viewBox="0 0 20 20" {...props}>
    <path d="M5.25 3.125A2.125 2.125 0 0 0 3.125 5.25v9.5c0 1.174.951 2.125 2.125 2.125H7.5v-1.25H5.25a.875.875 0 0 1-.875-.875v-9.5c0-.483.392-.875.875-.875h9.5c.483 0 .875.392.875.875V7.5h1.25V5.25a2.125 2.125 0 0 0-2.125-2.125zm9.667 10.362a.827.827 0 1 0 .264-1.632.827.827 0 0 0-.264 1.632"></path>
    <path d="M11.508 12.097a.827.827 0 1 1-1.633-.264.827.827 0 0 1 1.633.264m1.716-1.807a2.935 2.935 0 0 1 5.052.026.625.625 0 1 1-1.08.63 1.685 1.685 0 0 0-2.9-.014L10.65 17.02l2.67.432a.625.625 0 0 1-.2 1.234l-3.58-.58a.625.625 0 0 1-.436-.938zm-.86-1.802a2.94 2.94 0 0 0-3.464.329.625.625 0 0 0 .833.932 1.686 1.686 0 0 1 2.397.153.625.625 0 0 0 .945-.819 3 3 0 0 0-.71-.595"></path>
  </svg>
)

export function ActionMenu_Notion() {
  return (
    <ActionMenu.Root>
      <ActionMenu.Trigger asChild>
        <Button>Open / Menu</Button>
      </ActionMenu.Trigger>
      <ActionMenu.Positioner align="center">
        <ActionMenu.Surface
          defaults={{
            item: {
              closeOnSelect: true,
              onSelect: ({ node }) => {
                toast(`${node.label} selected.`)
              },
            },
          }}
          surfaceClassNames={{
            list: 'data-[mode=dropdown]:min-w-[300px]',
          }}
          slots={{
            Item: ({ node, mode, bind }) => {
              const props = bind.getRowProps({
                className: 'w-full justify-between gap-16',
              })

              const Icon = renderIcon(node.icon, 'size-4 shrink-0')

              const ItemRow = (
                <button {...props}>
                  <div className="flex items-center gap-2 select-none">
                    {Icon}
                    <span>{node.label}</span>
                    {node.data?.tag && (
                      <div className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 font-medium text-xs rounded-sm">
                        {node.data?.tag}
                      </div>
                    )}
                  </div>
                  {node.data?.kbd && (
                    <span className="text-muted-foreground text-xs">
                      {node.data?.kbd}
                    </span>
                  )}
                </button>
              )

              if (mode !== 'dropdown' || node.data?.description === undefined)
                return ItemRow

              return (
                <HoverCard open={bind.focused} openDelay={2000}>
                  <HoverCardTrigger asChild>{ItemRow}</HoverCardTrigger>
                  <HoverCardContent
                    side="right"
                    align="center"
                    className="data-[state=closed]:!animate-none data-[state=open]:!animate-none font-medium text-xs bg-neutral-950 text-neutral-50 p-2 w-[170px] h-fit flex flex-col gap-2"
                  >
                    {node.data?.imageUrl && (
                      <div className="h-fit w-fit rounded-sm overflow-clip">
                        <img src={node.data?.imageUrl} alt={node.label} />
                      </div>
                    )}
                    {node.data?.description}
                  </HoverCardContent>
                </HoverCard>
              )
            },
          }}
          menu={
            {
              id: 'root',
              hideSearchUntilActive: true,
              nodes: [
                {
                  id: 'suggested',
                  kind: 'group',
                  heading: 'Suggested',
                  nodes: [
                    {
                      kind: 'item',
                      id: 'ai-meeting-notes',
                      label: 'AI Meeting Notes',
                      icon: <MicrophoneTextIcon className="size-4.5" />,
                      data: {
                        description: 'Turn meetings into organized notes.',
                        tag: 'Beta',
                      },
                    },
                    {
                      kind: 'item',
                      id: 'ai-block',
                      label: 'AI Block',
                      icon: <AIBlockIcon className="size-4.5" />,
                      data: {
                        description: 'Generate content from any instruction.',
                        tag: 'New',
                      },
                    },
                  ],
                },
                {
                  id: 'basic-blocks',
                  kind: 'group',
                  heading: 'Basic blocks',
                  nodes: [
                    {
                      kind: 'item',
                      id: 'text',
                      label: 'Text',
                      icon: TypeIcon,
                      data: {
                        description: 'Just start writing with plain text.',
                        imageUrl:
                          'https://www.notion.so/images/tooltips/blocks/text/en-US.87e040db.png',
                      },
                    },
                    {
                      kind: 'item',
                      id: 'heading-1',
                      label: 'Heading 1',
                      icon: Heading1Icon,
                      data: {
                        description: 'Big section heading.',
                        imageUrl:
                          'https://www.notion.so/images/tooltips/blocks/header/en-US.2f63ac1a.png',
                        kbd: '#',
                      },
                    },
                    {
                      kind: 'item',
                      id: 'heading-2',
                      label: 'Heading 2',
                      icon: Heading2Icon,
                      data: {
                        description: 'Medium section heading.',
                        imageUrl:
                          'https://notion.so/images/tooltips/blocks/sub-header/en-US.4ad81c48.png',
                        kbd: '##',
                      },
                    },
                    {
                      kind: 'item',
                      id: 'heading-3',
                      label: 'Heading 3',
                      icon: Heading3Icon,
                      data: {
                        description: 'Small section heading.',
                        imageUrl:
                          'https://notion.so/images/tooltips/blocks/subsubheader/en-US.4dec63f8.png',
                        kbd: '###',
                      },
                    },
                    {
                      kind: 'item',
                      id: 'bulleted-list',
                      label: 'Bulleted list',
                      icon: ListIcon,
                      data: {
                        description: 'Create a simple bulleted list.',
                        imageUrl:
                          'https://notion.so/images/tooltips/blocks/bulleted-list/en-US.f5ded41e.png',
                        kbd: '-',
                      },
                    },
                    {
                      kind: 'item',
                      id: 'numbered-list',
                      label: 'Numbered list',
                      icon: ListOrderedIcon,
                      data: {
                        description: 'Create a list with numbering.',
                        imageUrl:
                          'https://notion.so/images/tooltips/blocks/numbered-list/en-US.58fef67f.png',
                        kbd: '1.',
                      },
                    },
                    {
                      kind: 'item',
                      id: 'todo-list',
                      label: 'To-do list',
                      icon: ListTodoIcon,
                      data: {
                        description: 'Track tasks with a to-do list.',
                        imageUrl:
                          'https://notion.so/images/tooltips/blocks/to-do-list/en-US.52a514f9.png',
                        kbd: '[]',
                      },
                    },
                    {
                      kind: 'item',
                      id: 'table',
                      label: 'Table',
                      icon: TableIcon,
                      data: {
                        description: 'Add simple tabular content to your page.',
                        imageUrl:
                          'https://notion.so/images/tooltips/blocks/simple-table/en-US.da4792c9.png',
                      },
                    },
                  ],
                },
              ],
            } satisfies MenuDef
          }
        />
      </ActionMenu.Positioner>
    </ActionMenu.Root>
  )
}
