/**
 * `bazza/resolve-state-props`: a part's `className` and `style` reach
 * `useRender` resolved.
 *
 * Base UI's `useRender` resolves state-function `className` / `style` passed
 * at the top level of its options, but merges `props` as they are, so a
 * function inside `props` reaches the DOM. Inside `props`, the rule proves
 * each piece safe:
 * - `className` is `resolveClassName(…)` or a string;
 * - `style` is `resolveStyle(…)`, or an object built from styles that are;
 * - every spread is an object literal, a `mergeProps` / `mergeElementProps`
 *   call, a rest object that pulled out both `className` and `style`, another
 *   prop, or an import.
 * Local variables are followed to their initialiser unless something changes
 * them later. Anything the rule can't prove is reported (fail closed).
 *
 * Known limit: another prop is trusted when spread. A prop typed to hold
 * element props (like the `triggerProps` Base UI hands a trigger) comes back
 * resolved from Base UI; the rule can't see a prop's type to tell otherwise.
 */
import {
  isUseRenderCall,
  keyName,
  unwrap,
  useRenderNames,
  variableOf,
} from './ast.mjs'
import { originOf, partRenderFunctions } from './state-props.mjs'

const section = 'See "Component Pattern" in packages/react/AGENTS.md.'
const why =
  '`useRender` resolves `className` and `style` functions only at the top level of its options; inside `props` a function reaches the DOM.'

const isIdentifierCall = (node, name) =>
  node?.type === 'CallExpression' &&
  node.callee.type === 'Identifier' &&
  node.callee.name === name

const mergeCalls = new Set(['mergeProps', 'mergeElementProps'])

const isMergeCall = (node) =>
  node?.type === 'CallExpression' &&
  node.callee.type === 'Identifier' &&
  mergeCalls.has(node.callee.name)

const isStringValue = (node) =>
  (node?.type === 'Literal' && typeof node.value === 'string') ||
  (node?.type === 'TemplateLiteral' && node.expressions.length === 0) ||
  (node?.type === 'Identifier' && node.name === 'undefined')

