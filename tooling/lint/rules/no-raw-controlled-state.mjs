/**
 * `bazza/no-raw-controlled-state`: a store's controlled values are written
 * only by the store.
 *
 * `ListboxStore` keeps each controlled value (`open`, `search`) in a private
 * cell, the internal value and the prop's, and mirrors it into state as
 * `open` / `openProp` and `search` / `searchProp`, written in the same update
 * as the cell. A write to one of those fields from outside the store changes
 * the mirror and not the cell, and skips the consumer's callback.
 *
 * Reported, on a receiver that looks like a store (`this`, an identifier or
 * member named `store` or ending in `Store`): `<store>.set('open', …)`,
 * `useSyncedValue`, `useSyncedValueWithCleanup` and `useStateSetter` with one
 * of the fields as a literal key, `<store>.update({ open })`, `setState` and
 * `useSyncedValues` with one of them as a literal key in an object literal,
 * and `useControlledProp('open' | 'search', …)`. Allowed:
 * `useControlledProp('openProp' | 'searchProp', …)`, which syncs the cell.
 * The store's own literal-key writes, made with their cell, carry an inline
 * exception.
 *
 * Not covered: other receivers (`params.set('search', q)` is a
 * URLSearchParams), computed calls (`store['set'](…)`), destructured methods
 * (`const { set } = store`), keys in variables or computed keys
 * (`store.set(key, …)`, `{ [key]: … }`), and objects built elsewhere
 * (`store.update(changes)`, spreads).
 */
import { keyName, memberName, stringValue, unwrap } from './ast.mjs'

/** Field → how to change it instead. */
const fields = new Map([
  [
    'open',
    "`store.setOpen(…)`, or sync the prop with `store.useControlledProp('openProp', …)`",
  ],
  [
    'search',
    "`store.setSearch(…)`, or sync the prop with `store.useControlledProp('searchProp', …)`",
  ],
  ['openProp', "`store.useControlledProp('openProp', …)`"],
  ['searchProp', "`store.useControlledProp('searchProp', …)`"],
])

/** Methods that take a state key first. */
const keyedMethods = new Set([
  'set',
  'useSyncedValue',
  'useSyncedValueWithCleanup',
  'useStateSetter',
  'useControlledProp',
])

/** Methods that take an object of state fields first. */
const objectMethods = new Set(['update', 'setState', 'useSyncedValues'])

/** `useControlledProp` syncs these into their cell. */
const controlledProps = new Set(['openProp', 'searchProp'])

/** A name that reads as a store: `store`, `listboxStore`, `ListboxStore`. */
const isStoreName = (name) =>
  typeof name === 'string' && (name === 'store' || name.endsWith('Store'))

/** Whether `node` looks like a store: `this`, `store`, `parentStore`, `context.store`. */
function isStoreLike(node) {
  const value = unwrap(node)
  if (value?.type === 'ThisExpression') return true
  if (value?.type === 'Identifier') return isStoreName(value.name)
  return value?.type === 'MemberExpression' && isStoreName(memberName(value))
}

export const noRawControlledState = {
  meta: {
    type: 'problem',
    docs: {
      description: "A store's controlled values are written only by the store.",
    },
  },
  create(context) {
    const report = (node, field) => {
      context.report({
        node,
        message: `\`${field}\` in a store's state mirrors its controlled cell, so writing it directly leaves the cell behind and skips the consumer's callback. Change it with ${fields.get(field)}. See "Store state" in packages/react/AGENTS.md.`,
      })
    }

    return {
      CallExpression(node) {
        const callee = unwrap(node.callee)
        if (callee?.type !== 'MemberExpression' || callee.computed) return
        if (!isStoreLike(callee.object)) return
        const method = callee.property.name
        const [first] = node.arguments

        if (keyedMethods.has(method)) {
          const field = stringValue(first)
          if (!fields.has(field)) return
          if (method === 'useControlledProp' && controlledProps.has(field)) {
            return
          }
          report(first, field)
          return
        }

        if (!objectMethods.has(method)) return
        const object = unwrap(first)
        if (object?.type !== 'ObjectExpression') return
        for (const property of object.properties) {
          if (property.type !== 'Property') continue
          const field = keyName(property)
          if (fields.has(field)) report(property, field)
        }
      },
    }
  },
}
