'use client'

import { createQueryLoader } from '@bazza-ui/react/loaders'
import type {
  GroupDef,
  ItemDef,
  NodeDef,
  SuggestionMenuTextTriggerMatch,
} from '@bazza-ui/react/suggestion-menu'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DiamondSpinner, SuggestionMenu } from '@/registry/ui/suggestion-menu'

type Person = { name: string; username: string }

// Stands in for your user directory. Usernames are GitHub handles, for the avatars.
const directory: Person[] = [
  { name: 'Kian Bazza', username: 'kianbazza' },
  { name: 'Lee Robinson', username: 'leerob' },
  { name: 'Emil Kowalski', username: 'emilkowalski' },
  { name: 'shadcn', username: 'shadcn' },
  { name: 'Guillermo Rauch', username: 'rauchg' },
  { name: 'Theo Browne', username: 't3dotgg' },
  { name: 'Delba de Oliveira', username: 'delbaoliveira' },
  { name: 'Shu Ding', username: 'shuding' },
  { name: 'Jared Palmer', username: 'jaredpalmer' },
  { name: 'Dan Abramov', username: 'gaearon' },
  { name: 'Sebastian Markbåge', username: 'sebmarkbage' },
  { name: 'Andrew Clark', username: 'acdlite' },
  { name: 'Tanner Linsley', username: 'tannerlinsley' },
  { name: 'Dominik Dorfmeister', username: 'TkDodo' },
  { name: 'Colin McDonnell', username: 'colinhacks' },
  { name: 'Sindre Sorhus', username: 'sindresorhus' },
  { name: 'Kent C. Dodds', username: 'kentcdodds' },
  { name: 'Ryan Florence', username: 'ryanflorence' },
  { name: 'Michael Jackson', username: 'mjackson' },
  { name: 'Wes Bos', username: 'wesbos' },
  { name: 'Addy Osmani', username: 'addyosmani' },
  { name: 'Paul Irish', username: 'paulirish' },
  { name: 'Rauno Freiberg', username: 'raunofreiberg' },
  { name: 'Paco Coursey', username: 'pacocoursey' },
  { name: 'Devon Govett', username: 'devongovett' },
  { name: 'Mark Dalgleish', username: 'markdalgleish' },
  { name: 'Evan You', username: 'yyx990803' },
  { name: 'Rich Harris', username: 'Rich-Harris' },
  { name: 'Ryan Carniato', username: 'ryansolid' },
  { name: 'Matt Pocock', username: 'mattpocock' },
  { name: 'Josh W. Comeau', username: 'joshwcomeau' },
  { name: 'Adam Wathan', username: 'adamwathan' },
  { name: 'Jake Archibald', username: 'jakearchibald' },
  { name: 'Cassidy Williams', username: 'cassidoo' },
]

const recent = directory.slice(0, 3)

/** Simulates a people-search endpoint: slow, ranked, and capped. */
async function searchPeople(query: string): Promise<Person[]> {
  await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 400))
  const q = query.trim().toLowerCase()
  if (!q) return directory.slice(0, 6)
  const rank = (person: Person) => {
    const words = [
      ...person.name.toLowerCase().split(' '),
      person.username.toLowerCase(),
    ]
    if (words.some((word) => word.startsWith(q))) return 0
    return `${person.name} ${person.username}`.toLowerCase().includes(q)
      ? 1
      : -1
  }
  return directory
    .map((person) => ({ person, rank: rank(person) }))
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6)
    .map(({ person }) => person)
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

/** Shows while any search for the current query is still in flight. */
function FetchingIndicator() {
  const coordinator = SuggestionMenu.useAsyncMenuCoordinator()
  if (!coordinator?.isAnyFetching) return null
  return <DiamondSpinner aria-hidden className="size-3" />
}

function group(
  id: string,
  label: string,
  nodes: NodeDef[],
  extra?: React.ReactNode,
): GroupDef {
  return {
    kind: 'group',
    id,
    label,
    nodes,
    render: ({ props, children, context }) => (
      <SuggestionMenu.Group {...props}>
        <SuggestionMenu.GroupLabel className="flex items-center gap-1.5">
          {context.label}
          {extra}
        </SuggestionMenu.GroupLabel>
        {children}
      </SuggestionMenu.Group>
    ),
  }
}

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

/**
 * Fills the gap before a search answers when nothing local matches, so the
 * popup is never blank. Once the search settles, `Empty` takes over.
 */
function Searching() {
  const { count } = SuggestionMenu.useDataList()
  const coordinator = SuggestionMenu.useAsyncMenuCoordinator()
  if (count > 0 || !coordinator || coordinator.rootReveal.settled) return null
  return (
    <div className="flex h-8 items-center justify-center text-sm text-muted-foreground">
      <DiamondSpinner role="img" aria-label="Searching" className="size-5" />
    </div>
  )
}

export default function SuggestionMenuAsync() {
  const [menu] = React.useState(() =>
    SuggestionMenu.createHandle<SuggestionMenuTextTriggerMatch>(),
  )
  const triggerRef = SuggestionMenu.useTextTrigger(menu, {
    triggers: [{ char: '@', allowSpaces: true }],
  })

  const personItem = React.useCallback(
    (person: Person): ItemDef => ({
      kind: 'item',
      // The same ID locally and remotely, so a recent person isn't listed twice.
      id: person.username,
      value: person.name,
      keywords: [person.username],
      onSelect: () => {
        const field = menu.host as HTMLTextAreaElement | null
        const match = menu.payload
        if (!field || !match) return
        field.setRangeText(`@${person.username} `, match.from, match.to, 'end')
        field.dispatchEvent(new Event('input', { bubbles: true }))
      },
      render: ({ props }) => (
        <SuggestionMenu.Item {...props}>
          <Avatar className="size-4">
            <AvatarImage
              alt=""
              src={`https://github.com/${person.username}.png`}
            />
            <AvatarFallback className="text-[8px]">
              {initials(person.name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{person.name}</span>
          <span className="truncate text-muted-foreground">
            {person.username}
          </span>
        </SuggestionMenu.Item>
      ),
    }),
    [menu],
  )

  // Local rows show at once and filter as you type.
  const content = React.useMemo(
    () => [group('recent', 'Recent', recent.map(personItem))],
    [personItem],
  )

  // Remote rows are added after them; the previous results stay up while the next query loads.
  const people = React.useMemo(
    () =>
      createQueryLoader({
        useQuery: (query, options) =>
          useQuery({
            queryKey: ['suggestion-menu-async', 'people', query],
            queryFn: async () => {
              const results = await searchPeople(query)
              return [
                group(
                  'people',
                  'People',
                  results.map(personItem),
                  <FetchingIndicator />,
                ),
              ]
            },
            enabled: options?.enabled,
            placeholderData: keepPreviousData,
          }),
        minQueryLength: 0,
        debounce: 150,
      }),
    [personItem],
  )

  return (
    <div className="w-full max-w-md">
      <textarea
        ref={triggerRef}
        rows={4}
        placeholder="Leave a comment… type @ to search people"
        className="[font-feature-settings:'calt'_0] w-full resize-none rounded-lg border bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <SuggestionMenu.Root handle={menu}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup className="w-72">
              <SuggestionMenu.Surface content={content} asyncContent={people}>
                <SuggestionMenu.List maxHeight={360}>
                  <Rows />
                  <Searching />
                  <SuggestionMenu.Empty>
                    No one by that name.
                  </SuggestionMenu.Empty>
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </div>
  )
}
