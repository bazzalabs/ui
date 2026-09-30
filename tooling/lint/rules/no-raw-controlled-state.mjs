/**
 * `bazza/no-raw-controlled-state`: a store's internal half of a controlled
 * value is never read on its own.
 *
 * `ListboxStore` keeps a controlled value in two fields: the internal one
 * (`open`, `search`) and the one synced from the prop (`openProp`,
 * `searchProp`). Its selectors resolve the effective value as
 * `openProp ?? open`. While an app controls the prop, the internal field goes
 * stale, so code that reads `store.state.open` treats an open menu as closed.
 *
 * Reported: `<x>.state.open`, the same read through `const s = <x>.state`,
 * `const { open } = <x>.state`, and `<x>.state.search ||= …`. Allowed: plain
 * writes, and the effective value spelled out by hand,
 * `<x>.state.openProp ?? <x>.state.open`.
 */
import {
  keyName,
  memberName,
  outermostWrapper,
  unwrap,
  variableOf,
} from './ast.mjs'

/**
 * Internal field → the field its controlled prop is synced to. Mirrors the
 * `open` and `search` selectors in `ListboxStore`; add a pair when a store
 * gains another controlled value.
 */
const controlledPairs = new Map([
  ['open', 'openProp'],
  ['search', 'searchProp'],
])

/** `<x>.state`, looking through TypeScript wrappers. */
function isStateMember(node) {
  const value = unwrap(node)
  return value?.type === 'MemberExpression' && memberName(value) === 'state'
}

/**
 * Whether `member` is only written to: `x.open = v` and `delete x.open` are.
 * `x.open ||= v`, `x.open += v` and `x.open++` read the old value first, so
 * they aren't.
 */
function isWriteTarget(member) {
  const { parent } = member
  if (parent?.type === 'AssignmentExpression' && parent.left === member) {
    return parent.operator === '='
  }
  return parent?.type === 'UnaryExpression' && parent.operator === 'delete'
}

export const noRawControlledState = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "A store's internal half of a controlled value is never read on its own.",
    },
  },
  create(context) {
    const text = (node) => context.sourceCode.getText(node)

    /** Whether `identifier` is a `const` bound to `<x>.state`. */
    const isStateAlias = (identifier) => {
      const definition = variableOf(context, identifier)?.defs?.[0]
      if (definition?.type !== 'Variable') return false
      const declarator = definition.node
      return (
        declarator.parent?.kind === 'const' &&
        declarator.id.type === 'Identifier' &&
        isStateMember(declarator.init)
      )
    }

    /** Whether `object` is `<x>.state` or a `const` alias of it. */
    const isStateObject = (object) => {
      const value = unwrap(object)
      if (isStateMember(value)) return true
      return value?.type === 'Identifier' && isStateAlias(value)
    }

    /** `<object>.<field>Prop ?? <object>.<field>`: the effective value, by hand. */
    const isEffectiveFallback = (member, field) => {
      const node = outermostWrapper(member)
      const { parent } = node
      if (parent?.type !== 'LogicalExpression' || parent.operator !== '??') {
        return false
      }
      if (parent.right !== node) return false
      const left = unwrap(parent.left)
      return (
        left?.type === 'MemberExpression' &&
        memberName(left) === controlledPairs.get(field) &&
        text(unwrap(left.object)) === text(unwrap(member.object))
      )
    }

    const report = (node, field) => {
      const prop = controlledPairs.get(field)
      context.report({
        node,
        message: `\`state.${field}\` is the store's internal value, and it goes stale while an app controls the \`${field}\` prop. Read the effective value with \`store.select('${field}')\` (or \`store.useState('${field}')\` in render), which resolves \`${prop} ?? ${field}\`. See "Store state" in packages/react/AGENTS.md.`,
      })
    }

    return {
      MemberExpression(node) {
        const field = memberName(node)
        if (!controlledPairs.has(field)) return
        if (!isStateObject(node.object)) return
        if (isWriteTarget(node)) return
        if (isEffectiveFallback(node, field)) return
        report(node, field)
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'ObjectPattern') return
        if (!node.init || !isStateObject(node.init)) return
        for (const property of node.id.properties) {
          if (property.type !== 'Property') continue
          const field = keyName(property)
          if (controlledPairs.has(field)) report(property, field)
        }
      },
    }
  },
}
