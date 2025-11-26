'use client'

import { nativeLoader } from '@bazza-ui/loaders'
import { toast } from 'sonner'
import { sleep } from '@/app/demos/client/tst-static/_/utils'
import { ContextMenu } from '@/registry/components/context-menu'

type Pokemon = {
  name: string
  url: string
}

type PokemonListResponse = {
  count: number
  next: string | null
  previous: string | null
  results: Pokemon[]
}

export function ContextMenu_PokemonNative() {
  return (
    <ContextMenu
      classNames={{
        content: 'data-[mode=dropdown]:w-(--action-menu-trigger-width)',
      }}
      slotProps={{
        positioner: {
          root: {
            align: 'center',
            alignOffset: 0,
          },
        },
      }}
      menu={{
        id: 'root',
        inputPlaceholder: 'Search...',
        search: {
          mode: 'client',
          debounce: 500,
        },
        loader: nativeLoader(async () => {
          await sleep(500)
          // Fetch Pokemon from PokeAPI
          const response = await fetch(
            'https://pokeapi.co/api/v2/pokemon?limit=1000&offset=0',
          )

          if (!response.ok) {
            throw new Error('Failed to fetch Pokemon')
          }

          const filtered = ((await response.json()) as PokemonListResponse)
            .results
          // const data: PokemonListResponse = await response.json()

          // Filter Pokemon by search query
          // const filtered = query
          //   ? data.results.filter((pokemon) =>
          //       pokemon.name.toLowerCase().includes(query.toLowerCase()),
          //     )
          //   : data.results

          // Map to menu items
          return filtered.map((pokemon) => {
            // Extract Pokemon ID from URL
            const id = pokemon.url.split('/').filter(Boolean).pop() || '0'

            return {
              kind: 'item' as const,
              id: pokemon.name,
              label:
                pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
              keywords: [pokemon.name],
              icon: () => (
                // biome-ignore lint/performance/noImgElement: its fine
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                  alt={pokemon.name}
                />
              ),
              description: `#${id.padStart(3, '0')}`,
              closeOnSelect: true,
              onSelect: () => {
                toast(
                  `Selected ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}!`,
                  {
                    description: `Pokedex #${id.padStart(3, '0')}`,
                  },
                )
              },
            }
          })
        }),
      }}
    >
      <div className="h-32 bg-background w-auto aspect-video border rounded-lg border-dashed flex items-center justify-center">
        <span className="text-muted-foreground">Right click here.</span>
      </div>
    </ContextMenu>
  )
}
