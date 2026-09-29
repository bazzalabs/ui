/**
 * Where a value in a part's render function came from, for the rules about a
 * part's `className` and `style` (`bazza/resolve-state-props`,
 * `bazza/no-spread-style`).
 *
 * A part's `className` and `style` may be functions of its state. Until
 * `resolveClassName` / `resolveStyle` handles them they're "raw", and so is
 * anything that still holds them: the props object, or a rest object
 * destructured from it that didn't pull both out.
 *
 * A render function is a function passed to `forwardRef` (directly or by name)
 * or a PascalCase function component. Its first parameter is the props.
 * Bindings are resolved with oxlint's scope analysis, so nested callbacks and
 * aliases are followed. A variable that is reassigned or written to after its
 * declaration can't be judged from its initialiser, so it counts as unknown.
 */
import {
  forwardRefNames,
  isForwardRefCall,
  isFunction,
  keyName,
  outermostWrapper,
  renderFunctionOf,
  unwrap,
  variableOf,
  walk,
} from './ast.mjs'

const isPascalCase = (name) => typeof name === 'string' && /^[A-Z]/.test(name)

/** The functions in `program` that render a part or component. */
export function partRenderFunctions(program) {
  const names = forwardRefNames(program)
  const functions = new Set()
  walk(
    program,
    (node) => {
      if (isForwardRefCall(node, names)) {
        const render = renderFunctionOf(node, program)
        if (render) functions.add(render)
      } else if (
        node.type === 'FunctionDeclaration' &&
        isPascalCase(node.id?.name)
      ) {
        functions.add(node)
      } else if (
        node.type === 'VariableDeclarator' &&
        isPascalCase(node.id.name) &&
        isFunction(unwrap(node.init))
      ) {
        functions.add(unwrap(node.init))
      }
    },
    { enterFunctions: true },
  )
  return functions
}

/** Whether `node` sits inside `ancestor` (or is it). */
function isInside(node, ancestor) {
  for (let current = node; current; current = current.parent) {
    if (current === ancestor) return true
  }
  return false
}

/**
 * Whether anything changes `variable` after its declaration: a reassignment,
 * a property write (`x.k = …`, `x[k] = …`, `delete x.k`), or `Object.assign(x, …)`.
 * A property write of a literal to a key other than `className` / `style` is
 * allowed, so objects of data attributes can be filled in.
 */
function isChangedLater(variable, declaration) {
  for (const reference of variable.references) {
    const id = reference.identifier
    if (isInside(id, declaration)) continue
    if (reference.isWrite?.()) return true
    // Look through `(x as T)` and `x!`, which don't change what's written to.
    const target = outermostWrapper(id)
    const parent = target.parent
    if (
      parent?.type === 'CallExpression' &&
      parent.arguments[0] === target &&
      parent.callee.type === 'MemberExpression' &&
      parent.callee.object.name === 'Object' &&
      parent.callee.property.name === 'assign'
    ) {
      return true
    }
    if (parent?.type !== 'MemberExpression' || parent.object !== target)
      continue
    const write = parent.parent
    if (write?.type === 'UnaryExpression' && write.operator === 'delete') {
      return true
    }
    if (write?.type === 'UpdateExpression') return true
    if (write?.type !== 'AssignmentExpression' || write.left !== parent) {
      continue
    }
    const key = parent.computed
      ? parent.property.type === 'Literal'
        ? String(parent.property.value)
        : undefined
      : parent.property.name
    if (key === 'className' || key === 'style') return true
    if (unwrap(write.right)?.type !== 'Literal') return true
  }
  return false
}

/**
 * How a binding pulled out of a props object relates to `className` and
 * `style`. `removed` lists keys an earlier destructure already pulled out.
 */
function fromPattern(pattern, id, removed) {
  for (const property of pattern.properties) {
    if (property.type === 'RestElement') {
      if (property.argument !== id) continue
      const keys = new Set(removed)
      for (const p of pattern.properties) {
        if (p.type !== 'RestElement') keys.add(keyName(p))
      }
      return keys.has('className') && keys.has('style')
        ? 'rest'
        : { rawRest: keys }
    }
    let value = property.value
    if (value?.type === 'AssignmentPattern') value = value.left
    if (value !== id) continue
    const key = keyName(property)
    if (key === 'className' || key === 'style') return key
    return 'other-prop'
  }
  return 'unknown'
}

/** Normalises a detailed origin to the public vocabulary. */
const publicOrigin = (origin) =>
  typeof origin === 'object' && origin.rawRest ? 'raw-rest' : origin

/**
 * Where `identifier`'s value comes from:
 * - `'props'`: the props object; `'raw-rest'`: a rest object that still holds
 *   `className` or `style`; `'className'` / `'style'`: the raw values;
 * - `'rest'`: a rest object without them; `'other-prop'`: another prop;
 * - `'import'`: an import;
 * - `{ alias: init, changed }`: a variable to follow through its initialiser,
 *   where `changed` says something writes to it later, so its current value
 *   can't be proven from the initialiser alone;
 * - `'unknown'`: anything else.
 */
export function originOf(context, identifier, renderFunctions) {
  return publicOrigin(detailedOrigin(context, identifier, renderFunctions))
}

function detailedOrigin(
  context,
  identifier,
  renderFunctions,
  visited = new Set(),
) {
  const variable = variableOf(context, identifier)
  const def = variable?.defs[0]
  if (!def || visited.has(variable)) return 'unknown'
  visited.add(variable)
  if (def.type === 'ImportBinding') return 'import'
  if (def.type === 'Parameter') {
    // Only a render function receives props. Any other function's parameters
    // could hold anything.
    if (!renderFunctions.has(def.node)) return 'unknown'
    const [first] = def.node.params
    const param = first?.type === 'AssignmentPattern' ? first.left : first
    if (param === def.name) return 'props'
    if (param?.type === 'ObjectPattern' && isInside(def.name, param)) {
      if (isChangedLater(variable, param)) return 'unknown'
      return fromPattern(param, def.name, new Set())
    }
    return 'unknown'
  }
  if (def.type !== 'Variable') return 'unknown'
  const declarator = def.node
  const changed = isChangedLater(variable, declarator)
  if (declarator.id === def.name) {
    if (!declarator.init) return 'unknown'
    // A changed variable can't be proven safe, but its first value still says
    // whether it started out as a style (for `no-spread-style`).
    return { alias: declarator.init, changed }
  }
  if (changed) return 'unknown'
  if (declarator.id.type !== 'ObjectPattern') return 'unknown'
  let source = unwrap(declarator.init)
  let sourceOrigin = 'unknown'
  // Follow `const p = props` aliases to the object being destructured.
  while (source?.type === 'Identifier') {
    sourceOrigin = detailedOrigin(context, source, renderFunctions, visited)
    if (typeof sourceOrigin === 'object' && sourceOrigin.alias) {
      source = unwrap(sourceOrigin.alias)
      sourceOrigin = 'unknown'
      continue
    }
    break
  }
  if (sourceOrigin === 'props') {
    return fromPattern(declarator.id, def.name, new Set())
  }
  if (typeof sourceOrigin === 'object' && sourceOrigin.rawRest) {
    return fromPattern(declarator.id, def.name, sourceOrigin.rawRest)
  }
  if (sourceOrigin === 'rest' || sourceOrigin === 'other-prop') {
    return 'other-prop'
  }
  return 'unknown'
}
