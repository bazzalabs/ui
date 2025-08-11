'use client'

import { ActionMenu } from '@bazza-ui/action-menu'
import { NavBar } from '@/components/nav-bar'

export default function SSRPage() {
  return (
    <div className="flex flex-col h-full flex-1">
      <div className="border-b border-border border-dashed sticky top-0 bg-site-background backdrop-blur-md z-50">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <NavBar />
        </div>
      </div>
      <div className="border-b border-border border-dashed bg-site-background">
        <div className="px-4 py-2 max-w-screen-2xl w-full mx-auto border-border border-dashed xl:border-x">
          <div className="flex flex-col gap-8 p-8">
            <h1 className="text-4xl font-[538] tracking-[-0.03rem] select-none">
              Client-side filtering{' '}
              <span className="text-muted-foreground">(TanStack Table)</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="border-b border-border border-dashed bg-site-background flex-1">
        <div className="px-4 py-2 max-w-screen-2xl w-full mx-auto border-border border-dashed xl:border-x">
          <div className="flex flex-col gap-8 p-8">
            <ActionMenu.Root
              className='**:data-[role="option"]:border  **:data-[role="option"]:border-transparent **:data-[role="option"]:data-[focused="true"]:border-purple-500'
              intentDelay={5000}
            >
              <ActionMenu.Trigger>Trigger</ActionMenu.Trigger>
              <ActionMenu.Content className="border border-blue-500">
                <ActionMenu.Input className="outline-none outline-0" />
                <ActionMenu.List>
                  <ActionMenu.Group>
                    <ActionMenu.Sub>
                      <ActionMenu.SubTrigger value="x">
                        Item X
                      </ActionMenu.SubTrigger>
                      <ActionMenu.SubContent
                        className="border border-red-500 p-0.5"
                        align="start"
                      >
                        <ActionMenu.Input />
                        <ActionMenu.List>
                          <ActionMenu.Group>
                            <ActionMenu.Item value="x1">
                              Item X.1
                            </ActionMenu.Item>
                            <ActionMenu.Item value="x2">
                              Item X.2
                            </ActionMenu.Item>
                            <ActionMenu.Item value="x3">
                              Item X.3
                            </ActionMenu.Item>
                          </ActionMenu.Group>
                          <ActionMenu.Item value="x4">Item X.4</ActionMenu.Item>
                        </ActionMenu.List>
                      </ActionMenu.SubContent>
                    </ActionMenu.Sub>
                    <ActionMenu.Item value="3">Item 3</ActionMenu.Item>
                  </ActionMenu.Group>
                  <ActionMenu.Sub>
                    <ActionMenu.SubTrigger value="y">
                      Item Y
                    </ActionMenu.SubTrigger>
                    <ActionMenu.SubContent
                      className="border border-red-500 p-0.5"
                      align="start"
                    >
                      <ActionMenu.Input />
                      <ActionMenu.List>
                        <ActionMenu.Group>
                          <ActionMenu.Item value="y1">Item Y.1</ActionMenu.Item>
                          <ActionMenu.Item value="y2">Item Y.2</ActionMenu.Item>
                          <ActionMenu.Item value="y3">Item Y.3</ActionMenu.Item>
                        </ActionMenu.Group>
                        <ActionMenu.Item value="y4">Item Y.4</ActionMenu.Item>
                      </ActionMenu.List>
                    </ActionMenu.SubContent>
                  </ActionMenu.Sub>

                  <ActionMenu.Item value="4">Item 4</ActionMenu.Item>
                </ActionMenu.List>
              </ActionMenu.Content>
            </ActionMenu.Root>
          </div>
        </div>
      </div>
    </div>
  )
}
