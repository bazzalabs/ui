/** AST helpers shared by the `bazza/*` rules. */

/** Unwraps TypeScript-only wrappers that don't change the runtime value. */
export function unwrap(node) {
  let current = node
  while (
    current &&
    (current.type === 'TSAsExpression' ||
      current.type === 'TSSatisfiesExpression' ||
      current.type === 'TSNonNullExpression' ||
      current.type === 'TSTypeAssertion' ||
      current.type === 'ParenthesizedExpression')
  ) {
    current = current.expression
  }
  return current
}

/** The declaration a top-level statement holds, looking inside `export`. */
export function topLevelDeclaration(statement) {
  return statement.type === 'ExportNamedDeclaration'
    ? statement.declaration
    : statement
}

/**
 * Local names that refer to `name` imported from `source`: `name` itself plus
 * any alias from `import { name as alias } from 'source'`.
 */
export function importedNames(program, source, name) {
  const names = new Set([name])
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') continue
    if (statement.source.value !== source) continue
    for (const specifier of statement.specifiers) {
      const imported = specifier.imported?.name ?? specifier.imported?.value
      if (specifier.type === 'ImportSpecifier' && imported === name) {
        names.add(specifier.local.name)
      }
    }
  }
  return names
}

/** Local names that refer to React's `forwardRef`. */
export const forwardRefNames = (program) =>
  importedNames(program, 'react', 'forwardRef')

/** The import that binds `name` in the module, with its source, if any. */
export function findImport(program, name) {
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') continue
    for (const specifier of statement.specifiers) {
      if (specifier.local.name === name) {
        return { source: statement.source.value, specifier }
      }
    }
  }
  return undefined
}

/** `forwardRef(…)` under any of `names`, or `<anything>.forwardRef(…)`. */
export function isForwardRefCall(node, names = new Set(['forwardRef'])) {
  if (node?.type !== 'CallExpression') return false
  const { callee } = node
  if (callee.type === 'Identifier') return names.has(callee.name)
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.name === 'forwardRef'
  )
}

/**
 * The `forwardRef(…)` call a value is built from, looking through TypeScript
 * wrappers and calls that wrap it (`memo(forwardRef(…))`).
 */
export function findForwardRefCall(node, names) {
  const value = unwrap(node)
  if (value?.type !== 'CallExpression') return undefined
  if (isForwardRefCall(value, names)) return value
  for (const argument of value.arguments) {
    const found = findForwardRefCall(argument, names)
    if (found) return found
  }
  return undefined
}

/** The top-level declaration that binds `name`: a function, class, enum, or variable declarator. */
export function findTopLevelBinding(program, name) {
  for (const statement of program.body) {
    const declaration = topLevelDeclaration(statement)
    if (!declaration) continue
    if (
      (declaration.type === 'FunctionDeclaration' ||
        declaration.type === 'ClassDeclaration' ||
        declaration.type === 'TSEnumDeclaration') &&
      declaration.id?.name === name
    ) {
      return declaration
    }
    if (declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (
          declarator.id.type === 'Identifier' &&
          declarator.id.name === name
        ) {
          return declarator
        }
      }
    }
  }
  return undefined
}

/**
 * Local names the module exports, values and types alike: `export const A`,
 * `export interface B`, `export { c as C }`. Re-exports from another module
 * are left out.
 */
export function exportedLocals(program) {
  const locals = new Set()
  for (const statement of program.body) {
    if (statement.type !== 'ExportNamedDeclaration') continue
    const { declaration } = statement
    if (declaration?.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === 'Identifier') locals.add(declarator.id.name)
      }
    } else if (declaration?.id?.type === 'Identifier') {
      locals.add(declaration.id.name)
    }
    if (statement.source) continue
    for (const specifier of statement.specifiers ?? []) {
      locals.add(specifier.local.name)
    }
  }
  return locals
}
