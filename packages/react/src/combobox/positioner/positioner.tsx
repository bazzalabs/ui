'use client'

import { Popover, type PopoverPositionerProps } from '@base-ui/react/popover'
import * as React from 'react'
import { useComboboxContext } from '../contexts/combobox-context.js'
import {
  type Align,
  type ComboboxLayout,
  ComboboxPositionerContext,
  type ComboboxPositionerContextValue,
  type Side,
} from '../contexts/combobox-positioner-context.js'

// ============================================================================
// Types
// ============================================================================

export interface ComboboxPositionerProps extends PopoverPositionerProps {
  /**
   * Override the layout mode for the popup.
   * If not provided, uses the `layout` from `Combobox.Root`.
   *
   * - `'floating'` - Standard dropdown positioning below/above the input
   * - `'input-embedded'` - Popup wraps around the input (macOS Spotlight-style).
   *   The input appears to be inside the popup at the top.
   *
   * When `'input-embedded'`:
   * - Popup is positioned flush with the input (sideOffset=0)
   * - Alignment is centered on the input
   * - Positioning styles are automatically applied to the Popup child
   * - Use `popupPadding` to control the padding around the input
   * - `data-input-embedded` attribute is added to Input, Positioner, Popup, and List
   */
  layout?: ComboboxLayout

  /**
   * Padding around the popup content when `layout="input-embedded"`.
   * Creates the "encapsulated" look where the input appears inside the popup
   * with padding on all sides.
   *
   * Only applies when `layout="input-embedded"`.
   *
   * @default 8
   */
  popupPadding?: number
}

// ============================================================================
// Helper: Get positioning styles based on actual side
// ============================================================================

function getInputEmbeddedStyles(
  actualSide: Side,
  inputHeight: number,
  inputWidth: number,
  popupPadding: number,
): React.CSSProperties {
  const popupWidth = inputWidth + popupPadding * 2

  if (actualSide === 'top') {
    // Popup is above the input, so extend downward to wrap the input
    // Input will appear at the BOTTOM of the popup
    const popupMarginBottom = -(inputHeight + popupPadding)
    const popupPaddingBottom = inputHeight + popupPadding

    return {
      width: popupWidth,
      marginBottom: popupMarginBottom,
      paddingTop: popupPadding,
      paddingLeft: popupPadding,
      paddingRight: popupPadding,
      paddingBottom: popupPaddingBottom,
    }
  }

  // Default: side === 'bottom'
  // Popup is below the input, so extend upward to wrap the input
  // Input will appear at the TOP of the popup
  const popupMarginTop = -(inputHeight + popupPadding)
  const popupPaddingTop = inputHeight + popupPadding

  return {
    width: popupWidth,
    marginTop: popupMarginTop,
    paddingTop: popupPaddingTop,
    paddingLeft: popupPadding,
    paddingRight: popupPadding,
    paddingBottom: popupPadding,
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Positions the combobox popup against the input.
 * Uses the input element as the anchor for positioning.
 *
 * Supports `alignInputWithPopup` mode where the popup visually wraps around
 * the input, making the input appear to be inside the popup (macOS-style).
 *
 * Renders a `<div>` element.
 */
export const ComboboxPositioner = React.forwardRef<
  HTMLDivElement,
  ComboboxPositioner.Props
>(function ComboboxPositioner(props, forwardedRef) {
  const {
    layout: layoutProp,
    popupPadding = 8,
    side = 'bottom',
    align: alignProp,
    sideOffset = 4,
    anchor: anchorProp,
    className,
    style,
    children,
    ...rest
  } = props

  const comboboxContext = useComboboxContext()

  // Use prop if provided, otherwise fall back to Root's layout
  const layout = layoutProp ?? comboboxContext.layout
  const isInputEmbedded = layout === 'input-embedded'

  // Use the wrapper element as anchor if present, otherwise fall back to input
  // This ensures the popup aligns with the visual container (InputWrapper) when used
  const anchor =
    (anchorProp ?? comboboxContext.inputWrapperRef.current)
      ? comboboxContext.inputWrapperRef
      : comboboxContext.inputRef

  // When input-embedded layout is enabled:
  // - Use zero sideOffset (popup flush with input)
  // - Center align (popup centered on input)
  const effectiveSideOffset = isInputEmbedded ? 0 : sideOffset
  const effectiveAlign = isInputEmbedded ? 'center' : (alignProp ?? 'start')

  const { inputHeight, inputWidth } = comboboxContext
  const popupWidth = inputWidth + popupPadding * 2

  // When input-embedded, set z-index: 0 so the input (with z-index: 1) appears above
  const basePositionerStyles: React.CSSProperties = {
    ...style,
    ...(isInputEmbedded ? { zIndex: 0 } : {}),
  }

  // For input-embedded layout, we need to use a render function to access
  // the actual side after collision detection
  if (isInputEmbedded) {
    return (
      <Popover.Positioner
        ref={forwardedRef}
        side={side}
        align={effectiveAlign}
        sideOffset={effectiveSideOffset}
        anchor={anchor}
        className={className}
        style={basePositionerStyles}
        data-input-embedded=""
        {...rest}
        render={(renderProps, state) => {
          const actualSide = state.side as Side

          // Context value with actual side
          const contextValue: ComboboxPositionerContextValue = {
            layout,
            side: actualSide,
            align: state.align as Align,
            inputHeight: comboboxContext.inputHeight,
          }

          // CSS variables for input dimensions
          const cssVariables: React.CSSProperties = {
            '--combobox-input-height': `${inputHeight}px`,
            '--combobox-input-width': `${inputWidth}px`,
            '--combobox-popup-padding': `${popupPadding}px`,
            '--combobox-popup-width': `${popupWidth}px`,
          } as React.CSSProperties

          // Get positioning styles based on actual side
          const positioningStyles = getInputEmbeddedStyles(
            actualSide,
            inputHeight,
            inputWidth,
            popupPadding,
          )

          // Enhance children with positioning styles
          const enhancedChildren = React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) {
              return child
            }

            return React.cloneElement(child as React.ReactElement<any>, {
              style: {
                ...positioningStyles,
                ...(child.props as any).style,
              },
              'data-side': actualSide,
            })
          })

          return (
            <ComboboxPositionerContext.Provider value={contextValue}>
              <div
                {...renderProps}
                style={{ ...renderProps.style, ...cssVariables }}
                data-side={actualSide}
              >
                {enhancedChildren}
              </div>
            </ComboboxPositionerContext.Provider>
          )
        }}
      />
    )
  }

  // Non-input-embedded: simple rendering
  const contextValue: ComboboxPositionerContextValue = {
    layout,
    side: side as Side,
    align: effectiveAlign as Align,
    inputHeight: comboboxContext.inputHeight,
  }

  // CSS variables for input dimensions
  const cssVariables: React.CSSProperties = {
    '--combobox-input-height': `${inputHeight}px`,
    '--combobox-input-width': `${inputWidth}px`,
  } as React.CSSProperties

  const positionerStyles: React.CSSProperties = {
    ...basePositionerStyles,
    ...cssVariables,
  }

  return (
    <ComboboxPositionerContext.Provider value={contextValue}>
      <Popover.Positioner
        ref={forwardedRef}
        side={side}
        align={effectiveAlign}
        sideOffset={effectiveSideOffset}
        anchor={anchor}
        className={className}
        style={positionerStyles}
        {...rest}
      >
        {children}
      </Popover.Positioner>
    </ComboboxPositionerContext.Provider>
  )
})

export namespace ComboboxPositioner {
  export type Props = ComboboxPositionerProps
  export type State = Popover.Positioner.State
}
