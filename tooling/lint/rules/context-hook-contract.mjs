/**
 * `bazza/context-hook-contract`: a hook named `useX` never returns a missing
 * context.
 *
 * A context created with a `null` (or `undefined`) default is missing when a
 * part renders outside its provider. `useX` promises a value or a clear error:
 * it checks the context and throws, naming the provider the part needs. A hook
 * that hands back `null` instead is named `useMaybeX`, so callers know to check.
 *
 * The rule checks `use*` hooks that read a context created in the same module
 * (a context imported from elsewhere is outside what it can see). A hook
 * proves the context is present in one of two ways:
 * - it reads the context into a variable, then a top-level `if`, before any
 *   `return`, tests exactly that variable for the missing value (`!ctx`,
 *   `ctx == null`, or `=== <the context's default>`) and throws, with nothing
 *   before the `throw` that could skip it;
 * - `useContext(Ctx) ?? fallback`, with a fallback that can't be nullish.
 * Anything else is reported: definitely when the missing value can reach a
 * `return`, as "can't tell" otherwise (fail closed).
 */
import {
  importedNames,
  isCallTo,
  isFunction,
  outermostWrapper,
  topLevelDeclaration,
  unwrap,
  variableOf,
  walk,
} from './ast.mjs'

const section = 'See "Context hooks" in packages/react/AGENTS.md.'

const isNull = (node) => node?.type === 'Literal' && node.value === null
const isUndefined = (node) =>
  (node?.type === 'Identifier' && node.name === 'undefined') ||
  (node?.type === 'UnaryExpression' && node.operator === 'void')

/**
 * Contexts created in the module with a missing default: each declarator,
 * mapped to that default (`'null'` or `'undefined'`).
 */
function nullableContexts(program, createContextNames) {
  const contexts = new Map()
  walk(program, (node) => {
    if (node.type !== 'VariableDeclarator' || node.id.type !== 'Identifier') {
      return
    }
    const init = unwrap(node.init)
    if (!isCallTo(init, 'createContext', createContextNames)) return
    const initial = unwrap(init.arguments[0])
    if (isNull(initial)) contexts.set(node, 'null')
    else if (!initial || isUndefined(initial)) contexts.set(node, 'undefined')
  })
  return contexts
}

/** The `use*` hooks declared at the top level: `function useX` or `const useX = …`. */
function* hooks(program) {
  for (const statement of program.body) {
    const declaration = topLevelDeclaration(statement)
    if (
      declaration?.type === 'FunctionDeclaration' &&
      /^use[A-Z]/.test(declaration.id?.name ?? '')
    ) {
      yield { name: declaration.id.name, fn: declaration }
    }
    if (declaration?.type !== 'VariableDeclaration') continue
    for (const declarator of declaration.declarations) {
      const init = unwrap(declarator.init)
      if (
        declarator.id.type === 'Identifier' &&
        /^use[A-Z]/.test(declarator.id.name) &&
        isFunction(init)
      ) {
        yield { name: declarator.id.name, fn: init }
      }
    }
  }
}

/** Whether anything under `node` matches `predicate` (nested functions skipped). */
function some(node, predicate) {
  if (isFunction(node)) return false
  let found = false
  walk(node, (current) => {
    if (found) return false
    if (predicate(current)) found = true
  })
  return found
}

/**
 * Whether `node` reads the variable `variable`. The `ctx` in `props.ctx` or
 * `{ ctx: 1 }` is a property name, not a read.
 */
function readsVariable(context, node, variable) {
  if (node?.type !== 'Identifier') return false
  const { parent } = node
  if (parent?.type === 'MemberExpression' && parent.property === node) {
    if (!parent.computed) return false
  }
  if (parent?.type === 'Property' && parent.key === node && !parent.computed) {
    if (parent.value !== node) return false
  }
  return variableOf(context, node) === variable
}

/**
 * Whether `test` is true exactly when `variable` holds the missing value:
 * `!v`, `v == null`, `v == undefined`, or `v === <default>` (either side).
 */
function testsMissing(context, test, variable, missing) {
  const value = unwrap(test)
  if (value?.type === 'UnaryExpression' && value.operator === '!') {
    return readsVariable(context, unwrap(value.argument), variable)
  }
  if (value?.type !== 'BinaryExpression') return false
  const [left, right] = [unwrap(value.left), unwrap(value.right)]
  const other = readsVariable(context, left, variable)
    ? right
    : readsVariable(context, right, variable)
      ? left
      : undefined
  if (!other) return false
  if (value.operator === '==') return isNull(other) || isUndefined(other)
  if (value.operator === '===') {
    return missing === 'null' ? isNull(other) : isUndefined(other)
  }
  return false
}

/** Whether `statement` always ends in a `throw`, with nothing before it that branches. */
function alwaysThrows(statement) {
  if (statement?.type === 'ThrowStatement') return true
  if (statement?.type !== 'BlockStatement') return false
  const { body } = statement
  if (body.at(-1)?.type !== 'ThrowStatement') return false
  return body
    .slice(0, -1)
    .every(
      (s) =>
        s.type === 'ExpressionStatement' || s.type === 'VariableDeclaration',
    )
}