export const resolveStateProps = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "A part's `className` and `style` are resolved before they go into `useRender`'s `props`.",
    },
  },
  create(context) {
    let names
    let renderFunctions
    const report = (node, message) =>
      context.report({ node, message: `${message} ${why} ${section}` })
    const cantTell = (at, what) =>
      report(
        at,
        `Can't tell whether ${what} carries the part's unresolved \`className\` or \`style\`. Build \`props\` from object literals, \`merge*\` calls, and a rest object that destructured both out (\`const { className, style, ...rest } = props\`).`,
      )

    /**
     * A check in progress: `at` is the entry in `props` that reports attach
     * to, `label` names the variable being followed, `seen` stops cycles.
     */
    const start = (node) => ({
      at: node,
      label: undefined,
      nested: false,
      seen: new Map(),
    })
    /** A check for the next value beside this one: same anchor, no label yet. */
    const sibling = (check) => ({ ...check, label: undefined })

    /**
     * Follows an identifier to its origin. Returns the value to keep checking,
     * `true` when the origin is safe, or `false` after reporting.
     */
    function follow(identifier, kind, check) {
      const variable = variableOf(context, identifier) ?? identifier.name
      const kinds = check.seen.get(variable) ?? new Set()
      if (kinds.has(kind)) return true
      check.seen.set(variable, kinds.add(kind))
      check.label = identifier.name
      const origin = originOf(context, identifier, renderFunctions)
      if (typeof origin === 'object' && origin.changed) {
        cantTell(
          check.at,
          `\`${identifier.name}\`, which is reassigned or written to after its declaration,`,
        )
        return false
      }
      if (typeof origin === 'object') {
        check.nested = true
        return origin.alias
      }
      if (
        kind === 'spread' &&
        (origin === 'rest' || origin === 'other-prop' || origin === 'import')
      ) {
        return true
      }
      if (origin === 'className' || origin === 'style') {
        const resolver =
          origin === 'className' ? 'resolveClassName' : 'resolveStyle'
        report(
          check.at,
          `\`${identifier.name}\` is the part's unresolved \`${origin}\`. Pass \`${resolver}(${identifier.name}, state)\` instead.`,
        )
        return false
      }
      if (origin === 'props' || origin === 'raw-rest') {
        report(
          check.at,
          `\`${identifier.name}\` still holds the part's \`className\` or \`style\`. Destructure both out first (\`const { className, style, ...rest } = props\`) and pass them resolved.`,
        )
        return false
      }
      cantTell(check.at, `\`${identifier.name}\``)
      return false
    }

    const what = (check) => (check.label ? `\`${check.label}\`` : 'this value')

    /** Checks a value that is spread into `props` (or merged into it). */
    function checkSpread(node, check) {
      const value = unwrap(node)
      if (value?.type === 'ObjectExpression') return checkObject(value, check)
      if (value?.type === 'ConditionalExpression') {
        checkSpread(value.consequent, sibling(check))
        checkSpread(value.alternate, sibling(check))
        return
      }
      if (value?.type === 'LogicalExpression') {
        if (value.operator !== '&&') checkSpread(value.left, sibling(check))
        checkSpread(value.right, sibling(check))
        return
      }
      if (isMergeCall(value)) {
        for (const argument of value.arguments) {
          checkSpread(argument, sibling(check))
        }
        return
      }
      if (value?.type === 'Identifier') {
        const next = follow(value, 'spread', check)
        if (next && next !== true) checkSpread(next, check)
        return
      }
      if (value?.type === 'Literal' || isStringValue(value)) return
      cantTell(check.at, what(check))
    }

    /** Checks the `className` value inside `props`. */
    function checkClassName(node, check) {
      const value = unwrap(node)
      if (isIdentifierCall(value, 'resolveClassName') || isStringValue(value))
        return
      if (value?.type === 'ConditionalExpression') {
        checkClassName(value.consequent, sibling(check))
        checkClassName(value.alternate, sibling(check))
        return
      }
      if (value?.type === 'LogicalExpression') {
        if (value.operator !== '&&') {
          checkClassName(value.left, sibling(check))
        }
        checkClassName(value.right, sibling(check))
        return
      }
      if (value?.type === 'Identifier') {
        const next = follow(value, 'value', check)
        if (next && next !== true) checkClassName(next, check)
        return
      }
      report(
        check.at,
        '`className` inside `props` must be `resolveClassName(className, state)` or a string.',
      )
    }

    /**
     * Checks the `style` value inside `props`. `kind` is `'spread'` for a
     * value spread into a style object, where imports and other props are
     * trusted like any spread.
     */
    function checkStyle(node, check, kind = 'value') {
      const value = unwrap(node)
      if (isIdentifierCall(value, 'resolveStyle') || isStringValue(value))
        return
      if (value?.type === 'ObjectExpression') {
        for (const property of value.properties) {
          if (property.type === 'SpreadElement') {
            checkStyle(property.argument, sibling(check), 'spread')
          }
        }
        return
      }
      if (value?.type === 'ConditionalExpression') {
        checkStyle(value.consequent, sibling(check), kind)
        checkStyle(value.alternate, sibling(check), kind)
        return
      }
      if (value?.type === 'LogicalExpression') {
        if (value.operator !== '&&') {
          checkStyle(value.left, sibling(check), kind)
        }
        checkStyle(value.right, sibling(check), kind)
        return
      }
      if (value?.type === 'Identifier') {
        const next = follow(value, kind, check)
        if (next && next !== true) checkStyle(next, check, kind)
        return
      }
      report(
        check.at,
        '`style` inside `props` must be `resolveStyle(style, state)`, or an object whose spreads are. `composeStyle` keeps a function a function, so it only belongs on a Base UI component that resolves `style` itself.',
      )
    }

    /** Checks an object literal that becomes part of `props`. */
    function checkObject(object, check) {
      for (const property of object.properties) {
        // Entries of the literal written inside `props` anchor their own
        // reports; entries reached through a variable report at its use.
        const next = check.nested ? sibling(check) : start(property)
        if (property.type === 'SpreadElement') {
          checkSpread(property.argument, next)
        } else if (keyName(property) === 'className') {
          checkClassName(property.value, next)
        } else if (keyName(property) === 'style') {
          checkStyle(property.value, next)
        } else if (
          keyName(property) === undefined &&
          unwrap(property.value)?.type !== 'Literal'
        ) {
          // `[key]: value` could be `className` or `style` under another name.
          cantTell(next.at, 'an entry whose key is computed')
        }
      }
    }

    return {
      Program(program) {
        names = useRenderNames(program)
        renderFunctions = partRenderFunctions(program)
      },
      CallExpression(node) {
        if (!isUseRenderCall(node, names)) return
        const options = unwrap(node.arguments[0])
        if (
          options?.type !== 'ObjectExpression' ||
          options.properties.some((p) => p.type === 'SpreadElement')
        ) {
          cantTell(node.arguments[0] ?? node, "`useRender`'s options")
          return
        }
        const props = options.properties.find((p) => keyName(p) === 'props')
        if (!props) return
        checkSpread(props.value, start(props.value))
      },
    }
  },
}
