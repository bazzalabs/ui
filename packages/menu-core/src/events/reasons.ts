import * as REASONS from './reason-parts.js'

export { REASONS }

/**
 * Object containing all available event reasons.
 */
export type EventReasons = typeof REASONS

/**
 * Union of all available event reason strings.
 */
export type EventReason = EventReasons[keyof EventReasons]
