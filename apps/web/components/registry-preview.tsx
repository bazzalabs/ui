/**
 * Registry Preview Components
 *
 * This module exports components for previewing registry items in documentation.
 * Use these in MDX pages to show live component demos with source code.
 *
 * Note: ComponentSource is a server component and should only be imported in
 * server components or RSC contexts. ComponentPreview and ComponentPreviewWithSource
 * are client components that can be used anywhere.
 */

export type { ComponentPreviewProps } from './component-preview'
export { ComponentPreview } from './component-preview'
export type { ComponentPreviewWithSourceProps } from './component-preview-with-source'
export { ComponentPreviewWithSource } from './component-preview-with-source'
export type { ComponentSourceProps } from './component-source'
export { ComponentSource } from './component-source'
