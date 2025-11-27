'use client'

import { queryLoader } from '@bazza-ui/loaders/query'
import Image from 'next/image'
import { toast } from 'sonner'
import { sleep } from '@/app/demos/server/tst-query/_/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

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

const fetchPokemonList = async (): Promise<PokemonListResponse> => {
  await sleep(2000)
  const response = await fetch(
    'https://pokeapi.co/api/v2/pokemon/?limit=2000&offset=0',
  )
  if (!response.ok) {
    throw new Error('Failed to fetch Pokemon')
  }
  return response.json()
}

export function DropdownMenu_PokemonReactQuery() {
  return (
    <DropdownMenu
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
        loader: queryLoader<PokemonListResponse>({
          queryKey: ['pokemon'],
          queryFn: async () => fetchPokemonList(),
          select: (data) => {
            // Map to menu items
            return data.results.map((pokemon) => {
              // Extract Pokemon ID from URL
              const id = pokemon.url.split('/').filter(Boolean).pop() || '0'

              return {
                kind: 'item' as const,
                id: pokemon.name,
                label:
                  pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
                keywords: [pokemon.name],
                icon: () => (
                  <Image
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                    alt={pokemon.name}
                    height={96}
                    width={96}
                  />
                ),
                description: `#${id.padStart(3, '0')}`,
                closeOnSelect: true,
                onSelect: () => {
                  toast(
                    `Selected ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}!`,
                    {
                      icon: (
                        <Image
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                          alt={pokemon.name}
                          height={96}
                          width={96}
                        />
                      ),
                      description: `Pokedex #${id.padStart(3, '0')}`,
                    },
                  )
                },
              }
            })
          },
        }),
      }}
    >
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary">Search Pokemon (React Query)</Button>
      </DropdownMenu.Trigger>
    </DropdownMenu>
  )
}
