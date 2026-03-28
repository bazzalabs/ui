'use client'

import * as React from 'react'

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toNumberOrDefault(value: unknown, defaultValue: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return defaultValue
  }
  return value
}

export interface PopupMenuSafeTriangleAreaDebugSettings {
  enabled: boolean
  idleColor: string
  successColor: string
  missColor: string
  triangleFillOpacity: number
  overlayOpacity: number
  showStroke: boolean
  strokeWidth: number
  strokeDasharray: string
  showDots: boolean
  dotRadius: number
  freezeOnPointerLeave: boolean
  persistOnSuccess: boolean
  showMissState: boolean
  missFreezeDuration: number
}

export interface PopupMenuSafeTriangleAreaDebugOptions {
  enabled?: boolean
  idleColor?: string
  successColor?: string
  missColor?: string
  triangleFillOpacity?: number
  overlayOpacity?: number
  showStroke?: boolean
  strokeWidth?: number
  strokeDasharray?: string
  showDots?: boolean
  dotRadius?: number
  freezeOnPointerLeave?: boolean
  persistOnSuccess?: boolean
  showMissState?: boolean
  missFreezeDuration?: number
}

export type PopupMenuSafeTriangleAreaDebugConfig =
  | boolean
  | PopupMenuSafeTriangleAreaDebugOptions

export const defaultPopupMenuSafeTriangleAreaDebugSettings: PopupMenuSafeTriangleAreaDebugSettings =
  {
    enabled: false,
    idleColor: '#0088ff',
    successColor: '#00aa66',
    missColor: '#ff3b30',
    triangleFillOpacity: 0.2,
    overlayOpacity: 1,
    showStroke: true,
    strokeWidth: 1.5,
    strokeDasharray: '6 4',
    showDots: true,
    dotRadius: 4,
    freezeOnPointerLeave: true,
    persistOnSuccess: true,
    showMissState: false,
    missFreezeDuration: 220,
  }

export function resolvePopupMenuSafeTriangleAreaDebugConfig(
  config?: PopupMenuSafeTriangleAreaDebugConfig,
  legacyEnabled?: boolean,
): PopupMenuSafeTriangleAreaDebugSettings {
  const defaults = defaultPopupMenuSafeTriangleAreaDebugSettings

  if (typeof config === 'boolean') {
    return {
      ...defaults,
      enabled: config,
    }
  }

  if (!config) {
    return {
      ...defaults,
      enabled: !!legacyEnabled,
    }
  }

  const triangleFillOpacity = clampNumber(
    toNumberOrDefault(config.triangleFillOpacity, defaults.triangleFillOpacity),
    0,
    1,
  )

  const overlayOpacity = clampNumber(
    toNumberOrDefault(config.overlayOpacity, defaults.overlayOpacity),
    0,
    1,
  )

  const strokeWidth = Math.max(
    0,
    toNumberOrDefault(config.strokeWidth, defaults.strokeWidth),
  )

  const dotRadius = Math.max(
    0,
    toNumberOrDefault(config.dotRadius, defaults.dotRadius),
  )

  const missFreezeDuration = Math.max(
    0,
    toNumberOrDefault(config.missFreezeDuration, defaults.missFreezeDuration),
  )

  return {
    ...defaults,
    ...config,
    enabled: config.enabled ?? true,
    idleColor: config.idleColor ?? defaults.idleColor,
    successColor: config.successColor ?? defaults.successColor,
    missColor: config.missColor ?? defaults.missColor,
    triangleFillOpacity,
    overlayOpacity,
    showStroke: config.showStroke ?? defaults.showStroke,
    strokeWidth,
    strokeDasharray: config.strokeDasharray ?? defaults.strokeDasharray,
    showDots: config.showDots ?? defaults.showDots,
    dotRadius,
    freezeOnPointerLeave:
      config.freezeOnPointerLeave ?? defaults.freezeOnPointerLeave,
    persistOnSuccess: config.persistOnSuccess ?? defaults.persistOnSuccess,
    showMissState: config.showMissState ?? defaults.showMissState,
    missFreezeDuration,
  }
}

/**
 * Debug configuration available on popup-menu roots.
 */
export interface PopupMenuDebugOptions {
  /**
   * Shows/configures the safe triangle area used by submenu aim guard.
   * @default false
   */
  showSafeTriangleArea?: PopupMenuSafeTriangleAreaDebugConfig

  /**
   * @deprecated Use `showSafeTriangleArea` instead.
   */
  showSubmenuSafeTriangleArea?: boolean

  /**
   * Enables console logging for aim-guard diagnostics.
   * @default false
   */
  logAimGuardEvents?: boolean
}

export interface PopupMenuDebugContextValue {
  showSafeTriangleArea: PopupMenuSafeTriangleAreaDebugSettings
  logAimGuardEvents: boolean
}

const defaultPopupMenuDebugContextValue: PopupMenuDebugContextValue = {
  showSafeTriangleArea: defaultPopupMenuSafeTriangleAreaDebugSettings,
  logAimGuardEvents: false,
}

export const PopupMenuDebugContext =
  React.createContext<PopupMenuDebugContextValue>(
    defaultPopupMenuDebugContextValue,
  )

export function usePopupMenuDebug(): PopupMenuDebugContextValue {
  return React.useContext(PopupMenuDebugContext)
}
