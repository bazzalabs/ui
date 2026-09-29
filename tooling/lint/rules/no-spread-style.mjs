/**
 * `bazza/no-spread-style`: a `style` that may be a function is never spread.
 *
 * A part's `style` prop can be a function of its state. Spreading it
 * (`{ ...style, transition: 'none' }`) copies a function's own properties,
 * which is nothing, so the consumer's styles silently disappear. The same goes
 * for another element's `props.style`. Resolve it with `resolveStyle`, or keep
 * it a function with `composeStyle`.
 *
 * Bindings are resolved through scopes, so a spread inside a callback or of an
 * alias still counts, and so does spreading a `composeStyle(…)` result. Only a
 * part's or component's own props count: the props a Base UI render callback
 * receives are already resolved.
 */
import { unwrap, variableOf } from './ast.mjs'
import { originOf, partRenderFunctions } from './state-props.mjs'

const isComposeStyleCall = (node) =>
  node.type === 'CallExpression' &&
  node.callee.type === 'Identifier' &&
  node.callee.name === 'composeStyle'

/** The values a spread argument can evaluate to, looking through `?:`, `&&`, `??`, `||`. */
function* candidates(node) {
  const value = unwrap(node)
  if (value?.type === 'ConditionalExpression') {
    yield* candidates(value.consequent)
    yield* candidates(value.alternate)
  } else if (value?.type === 'LogicalExpression') {
    if (value.operator !== '&&') yield* candidates(value.left)
    yield* candidates(value.right)
  } else if (value) {
    yield value
  }
}

export const noSpreadStyle = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A `style` prop that may be a function is never spread.',
    },
  },
  create(context) {
    let renderFunctions
    /** Whether `node` evaluates to a `style` prop that may be a function. */
    const isStyleProp = (node, seen) => {
      // `composeStyle` returns a function when the style it composes is one.
      if (isComposeStyleCall(node)) return true
      if (node.type === 'Identifier') {
        const variable = variableOf(context, node) ?? node.name
        if (seen.has(variable)) return false
        seen.add(variable)
        const origin = originOf(context, node, renderFunctions)
        if (origin === 'style') return true
        if (typeof origin !== 'object') return false
        return [...candidates(origin.alias)].some((v) => isStyleProp(v, seen))
      }
      if (node.type !== 'MemberExpression') return false
      const key = node.computed
        ? node.property.type === 'Literal'
          ? node.property.value
          : undefined
        : node.property.name
      if (key !== 'style') return false
      const object = unwrap(node.object)
      // `child.props.style`: another element's props, which may hold a function.
      if (
        object?.type === 'MemberExpression' &&
        !object.computed &&
        object.property.name === 'props'
      ) {
        return true
      }
      if (object?.type !== 'Identifier') return false
      let origin = originOf(context, object, renderFunctions)
      // Follow `const p = props` to the props object.
      const seenAliases = new Set()
      while (
        typeof origin === 'object' &&
        unwrap(origin.alias)?.type === 'Identifier' &&
        !seenAliases.has(origin.alias)
      ) {
        seenAliases.add(origin.alias)
        origin = originOf(context, unwrap(origin.alias), renderFunctions)
      }
      return origin === 'props' || origin === 'raw-rest'
    }
    return {
      Program(program) {
        renderFunctions = partRenderFunctions(program)
      },
      SpreadElement(node) {
        if (node.parent?.type !== 'ObjectExpression') return
        const spreadsStyle = [...candidates(node.argument)].some((value) =>
          isStyleProp(value, new Set()),
        )
        if (!spreadsStyle) return
        context.report({
          node,
          message:
            'Spreading a `style` prop drops it when it\'s a function of state, because a function has no style properties to copy. Use `resolveStyle(style, state)` to get an object, or `composeStyle(style, (resolved) => ({ ...resolved, … }))` when a Base UI component resolves it later. See "Composing styles" in packages/react/AGENTS.md.',
        })
      },
    }
  },
}
