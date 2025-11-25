/**
 * Configuration for type extraction and selective expansion.
 *
 * This config determines which types should be expanded inline in documentation
 * vs. shown as references to other types.
 */

export interface TypeExpansionRule {
  /**
   * Glob-style patterns to match type names (supports * wildcard)
   * Examples: "*Props", "Omit<*>", "React.*"
   */
  patterns?: string[]

  /**
   * Exact type names to match
   * Examples: ["Record", "Partial", "ReactNode"]
   */
  types?: string[]

  /**
   * Package names to match (for imported types)
   * Examples: ["react", "react-dom", "@bazza-ui/menu"]
   */
  packages?: string[]
}

export interface TypeExpansionConfig {
  /**
   * Types that should be expanded inline (show their full definition)
   */
  expand?: TypeExpansionRule

  /**
   * Types that should be kept as references (just show the type name)
   */
  reference?: TypeExpansionRule

  /**
   * Maximum depth for recursive type expansion
   * @default 1
   */
  maxDepth?: number

  /**
   * Fallback behavior when no rule matches
   * @default 'reference'
   */
  defaultBehavior?: 'expand' | 'reference'
}

/**
 * Default configuration for menu package type extraction
 */
export const defaultConfig: TypeExpansionConfig = {
  expand: {
    // Expand utility types inline
    types: [
      'Omit',
      'Pick',
      'Partial',
      'Required',
      'Record',
      'Extract',
      'Exclude',
    ],
    // Expand simple inline types
    patterns: [
      '*Config',
      '*Options',
      '*Settings',
    ],
  },

  reference: {
    // Keep React types as references
    packages: ['react', 'react-dom'],
    types: [
      'ReactNode',
      'ReactElement',
      'JSX.Element',
      'CSSProperties',
      'HTMLElement',
      'HTMLAttributes',
      'MouseEvent',
      'KeyboardEvent',
      'FocusEvent',
    ],
    patterns: [
      'React.*',
      'HTML*Element',
      'HTML*Attributes',
    ],
  },

  maxDepth: 2,
  defaultBehavior: 'reference',
}

/**
 * Check if a type name matches a pattern (supports * wildcard)
 */
export function matchesPattern(typeName: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except *
    .replace(/\*/g, '.*') // Convert * to .*

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(typeName)
}

/**
 * Check if a type should be expanded based on the configuration
 */
export function shouldExpandType(
  typeName: string,
  packageName: string | undefined,
  config: TypeExpansionConfig = defaultConfig,
): boolean {
  const { expand, reference, defaultBehavior = 'reference' } = config

  // Check expand rules first
  if (expand) {
    // Check exact type match
    if (expand.types?.includes(typeName)) return true

    // Check pattern match
    if (expand.patterns?.some((pattern) => matchesPattern(typeName, pattern))) {
      return true
    }

    // Check package match
    if (packageName && expand.packages?.includes(packageName)) return true
  }

  // Check reference rules
  if (reference) {
    // Check exact type match
    if (reference.types?.includes(typeName)) return false

    // Check pattern match
    if (reference.patterns?.some((pattern) => matchesPattern(typeName, pattern))) {
      return false
    }

    // Check package match
    if (packageName && reference.packages?.includes(packageName)) return false
  }

  // Fall back to default behavior
  return defaultBehavior === 'expand'
}