/** Whether `node` can't evaluate to `null` or `undefined`. */
function neverNullish(node) {
  const value = unwrap(node)
  if (!value) return false
  if (value.type === 'Literal') return value.value !== null
  return [
    'ObjectExpression',
    'ArrayExpression',
    'TemplateLiteral',
    'NewExpression',
    'FunctionExpression',
    'ArrowFunctionExpression',
  ].includes(value.type)
}

/**
 * What a hook does with a context it reads: `'proven'` when it's shown
 * present, `'derived'` when only something computed from it is used,
 * `'returned'` when the missing value can reach a `return`, and `'unclear'`
 * otherwise.
 */
function judge(context, call, fn, missing) {
  const target = outermostWrapper(call)
  const parent = target.parent
  const isReturned = (node) =>
    node.parent?.type === 'ReturnStatement' || node.parent === fn
  if (
    parent?.type === 'LogicalExpression' &&
    parent.operator === '??' &&
    parent.left === target
  ) {
    if (neverNullish(parent.right)) return 'proven'
    const fallback = unwrap(parent.right)
    const missingFallback = isNull(fallback) || isUndefined(fallback)
    return missingFallback && isReturned(outermostWrapper(parent))
      ? 'returned'
      : 'unclear'
  }
  // A comparison, `!`, or a member read hands back something derived from
  // the context, never the context itself.
  if (
    (parent?.type === 'BinaryExpression' &&
      ['===', '!==', '==', '!='].includes(parent.operator)) ||
    (parent?.type === 'UnaryExpression' && parent.operator === '!') ||
    (parent?.type === 'MemberExpression' &&
      parent.object === target &&
      parent.optional)
  ) {
    return 'derived'
  }
  if (isReturned(target)) return 'returned'
  if (
    parent?.type !== 'VariableDeclarator' ||
    parent.id.type !== 'Identifier'
  ) {
    return 'unclear'
  }
  const variable = variableOf(context, parent.id)
  const body = fn.body.type === 'BlockStatement' ? fn.body.body : []
  const declared = body.findIndex((statement) => statement === parent.parent)
  if (declared === -1) return 'unclear'
  for (const statement of body.slice(declared + 1)) {
    if (
      statement.type === 'IfStatement' &&
      testsMissing(context, statement.test, variable, missing) &&
      alwaysThrows(statement.consequent)
    ) {
      return 'proven'
    }
    // A `return` before the check could hand back the missing value.
    if (some(statement, (node) => node.type === 'ReturnStatement')) break
  }
  // Any other use of the variable before it's returned might be a check the
  // rule doesn't recognise (`invariant(ctx)`), so only an untouched variable
  // is definitely returned missing.
  const returnAt = body.findIndex(
    (statement) =>
      statement.type === 'ReturnStatement' &&
      readsVariable(context, unwrap(statement.argument), variable),
  )
  if (returnAt === -1) return 'unclear'
  const usedBefore = body
    .slice(declared + 1, returnAt)
    .some((statement) =>
      some(statement, (node) => readsVariable(context, node, variable)),
    )
  return usedBefore ? 'unclear' : 'returned'
}

export const contextHookContract = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '`useX` context hooks throw when the provider is missing; hooks that can return a missing context are named `useMaybeX`.',
    },
  },
  create(context) {
    return {
      Program(program) {
        const useContextNames = new Set([
          ...importedNames(program, 'react', 'useContext'),
          ...importedNames(program, 'react', 'use'),
        ])
        const contexts = nullableContexts(
          program,
          importedNames(program, 'react', 'createContext'),
        )
        if (contexts.size === 0) return
        for (const { name, fn } of hooks(program)) {
          if (/^useMaybe[A-Z]/.test(name)) continue
          walk(fn.body, (node) => {
            if (
              !isCallTo(node, 'useContext', useContextNames) &&
              !isCallTo(node, 'use', useContextNames)
            ) {
              return
            }
            const read = unwrap(node.arguments[0])
            if (read?.type !== 'Identifier') return
            const declarator = variableOf(context, read)?.defs[0]?.node
            const missing = contexts.get(declarator)
            if (!missing) return
            const verdict = judge(context, node, fn, missing)
            if (verdict === 'proven' || verdict === 'derived') return
            const check = `check it and throw, naming the provider the part needs (\`if (!ctx) throw new Error('<Part> must be used within <Root>')\`)`
            context.report({
              node,
              message:
                verdict === 'returned'
                  ? `\`${name}\` can return a missing \`${read.name}\` (its default is \`${missing}\`). Either ${check}, or rename the hook \`${name.replace(/^use/, 'useMaybe')}\` so callers know to check. ${section}`
                  : `Can't tell whether \`${name}\` handles a missing \`${read.name}\` (its default is \`${missing}\`). Read it into a variable and ${check} before any \`return\`, or add a reasoned \`oxlint-disable-next-line\`. ${section}`,
            })
          })
        }
      },
    }
  },
}
