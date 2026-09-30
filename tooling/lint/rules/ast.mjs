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
      current.type === 'ParenthesizedExpression' ||
      current.type === 'ChainExpression')
  ) {
    current = current.expression
  }
  return current
}

/** The declaration a top-level statement holds, looking inside `export`. */
export function topLevelDeclaration(statement) {
  return statement.type === 'ExportNamedDeclaration' ||
    statement.type === 'ExportDefaultDeclaration'
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
export const isForwardRefCall = (node, names) =>
  isCallTo(node, 'forwardRef', names)

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

const functionTypes = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

/** Whether `node` is a function of any kind. */
export const isFunction = (node) => functionTypes.has(node?.type)

/** A property's key as a string: `a`, `'a'`, `['a']`. Undefined when it's computed from a value. */
export function keyName(property) {
  if (!property.computed) return property.key.name ?? String(property.key.value)
  return property.key.type === 'Literal'
    ? String(property.key.value)
    : undefined
}

/** The key a member expression reads: `a.b`, `a['b']`. Undefined when it's computed from a value. */
export function memberName(member) {
  if (!member.computed) return member.property.name
  return member.property.type === 'Literal'
    ? String(member.property.value)
    : undefined
}

/**
 * The function `forwardRef` renders with: an inline function, or a function
 * declared at the top level of `program` and passed by name.
 */
export function renderFunctionOf(forwardRefCall, program) {
  const render = unwrap(forwardRefCall.arguments[0])
  if (isFunction(render)) return render
  if (render?.type !== 'Identifier') return undefined
  const binding = findTopLevelBinding(program, render.name)
  if (binding?.type === 'FunctionDeclaration') return binding
  const init = unwrap(binding?.init)
  return isFunction(init) ? init : undefined
}

/**
 * Calls `visit` on every AST node under `root`. Functions nested inside `root`
 * are skipped unless `enterFunctions` is set; `visit` returning `false` skips a
 * node's children.
 */
export function walk(root, visit, { enterFunctions = false } = {}) {
  const stack = [root]
  while (stack.length > 0) {
    const node = stack.pop()
    if (!node || typeof node.type !== 'string') continue
    if (!enterFunctions && node !== root && isFunction(node)) continue
    if (visit(node) === false) continue
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue
      const value = node[key]
      if (Array.isArray(value)) stack.push(...value)
      else if (value && typeof value === 'object') stack.push(value)
    }
  }
}

/** Local names that refer to Base UI's `useRender`. */
export const useRenderNames = (program) =>
  importedNames(program, '@base-ui/react/use-render', 'useRender')

/** A call to `useRender` under any of `names`, or `<anything>.useRender(…)`. */
export const isUseRenderCall = (node, names) =>
  isCallTo(node, 'useRender', names)

/**
 * `name(…)` under any of `localNames`, or `<object>.name(…)`, e.g. both
 * `useContext(Ctx)` and `React.useContext(Ctx)`.
 */
export function isCallTo(node, name, localNames = new Set([name])) {
  if (node?.type !== 'CallExpression') return false
  const { callee } = node
  if (callee.type === 'Identifier') return localNames.has(callee.name)
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.name === name
  )
}

/** Steps out of `(node as T)`, `node!` and parentheses: the outermost wrapper around `node`. */
export function outermostWrapper(node) {
  let current = node
  while (
    current.parent &&
    unwrap(current.parent) !== current.parent &&
    unwrap(current.parent) === unwrap(current)
  ) {
    current = current.parent
  }
  return current
}

/** The variable `identifier` refers to, found through the scope chain. */
export function variableOf(context, identifier) {
  for (
    let scope = context.sourceCode.getScope(identifier);
    scope;
    scope = scope.upper
  ) {
    const variable = scope.set?.get(identifier.name)
    if (variable) return variable
  }
  return undefined
}
