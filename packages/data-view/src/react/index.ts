'use client'

// @bazza-ui/data-view/react — React bindings
// Re-exports everything from core + adds React-specific hooks.

// Re-export all core exports
export * from '../index.js'

// React-specific exports
export { createTypedDataView, useDataView } from './use-data-view.js'
