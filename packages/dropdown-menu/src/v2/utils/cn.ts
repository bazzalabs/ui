import { clsx, type ClassValue } from 'clsx'

/**
 * Utility to merge class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
