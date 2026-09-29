/**
 * `bazza/forward-ref-named`: `forwardRef` wraps a named function.
 *
 * Parts don't set `displayName`, so the render function's name is what React
 * DevTools and error messages show. An arrow or anonymous function shows up as
 * `ForwardRef` with no name. A function passed by name must be declared in the
 * same module, so the rule can see it.
 */
import {
  findTopLevelBinding,
  forwardRefNames,
  isForwardRefCall,
  unwrap,
} from './ast.mjs'

const message = (problem) =>
  `${problem} Parts don't set \`displayName\`, so React DevTools and error messages show the render function's name. Write \`forwardRef(function PartName(props, forwardedRef) { … })\`, or declare \`function PartNameImpl(…)\` in this module and pass it by name. See "Component Pattern" in packages/react/AGENTS.md.`

const isAnonymousFunction = (node) =>
  node?.type === 'ArrowFunctionExpression' ||
  (node?.type === 'FunctionExpression' && !node.id)

/** What's wrong with the function `forwardRef` receives, or null when it's named. */
function problemWith(render, program) {
  if (render?.type === 'FunctionExpression' && render.id) return null
  if (isAnonymousFunction(render)) {
    return '`forwardRef` wraps an anonymous function.'
  }
  if (render?.type === 'Identifier') {
    const binding = findTopLevelBinding(program, render.name)
    if (binding?.type === 'FunctionDeclaration') return null
    const init = unwrap(binding?.init)
    if (init?.type === 'FunctionExpression' && init.id) return null
    if (isAnonymousFunction(init)) {
      return `\`forwardRef\` wraps \`${render.name}\`, which is an arrow or anonymous function.`
    }
    return `Can't tell whether \`${render.name}\` is a named function: declare it in this module with \`function ${render.name}(…)\`.`
  }
  return "Can't tell whether `forwardRef` wraps a named function: pass a function expression or the name of a function declared in this module."
}

export const forwardRefNamed = {
  meta: {
    type: 'problem',
    docs: { description: '`forwardRef` wraps a named function.' },
  },
  create(context) {
    let names
    let program
    return {
      Program(node) {
        program = node
        names = forwardRefNames(node)
      },
      CallExpression(node) {
        if (!isForwardRefCall(node, names)) return
        const render = unwrap(node.arguments[0])
        const problem = problemWith(render, program)
        if (!problem) return
        context.report({ node: render ?? node, message: message(problem) })
      },
    }
  },
}
