import { fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  type ConformanceTargetProps,
  describeConformance,
} from '../../test/conformance.js'
import { DropdownMenu } from './index.js'

// DropdownMenu re-exports the shared popup-menu parts, so this file covers the
// popup-menu engine's parts as well as DropdownMenu.Trigger.

function OpenMenu(props: {
  children?: React.ReactNode
  surface?: React.ReactNode
  trigger?: ConformanceTargetProps
  surfaceProps?: ConformanceTargetProps
  listProps?: ConformanceTargetProps
  popupChildren?: React.ReactNode
  backdrop?: ConformanceTargetProps
  positioner?: ConformanceTargetProps
  popup?: ConformanceTargetProps
}) {
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger {...props.trigger}>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        {props.backdrop && <DropdownMenu.Backdrop {...props.backdrop} />}
        <DropdownMenu.Positioner {...props.positioner}>
          <DropdownMenu.Popup {...props.popup}>
            <DropdownMenu.Surface {...props.surfaceProps}>
              {props.surface}
              <DropdownMenu.List {...props.listProps}>
                {props.children}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
            {props.popupChildren}
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const item = <DropdownMenu.Item>Item</DropdownMenu.Item>

describeConformance('DropdownMenu', [
  {
    name: 'DropdownMenu.Trigger',
    render: (p) => <OpenMenu trigger={p}>{item}</OpenMenu>,
    state: { open: true },
  },
  {
    name: 'DropdownMenu.Backdrop',
    render: (p) => <OpenMenu backdrop={p}>{item}</OpenMenu>,
    state: { open: true },
  },
  {
    name: 'DropdownMenu.Positioner',
    render: (p) => <OpenMenu positioner={p}>{item}</OpenMenu>,
    objectStyleOnly: true,
    state: { open: true, side: 'bottom' },
  },
  {
    name: 'DropdownMenu.Popup',
    render: (p) => <OpenMenu popup={p}>{item}</OpenMenu>,
    state: { open: true },
  },
  {
    name: 'DropdownMenu.Arrow',
    render: (p) => (
      <OpenMenu popupChildren={<DropdownMenu.Arrow {...p} />}>{item}</OpenMenu>
    ),
    state: { open: true, side: 'bottom' },
  },
  {
    name: 'DropdownMenu.Surface',
    render: (p) => <OpenMenu surfaceProps={p}>{item}</OpenMenu>,
  },
  {
    name: 'DropdownMenu.List',
    render: (p) => <OpenMenu listProps={p}>{item}</OpenMenu>,
  },
  {
    name: 'DropdownMenu.Item',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.Item {...p}>Item</DropdownMenu.Item>
      </OpenMenu>
    ),
    state: { disabled: false, first: true },
  },
  {
    name: 'DropdownMenu.LinkItem',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.LinkItem href="#link" {...p}>
          Link
        </DropdownMenu.LinkItem>
      </OpenMenu>
    ),
    state: { disabled: false, first: true, last: true },
  },
  {
    name: 'DropdownMenu.CheckboxItem',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.CheckboxItem defaultChecked {...p}>
          Check
        </DropdownMenu.CheckboxItem>
      </OpenMenu>
    ),
    state: { checked: true },
  },
  {
    name: 'DropdownMenu.CheckboxItemIndicator',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.CheckboxItem defaultChecked>
          <DropdownMenu.CheckboxItemIndicator {...p} />
          Check
        </DropdownMenu.CheckboxItem>
      </OpenMenu>
    ),
    state: { checked: true },
  },
  {
    name: 'DropdownMenu.CheckboxGroup',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.CheckboxGroup defaultValue={['a']} {...p}>
          <DropdownMenu.CheckboxItem value="a">A</DropdownMenu.CheckboxItem>
        </DropdownMenu.CheckboxGroup>
      </OpenMenu>
    ),
    state: { disabled: false, firstGroup: true },
  },
  {
    name: 'DropdownMenu.RadioGroup',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.RadioGroup defaultValue="a" {...p}>
          <DropdownMenu.RadioItem value="a">A</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
      </OpenMenu>
    ),
    state: { disabled: false, firstGroup: true },
  },
  {
    name: 'DropdownMenu.RadioItem',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.RadioGroup defaultValue="a">
          <DropdownMenu.RadioItem value="a" {...p}>
            A
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
      </OpenMenu>
    ),
    state: { checked: true },
  },
  {
    name: 'DropdownMenu.RadioItemIndicator',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.RadioGroup defaultValue="a">
          <DropdownMenu.RadioItem value="a">
            <DropdownMenu.RadioItemIndicator {...p} />A
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
      </OpenMenu>
    ),
    state: { checked: true },
  },
  {
    name: 'DropdownMenu.Group',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.Group {...p}>{item}</DropdownMenu.Group>
      </OpenMenu>
    ),
    state: { hidden: false },
  },
  {
    name: 'DropdownMenu.GroupLabel',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel {...p}>Label</DropdownMenu.GroupLabel>
          {item}
        </DropdownMenu.Group>
      </OpenMenu>
    ),
    state: { firstGroup: true },
  },
  {
    name: 'DropdownMenu.Separator',
    render: (p) => (
      <OpenMenu>
        {item}
        <DropdownMenu.Separator {...p} />
        <DropdownMenu.Item>Other</DropdownMenu.Item>
      </OpenMenu>
    ),
    state: { first: false, last: false },
  },
  {
    name: 'DropdownMenu.Icon',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.Item>
          <DropdownMenu.Icon {...p} />
          Item
        </DropdownMenu.Item>
      </OpenMenu>
    ),
    state: { open: true },
  },
  {
    name: 'DropdownMenu.Shortcut',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.Item>
          Item
          <DropdownMenu.Shortcut {...p}>⌘K</DropdownMenu.Shortcut>
        </DropdownMenu.Item>
      </OpenMenu>
    ),
    state: { highlighted: true },
  },
  {
    name: 'DropdownMenu.Empty',
    render: (p) => (
      <OpenMenu surface={<DropdownMenu.Input data-testid="search" />}>
        <DropdownMenu.Item value="apple">Apple</DropdownMenu.Item>
        <DropdownMenu.Empty {...p}>Nothing here</DropdownMenu.Empty>
      </OpenMenu>
    ),
    interact: async () => {
      fireEvent.change(await screen.findByTestId('search'), {
        target: { value: 'zzzzz' },
      })
    },
    state: { first: true },
  },
  {
    name: 'DropdownMenu.Loading',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.Loading forceMount {...p}>
          Loading
        </DropdownMenu.Loading>
      </OpenMenu>
    ),
    state: { first: true, last: true },
  },
  {
    name: 'DropdownMenu.Input',
    render: (p) => (
      <OpenMenu surface={<DropdownMenu.Input {...p} />}>{item}</OpenMenu>
    ),
    state: { active: false },
  },
  {
    name: 'DropdownMenu.Header',
    render: (p) => (
      <OpenMenu
        surface={<DropdownMenu.Header {...p}>Header</DropdownMenu.Header>}
      >
        {item}
      </OpenMenu>
    ),
  },
  {
    name: 'DropdownMenu.Footer',
    render: (p) => (
      <OpenMenu
        surface={<DropdownMenu.Footer {...p}>Footer</DropdownMenu.Footer>}
      >
        {item}
      </OpenMenu>
    ),
  },
  {
    name: 'DropdownMenu.FocusZone',
    render: (p) => (
      <OpenMenu
        surface={
          <DropdownMenu.FocusZone {...p}>
            <button type="button">Zone</button>
          </DropdownMenu.FocusZone>
        }
      >
        {item}
      </OpenMenu>
    ),
  },
  {
    name: 'DropdownMenu.ScrollDownArrow',
    render: (p) => (
      <OpenMenu surface={<DropdownMenu.ScrollDownArrow keepMounted {...p} />}>
        {item}
      </OpenMenu>
    ),
    state: { direction: 'down' },
  },
  {
    name: 'DropdownMenu.ScrollUpArrow',
    render: (p) => (
      <OpenMenu surface={<DropdownMenu.ScrollUpArrow keepMounted {...p} />}>
        {item}
      </OpenMenu>
    ),
    state: { direction: 'up' },
  },
  {
    name: 'DropdownMenu.Tree',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.TreeItem value="parent">Parent</DropdownMenu.TreeItem>
        <DropdownMenu.Tree {...p}>
          <DropdownMenu.TreeItem value="child">Child</DropdownMenu.TreeItem>
        </DropdownMenu.Tree>
      </OpenMenu>
    ),
    state: { depth: 1 },
  },
  {
    name: 'DropdownMenu.TreeItem',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.TreeItem value="parent" {...p}>
          Parent
        </DropdownMenu.TreeItem>
      </OpenMenu>
    ),
    state: { disabled: false, first: true },
  },
  {
    name: 'DropdownMenu.TreeConnector',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.TreeItem value="parent">
          <DropdownMenu.TreeConnector {...p} />
          Parent
        </DropdownMenu.TreeItem>
      </OpenMenu>
    ),
    state: { depth: 0 },
  },
  {
    name: 'DropdownMenu.SubmenuTrigger',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.Submenu>
          <DropdownMenu.SubmenuTrigger {...p}>More</DropdownMenu.SubmenuTrigger>
        </DropdownMenu.Submenu>
      </OpenMenu>
    ),
    state: { submenuTrigger: true },
  },
  {
    name: 'DropdownMenu.SubmenuTriggerIndicator',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.Submenu>
          <DropdownMenu.SubmenuTrigger>
            More
            <DropdownMenu.SubmenuTriggerIndicator {...p} />
          </DropdownMenu.SubmenuTrigger>
        </DropdownMenu.Submenu>
      </OpenMenu>
    ),
    state: { popupOpen: false },
  },
  {
    name: 'DropdownMenu.SubpageTrigger',
    render: (p) => (
      <OpenMenu>
        <DropdownMenu.SubpageTrigger targetPageId="page" {...p}>
          Page
        </DropdownMenu.SubpageTrigger>
      </OpenMenu>
    ),
    state: { subpageTrigger: true },
  },
  ...(['SubpageBack', 'SubpageBackItem'] as const).map((part) => ({
    name: `DropdownMenu.${part}`,
    render: (p: ConformanceTargetProps) => (
      <OpenMenu
        popupChildren={
          <DropdownMenu.Subpage pageId="page">
            <DropdownMenu.Surface>
              {part === 'SubpageBack' && (
                <DropdownMenu.SubpageBack {...p}>Back</DropdownMenu.SubpageBack>
              )}
              <DropdownMenu.List>
                {part === 'SubpageBackItem' && (
                  <DropdownMenu.SubpageBackItem {...p}>
                    Back
                  </DropdownMenu.SubpageBackItem>
                )}
                <DropdownMenu.Item>Inner</DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Subpage>
        }
      >
        <DropdownMenu.SubpageTrigger
          data-testid="open-subpage"
          targetPageId="page"
        >
          Page
        </DropdownMenu.SubpageTrigger>
      </OpenMenu>
    ),
    interact: async () => {
      fireEvent.click(await screen.findByTestId('open-subpage'))
    },
    state:
      part === 'SubpageBack'
        ? { canGoBack: true, disabled: false }
        : { subpageBackItem: true, disabled: false },
  })),
])

describe('DropdownMenu.Backdrop', () => {
  it('keeps pointer-events: none with a style function', async () => {
    render(
      <OpenMenu
        backdrop={{
          'data-testid': 'backdrop',
          style: () => ({ color: 'rgb(1, 2, 3)' }),
        }}
      >
        {item}
      </OpenMenu>,
    )

    const backdrop = await screen.findByTestId('backdrop')
    expect(backdrop.style.pointerEvents).toBe('none')
    expect(backdrop.style.color).toBe('rgb(1, 2, 3)')
  })
})
