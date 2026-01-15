'use client'

// DataInput is just a re-export of PopupMenuInput
// The standard Input component already handles:
// - Search state management via the store
// - Keyboard navigation (Arrow keys, Enter, Escape)
// - ARIA attributes for accessibility

export {
  PopupMenuInput as PopupMenuDataInput,
  type PopupMenuInputProps as PopupMenuDataInputProps,
} from '../components/input/input.js'
