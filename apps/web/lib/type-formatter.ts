import prettier from 'prettier'

/**
 * Format TypeScript type definitions using Prettier
 * Based on Base UI's approach: https://github.com/mui/base-ui/blob/d917db9800eee49cdc84a1e7a301d9e92925b04a/scripts/api-docs-builder/src/formatter.ts
 */
export async function formatType(typeString: string): Promise<string> {
  // Skip formatting for simple types
  if (
    typeString.length < 50 &&
    !typeString.includes('{') &&
    !typeString.includes('(')
  ) {
    return typeString
  }

  try {
    // Wrap the type in a declaration to make it valid TypeScript
    const wrappedType = `type FormattedType = ${typeString}`

    // Format using prettier with TypeScript parser
    const formatted = await prettier.format(wrappedType, {
      parser: 'typescript',
      printWidth: 60, // Narrower for better readability in docs
      semi: false,
      singleQuote: true,
      trailingComma: 'all',
      tabWidth: 2,
    })

    // Extract just the type definition
    // Remove "type FormattedType = " from the beginning
    const typeDeclarationPrefix = 'type FormattedType = '
    let result = formatted

    if (result.startsWith(typeDeclarationPrefix)) {
      result = result.slice(typeDeclarationPrefix.length)
    }

    // Clean up trailing newlines and whitespace
    result = result.trim()

    return result
  } catch (error) {
    // If formatting fails, return original
    console.warn('Failed to format type:', error)
    return typeString
  }
}

/**
 * Synchronous version using prettier standalone for browser
 * This is a fallback that formats basic types
 */
export function formatTypeSync(typeString: string): string {
  // Simple formatting rules for common cases
  let formatted = typeString

  // Add line breaks after union/intersection operators for long types
  if (formatted.length > 60) {
    formatted = formatted
      .replace(/\s*\|\s*/g, ' |\n  ')
      .replace(/\s*&\s*/g, ' &\n  ')
  }

  // Format object types
  if (formatted.includes('{') && formatted.includes('}')) {
    formatted = formatted
      .replace(/\{\s*/g, '{\n  ')
      .replace(/\s*\}/g, '\n}')
      .replace(/;\s*/g, ';\n  ')
  }

  return formatted
}
