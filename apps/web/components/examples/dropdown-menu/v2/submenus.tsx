'use client'

import { Button } from '@/components/ui/button'
import * as Menu from '@/registry/ui/dropdown-menu/v2'

export function DropdownMenuV2_Submenus() {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary">Actions</Button>} />
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Surface>
            <Menu.Input placeholder="Search actions..." />
            <Menu.List>
              <Menu.Item>New File</Menu.Item>
              <Menu.Item>New Window</Menu.Item>
              <Menu.Separator />

              {/* Share Submenu */}
              <Menu.Submenu>
                <Menu.SubmenuTrigger>Share</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Surface>
                      <Menu.Input placeholder="Search share options..." />
                      <Menu.List>
                        <Menu.Item>Email</Menu.Item>
                        <Menu.Item>Messages</Menu.Item>
                        <Menu.Item>Airdrop</Menu.Item>
                      </Menu.List>
                    </Menu.Surface>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Submenu>

              {/* Export Submenu with nested submenu */}
              <Menu.Submenu>
                <Menu.SubmenuTrigger>Export</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Surface>
                      <Menu.Input placeholder="Search formats..." />
                      <Menu.List>
                        <Menu.Item>PDF</Menu.Item>
                        <Menu.Item>PNG</Menu.Item>
                        <Menu.Item>SVG</Menu.Item>
                        <Menu.Separator />

                        {/* Nested submenu */}
                        <Menu.Submenu>
                          <Menu.SubmenuTrigger>
                            More Formats
                          </Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Surface>
                                <Menu.Input placeholder="Search more formats..." />
                                <Menu.List>
                                  <Menu.Item>JPEG</Menu.Item>
                                  <Menu.Item>WebP</Menu.Item>
                                  <Menu.Item>TIFF</Menu.Item>
                                </Menu.List>
                              </Menu.Surface>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.Submenu>
                      </Menu.List>
                    </Menu.Surface>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Submenu>

              <Menu.Separator />
              <Menu.Item>Settings</Menu.Item>
            </Menu.List>
          </Menu.Surface>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
