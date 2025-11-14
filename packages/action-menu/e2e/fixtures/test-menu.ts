import type { MenuDef } from '../../src/types.js'

/**
 * Basic menu definition for testing standard interactions
 */
export const basicMenuDef: MenuDef = {
  id: 'basic-menu',
  defaults: {
    item: {
      closeOnSelect: true,
    },
  },
  nodes: [
    {
      kind: 'item',
      id: 'new',
      label: 'New File',
      keywords: ['create', 'add'],
    },
    {
      kind: 'item',
      id: 'open',
      label: 'Open File',
      keywords: ['load'],
    },
    {
      kind: 'item',
      id: 'save',
      label: 'Save',
      disabled: true, // Tests expect this to be disabled
    },
    {
      kind: 'item',
      id: 'exit',
      label: 'Exit',
    },
  ],
}

/**
 * Menu with checkbox items for testing selection states
 */
export const checkboxMenuDef: MenuDef = {
  id: 'checkbox-menu',
  defaults: {
    item: {
      closeOnSelect: false, // Checkboxes should not close menu
    },
  },
  nodes: [
    {
      kind: 'item',
      variant: 'checkbox',
      id: 'option1',
      label: 'Option 1',
      onCheckedChange: () => {}, // Placeholder for checkbox state changes
    },
    {
      kind: 'item',
      variant: 'checkbox',
      id: 'option2',
      label: 'Option 2',
      onCheckedChange: () => {}, // Placeholder for checkbox state changes
    },
    {
      kind: 'item',
      variant: 'checkbox',
      id: 'option3',
      label: 'Option 3',
      onCheckedChange: () => {}, // Placeholder for checkbox state changes
    },
  ],
}

/**
 * Menu with submenu for testing nested navigation
 */
export const submenuMenuDef: MenuDef = {
  id: 'submenu-menu',
  nodes: [
    {
      kind: 'item',
      id: 'file',
      label: 'File',
    },
    {
      kind: 'submenu',
      id: 'edit',
      label: 'Edit',
      menu: {
        id: 'edit-submenu',
        nodes: [
          {
            kind: 'item',
            id: 'cut',
            label: 'Cut',
          },
          {
            kind: 'item',
            id: 'copy',
            label: 'Copy',
          },
          {
            kind: 'item',
            id: 'paste',
            label: 'Paste',
          },
        ],
      },
    },
    {
      kind: 'submenu',
      id: 'view',
      label: 'View',
      menu: {
        id: 'view-submenu',
        nodes: [
          {
            kind: 'item',
            id: 'zoom-in',
            label: 'Zoom In',
          },
          {
            kind: 'item',
            id: 'zoom-out',
            label: 'Zoom Out',
          },
        ],
      },
    },
  ],
}

/**
 * Menu for testing search functionality
 */
export const searchMenuDef: MenuDef = {
  id: 'search-menu',
  input: {
    defaultValue: '',
  },
  nodes: [
    {
      kind: 'item',
      id: 'apple',
      label: 'Apple',
      keywords: ['fruit', 'red'],
    },
    {
      kind: 'item',
      id: 'banana',
      label: 'Banana',
      keywords: ['fruit', 'yellow'],
    },
    {
      kind: 'item',
      id: 'cherry',
      label: 'Cherry',
      keywords: ['fruit', 'red'],
    },
    {
      kind: 'item',
      id: 'date',
      label: 'Date',
      keywords: ['fruit', 'brown'],
    },
    {
      kind: 'item',
      id: 'elderberry',
      label: 'Elderberry',
      keywords: ['fruit', 'purple'],
    },
  ],
}

/**
 * Menu with hideSearchUntilActive enabled
 */
export const hideSearchMenuDef: MenuDef = {
  id: 'hide-search-menu',
  hideSearchUntilActive: true,
  input: {
    defaultValue: '',
  },
  nodes: [
    {
      kind: 'item',
      id: 'item1',
      label: 'Item 1',
    },
    {
      kind: 'item',
      id: 'item2',
      label: 'Item 2',
    },
    {
      kind: 'item',
      id: 'item3',
      label: 'Item 3',
    },
  ],
}
