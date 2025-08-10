'use client'

import { ActionMenu } from '@bazza-ui/action-menu'

export default function Page() {
  return (
    <div className="p-16 flex flex-col gap-16">
      <h1 className="text-4xl font-[538] tracking-[-0.03rem] select-none">
        Action Menu
      </h1>
      <ActionMenu.Root>
        <ActionMenu.Trigger>Trigger</ActionMenu.Trigger>
        <ActionMenu.Content>
          <ActionMenu.Input />
          <ActionMenu.List>
            <ActionMenu.Group>
              <ActionMenu.Item value="1">Item 1</ActionMenu.Item>
              <ActionMenu.Item value="2">Item 2</ActionMenu.Item>
              <ActionMenu.Item value="3">Item 3</ActionMenu.Item>
            </ActionMenu.Group>
            <ActionMenu.Item value="4">Item 4</ActionMenu.Item>
          </ActionMenu.List>
        </ActionMenu.Content>
      </ActionMenu.Root>
    </div>
  )
}
