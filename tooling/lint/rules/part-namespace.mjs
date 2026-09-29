/**
 * `bazza/part-namespace`: every exported part has a namespace with its types.
 *
 * Consumers type props and state through the part itself
 * (`DropdownMenu.Item.Props`, `DropdownMenu.Item.State`), and the docs type
 * tables read the same names. A part is an exported value built from
 * `forwardRef(…)`, including `memo(forwardRef(…))`. It needs
 * `export namespace Part { … Props … }`, plus `State` when its render function
 * passes `state` to `useRender`.
 */
import {
  exportedLocals,
  findForwardRefCall,
  findTopLevelBinding,
  forwardRefNames,
  importedNames,
  topLevelDeclaration,
  unwrap,
} from './ast.mjs'

/** Type names exported from `namespace Name { … }` blocks, merged across blocks. */
function namespaceMembers(program) {
  const namespaces = new Map()
  for (const statement of program.body) {
    const declaration = topLevelDeclaration(statement)
    if (declaration?.type !== 'TSModuleDeclaration') continue
    const name = declaration.id.name
    const members = namespaces.get(name) ?? new Set()
    for (const inner of declaration.body?.body ?? []) {
      // `Part.Props` only resolves for consumers when the member is exported,
      // which every member of a `declare namespace` is.
      if (inner.type !== 'ExportNamedDeclaration' && !declaration.declare) {
        continue
      }
      const member = topLevelDeclaration(inner)
      if (
        member?.type === 'TSInterfaceDeclaration' ||
        member?.type === 'TSTypeAliasDeclaration'
      ) {
        members.add(member.id.name)
      }
    }
    namespaces.set(name, members)
  }
  return namespaces
}

const functionTypes = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

/**
 * Calls `visit` on every AST node under `root`, without entering functions
 * nested inside it: a component declared inside a render function renders
 * itself, not the part.
 */
function walk(root, visit) {
  const stack = [root]
  while (stack.length > 0) {
    const node = stack.pop()
    if (!node || typeof node.type !== 'string') continue
    if (node !== root && functionTypes.has(node.type)) continue
    visit(node)
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue
      const value = node[key]
      if (Array.isArray(value)) stack.push(...value)
      else if (value && typeof value === 'object') stack.push(value)
    }
  }
}

/** A call to `useRender` under any of `names`, or `<anything>.useRender(…)`. */
function isUseRenderCall(node, names) {
  if (node.type !== 'CallExpression') return false
  const { callee } = node
  if (callee.type === 'Identifier') return names.has(callee.name)
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.name === 'useRender'
  )
}

/**
 * Whether the `useRender` calls under `root` pass `state`: `'yes'`, `'no'`, or
 * `'unknown'` when a call's options aren't an object literal the rule can read.
 */
function statePassedToUseRender(root, names) {
  let result = 'no'
  walk(root, (node) => {
    if (result === 'yes') return
    if (!isUseRenderCall(node, names)) return
    const options = unwrap(node.arguments[0])
    if (options?.type !== 'ObjectExpression') {
      result = 'unknown'
      return
    }
    for (const property of options.properties) {
      if (property.type === 'SpreadElement') {
        result = 'unknown'
      } else if (
        !property.computed &&
        (property.key.name ?? property.key.value) === 'state'
      ) {
        result = 'yes'
        return
      }
    }
  })
  return result
}

const isFunction = (node) => functionTypes.has(node?.type)

/**
 * The function that renders a part: the function passed to `forwardRef`, or
 * the function it names in this module. Undefined when the rule can't tell.
 */
function renderFunction(forwardRefCall, program) {
  const render = unwrap(forwardRefCall.arguments[0])
  if (isFunction(render)) return render
  if (render?.type !== 'Identifier') return undefined
  const binding = findTopLevelBinding(program, render.name)
  if (binding?.type === 'FunctionDeclaration') return binding
  const init = unwrap(binding?.init)
  return isFunction(init) ? init : undefined
}

const example = (name) =>
  `\`export namespace ${name} { export type State = ${name}State; export interface Props extends ${name}Props {} }\``

export const partNamespace = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Every exported part has `export namespace Part { State; Props }`.',
    },
  },
  create(context) {
    return {
      Program(program) {
        const exported = exportedLocals(program)
        const namespaces = namespaceMembers(program)
        const names = forwardRefNames(program)
        const useRenderNames = importedNames(
          program,
          '@base-ui/react/use-render',
          'useRender',
        )
        for (const statement of program.body) {
          const declaration = topLevelDeclaration(statement)
          if (declaration?.type !== 'VariableDeclaration') continue
          for (const declarator of declaration.declarations) {
            if (declarator.id.type !== 'Identifier') continue
            const name = declarator.id.name
            if (!exported.has(name)) continue
            const call = findForwardRefCall(declarator.init, names)
            if (!call) continue
            const members = namespaces.get(name) ?? new Set()
            const render = renderFunction(call, program)
            const state = render
              ? statePassedToUseRender(render, useRenderNames)
              : 'unknown'
            const missing = [
              ...(state === 'yes' && !members.has('State') ? ['State'] : []),
              ...(!members.has('Props') ? ['Props'] : []),
            ]
            if (missing.length > 0) {
              context.report({
                node: declarator.id,
                message: `Part \`${name}\` has no ${missing.map((m) => `\`${name}.${m}\``).join(' or ')} type. Consumers and the docs type tables read a part's types from its namespace. Add ${example(name)} (\`State\` only when the part passes \`state\` to \`useRender\`). See "Component Pattern" in packages/react/AGENTS.md.`,
              })
            } else if (state === 'unknown' && !members.has('State')) {
              context.report({
                node: declarator.id,
                message: `Can't tell whether part \`${name}\` passes \`state\` to \`useRender\`: its render function isn't declared in this module, or a \`useRender\` call's options aren't an object literal. Declare the render function here and pass the options inline (\`useRender({ state, … })\`), or add \`${name}.State\` to its namespace. See "Component Pattern" in packages/react/AGENTS.md.`,
              })
            }
          }
        }
      },
    }
  },
}
