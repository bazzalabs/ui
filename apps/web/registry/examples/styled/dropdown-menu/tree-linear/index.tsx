'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { buildMenuContent } from './components'

function TreeListContent() {
  const { nodes, renderNode } = DropdownMenu.useDataList()

  return <>{nodes.map((node) => renderNode(node))}</>
}

export default function TreeLinearExample() {
  const [selectedTeam, setSelectedTeam] = useState('Product & Engineering')
  const content = buildMenuContent(selectedTeam, setSelectedTeam)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Set team…
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={content}
              deepSearch={{ enabled: true, minLength: 1 }}
            >
              <DropdownMenu.Input placeholder="Set team…" />
              <DropdownMenu.List>
                <TreeListContent />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
