/**
 * `bazza/no-module-side-effects`: importing a module does nothing outside it.
 *
 * `@bazza-ui/react` declares `"sideEffects": false` (and `@bazza-ui/menu-core`,
 * which ships inside its `dist`), so a bundler drops every module a member
 * never reaches, and skips an `import` whose bindings go unused. Code that
 * runs on import and matters outside its module would then run in some apps
 * and not others. At the top level, a module only declares:
 *
 * - imports with bindings, and exports;
 * - functions, classes, types, interfaces, enums and namespaces whose code
 *   (superclass, computed keys, static members, enum values) does the same;
 * - variables whose initializers (and destructuring defaults and computed
 *   keys) call only `PURE_CALLS`;
 * - writes to its own objects: a direct property of a function, class or
 *   enum it declares, or of a `const` it initializes with a fresh literal,
 *   a function or a `PURE_CALLS` call (`Tooltip.Popup = TooltipPopup`); in a
 *   class's static block, also its own `let` bindings;
 * - dev-only blocks of the same (`if (process.env.NODE_ENV !== 'production')`).
 *
 * Code inside a function or a class's methods isn't checked: it runs only
 * when called.
 */
import {
  isFunction,
  stringValue,
  topLevelDeclaration,
  unwrap,
  walk,
} from './ast.mjs'

/**
 * The calls a top-level initializer may make, the single list of them
 * (AGENTS.md "Module side effects" points here). Each builds a fresh value
 * and touches nothing else. An imported function is keyed by its module and
 * name (`react#forwardRef`, however it's imported); a global by its name,
 * and only while nothing in the module shadows it. Every entry is called at
 * the top level of `packages/react/src` or `packages/menu-core/src`.
 */
const PURE_CALLS = new Set([
  // React's component and context factories.
  'react#forwardRef',
  'react#createContext',
  // Base UI's store primitives.
  'new @base-ui/utils/store#Store',
  '@base-ui/utils/store#createSelector',
  // Built-ins that build a fresh value.
  'Symbol',
  'Object.values',
  'new Set',
  'new Map',
  'new WeakMap',
  'new WeakSet',
  'new Intl.PluralRules',
])

const message = (problem) =>
  `${problem} \`@bazza-ui/react\` declares \`"sideEffects": false\`, so bundlers drop a module nothing uses and skip an import whose bindings go unused: code that runs on import and matters outside the module would run in some apps and not others. Keep the top level to declarations, writes to the module's own objects, and dev-only blocks of them; move the rest into a function the code that needs it calls. See "Module side effects" in packages/react/AGENTS.md.`

/** `process.env.NODE_ENV !== 'production'`, either way round. */
function isDevCheck(test) {
  const node = unwrap(test)
  if (node?.type !== 'BinaryExpression') return false
  if (node.operator !== '!==' && node.operator !== '!=') return false
  const sides = [unwrap(node.left), unwrap(node.right)]
  const isNodeEnv = (side) =>
    side?.type === 'MemberExpression' &&
    !side.computed &&
    side.property.name === 'NODE_ENV' &&
    unwrap(side.object)?.type === 'MemberExpression' &&
    unwrap(side.object).property.name === 'env' &&
    unwrap(unwrap(side.object).object)?.name === 'process'
  return (
    sides.some(isNodeEnv) &&
    sides.some((side) => stringValue(side) === 'production')
  )
}

/** Every binding identifier a pattern declares, never a type or a key. */
function patternNames(pattern, names = []) {
  const node = unwrap(pattern)
  if (!node) return names
  switch (node.type) {
    case 'Identifier':
      names.push(node.name)
      break
    case 'ObjectPattern':
      for (const property of node.properties) {
        patternNames(
          property.type === 'RestElement' ? property.argument : property.value,
          names,
        )
      }
      break
    case 'ArrayPattern':
      for (const element of node.elements) patternNames(element, names)
      break
    case 'RestElement':
      patternNames(node.argument, names)
      break
    case 'AssignmentPattern':
      patternNames(node.left, names)
      break
  }
  return names
}

/** Whether an import declaration or specifier brings in only a type. */
const typeOnly = (node) => node.importKind === 'type'

/**
 * The module's value imports: local name → its module and imported name
 * (`*` for a namespace). Type-only imports bind no value.
 */
function importBindings(program) {
  const imports = new Map()
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration' || typeOnly(statement)) continue
    for (const specifier of statement.specifiers) {
      if (typeOnly(specifier)) continue
      const imported =
        specifier.type === 'ImportNamespaceSpecifier'
          ? '*'
          : specifier.type === 'ImportDefaultSpecifier'
            ? 'default'
            : (specifier.imported.name ?? specifier.imported.value)
      imports.set(specifier.local.name, {
        source: statement.source.value,
        imported,
      })
    }
  }
  return imports
}

/** The value names `statements` declare (a module's, a block's, a namespace's). */
function declaredNames(statements, imports) {
  const names = new Set(imports?.keys() ?? [])
  for (const statement of statements) {
    if (statement.type === 'ImportDeclaration') continue
    const declaration = topLevelDeclaration(statement)
    if (!declaration) continue
    if (
      declaration.type === 'TSInterfaceDeclaration' ||
      declaration.type === 'TSTypeAliasDeclaration'
    ) {
      continue
    }
    if (declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        for (const name of patternNames(declarator.id)) names.add(name)
      }
    } else if (declaration.id?.type === 'Identifier') {
      names.add(declaration.id.name)
    }
  }
  return names
}

/** The names of a class's static setters, which a write to the class would call. */
function staticSetters(node) {
  const names = new Set()
  for (const member of node.body.body) {
    if (member.type !== 'MethodDefinition' || !member.static) continue
    if (member.kind !== 'set') continue
    names.add(
      member.computed ? (stringValue(member.key) ?? '*') : member.key.name,
    )
  }
  return names
}

/** Whether an object literal has a setter, which a write to it would call. */
const hasSetter = (node) =>
  node.properties.some((property) => property.kind === 'set')

/**
 * The objects `statements` own, by name, each with the names a write to it
 * would call a setter for: functions, enums and classes they declare (not
 * ambient ones, nor a class with a superclass, which may inherit static
 * setters), and `const`s they initialize with a fresh literal (without
 * setters), a function or a pure call. Also their `let`/`var` bindings.
 */
function ownBindings(statements, isPureCall) {
  const owned = new Map()
  const variables = new Set()
  for (const statement of statements) {
    if (statement.type === 'ImportDeclaration') continue
    const declaration = topLevelDeclaration(statement)
    if (!declaration || declaration.declare) continue
    if (declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declaration.kind !== 'const') {
          for (const name of patternNames(declarator.id)) variables.add(name)
          continue
        }
        const id = unwrap(declarator.id)
        const init = unwrap(declarator.init)
        const fresh =
          (init?.type === 'ObjectExpression' && !hasSetter(init)) ||
          init?.type === 'ArrayExpression' ||
          (init?.type === 'ClassExpression' && !init.superClass) ||
          isFunction(init) ||
          ((init?.type === 'CallExpression' ||
            init?.type === 'NewExpression') &&
            isPureCall(init))
        if (id?.type !== 'Identifier' || !fresh) continue
        owned.set(
          id.name,
          init.type === 'ClassExpression' ? staticSetters(init) : new Set(),
        )
      }
    } else if (declaration.id?.type === 'Identifier') {
      if (
        declaration.type === 'FunctionDeclaration' ||
        declaration.type === 'TSEnumDeclaration'
      ) {
        owned.set(declaration.id.name, new Set())
      } else if (
        declaration.type === 'ClassDeclaration' &&
        !declaration.superClass
      ) {
        owned.set(declaration.id.name, staticSetters(declaration))
      }
    }
  }
  return { owned, variables }
}

export const noModuleSideEffects = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Importing a module does nothing outside it.',
    },
  },
  create(context) {
    /** The module's value imports. */
    let imports = new Map()
    /**
     * The scopes in effect, outermost (the module) first: each the value
     * names it declares, the objects it owns and its `let`/`var` bindings.
     * A dev-only block and a namespace body each add one.
     */
    let scopes = []
    const report = (node, problem) =>
      context.report({ node, message: message(problem) })
    const text = (node) => context.sourceCode.getText(node)

    /** The key `PURE_CALLS` lists a callee under, or undefined. */
    function calleeKey(node) {
      const callee = unwrap(node.callee)
      const prefix = node.type === 'NewExpression' ? 'new ' : ''
      const path = []
      let root = callee
      while (root?.type === 'MemberExpression' && !root.computed) {
        path.unshift(root.property.name)
        root = unwrap(root.object)
      }
      if (root?.type !== 'Identifier') return undefined
      const scope = scopeDeclaring(root.name)
      const imported = scope === scopes[0] && imports.get(root.name)
      if (imported) {
        // React's default export is its namespace.
        const namespace =
          imported.imported === '*' ||
          (imported.imported === 'default' && imported.source === 'react')
        const names = namespace ? path : [imported.imported, ...path]
        if (names.length === 0) return undefined
        return `${prefix}${imported.source}#${names.join('.')}`
      }
      // A module's own function may do anything.
      if (scope) return undefined
      return `${prefix}${[root.name, ...path].join('.')}`
    }

    /** The innermost scope that declares `name`, or undefined for a global. */
    function scopeDeclaring(name) {
      for (let index = scopes.length - 1; index >= 0; index--) {
        if (scopes[index].declared.has(name)) return scopes[index]
      }
      return undefined
    }

    /** Runs `check` with the scope `statements` declare in effect. */
    function inScope(statements, check) {
      scopes.push({
        declared: declaredNames(statements),
        ...ownBindings(statements, isPureCall),
      })
      try {
        check()
      } finally {
        scopes.pop()
      }
    }
    const isPureCall = (node) => PURE_CALLS.has(calleeKey(node))

    /**
     * What evaluating `expression` at the top level runs: calls must be
     * `PURE_CALLS`, and nothing may be assigned, updated, deleted, imported
     * or awaited. Function bodies run later, so they're skipped.
     */
    function checkEvaluation(expression) {
      if (!expression || isFunction(unwrap(expression))) return
      walk(expression, (node) => {
        switch (node.type) {
          case 'CallExpression':
          case 'NewExpression':
            if (!isPureCall(node)) {
              const prefix = node.type === 'NewExpression' ? 'new ' : ''
              report(
                node,
                `Calls \`${prefix}${text(node.callee)}\` when the module is imported.`,
              )
              return false
            }
            return
          case 'TaggedTemplateExpression':
            report(
              node,
              `Calls the template tag \`${text(node.tag)}\` when the module is imported.`,
            )
            return false
          case 'ImportExpression':
            report(node, 'Imports a module when the module is imported.')
            return false
          case 'AwaitExpression':
            report(node, 'Waits at the top level when the module is imported.')
            return false
          case 'AssignmentExpression':
          case 'UpdateExpression':
            report(node, 'Writes a value when the module is imported.')
            return false
          case 'UnaryExpression':
            if (node.operator === 'delete') {
              report(node, 'Deletes a property when the module is imported.')
              return false
            }
            return
          case 'ClassExpression':
            checkClass(node)
            return false
          default:
            return
        }
      })
    }

    /** A pattern's destructuring defaults and computed keys run too. */
    function checkPattern(pattern) {
      const node = unwrap(pattern)
      if (!node) return
      switch (node.type) {
        case 'ObjectPattern':
          for (const property of node.properties) {
            if (property.type === 'RestElement') {
              checkPattern(property.argument)
              continue
            }
            if (property.computed) checkEvaluation(property.key)
            checkPattern(property.value)
          }
          return
        case 'ArrayPattern':
          for (const element of node.elements) checkPattern(element)
          return
        case 'RestElement':
          checkPattern(node.argument)
          return
        case 'AssignmentPattern':
          checkEvaluation(node.right)
          checkPattern(node.left)
          return
      }
    }

    /**
     * `own.key = value`: a direct property of an object the module owns
     * (or, in a static block, one of its own `let` bindings), with a pure
     * key and value.
     */
    function isOwnWrite(expression, inStaticBlock) {
      const node = unwrap(expression)
      if (node?.type === 'SequenceExpression') {
        return node.expressions.every((part) => isOwnWrite(part, inStaticBlock))
      }
      if (node?.type !== 'AssignmentExpression' || node.operator !== '=') {
        return false
      }
      const target = unwrap(node.left)
      let own = false
      if (target?.type === 'MemberExpression') {
        const object = unwrap(target.object)
        const setters =
          object?.type === 'Identifier' &&
          scopeDeclaring(object.name)?.owned.get(object.name)
        if (setters) {
          const key = target.computed
            ? stringValue(target.property)
            : target.property.name
          // A setter, or one a computed key might name, runs code.
          own =
            !setters.has(key) &&
            !(setters.size > 0 && (key === undefined || setters.has('*')))
          if (own && target.computed) checkEvaluation(target.property)
        }
      } else if (target?.type === 'Identifier') {
        own =
          inStaticBlock &&
          (scopeDeclaring(target.name)?.variables.has(target.name) ?? false)
      }
      if (!own) return false
      checkEvaluation(node.right)
      return true
    }

    /** A class's heritage, computed keys and static parts run when it's defined. */
    function checkClass(node) {
      if (node.declare) return
      for (const decorator of node.decorators ?? []) {
        report(decorator, 'A decorator runs when the module is imported.')
      }
      checkEvaluation(node.superClass)
      for (const member of node.body.body) {
        for (const decorator of member.decorators ?? []) {
          report(decorator, 'A decorator runs when the module is imported.')
        }
        if (member.computed) checkEvaluation(member.key)
        if (member.type === 'StaticBlock') {
          for (const statement of member.body) {
            if (
              statement.type !== 'ExpressionStatement' ||
              !isOwnWrite(statement.expression, true)
            ) {
              report(
                statement,
                'A static block does more than set the module’s own bindings.',
              )
            }
          }
        } else if (member.static && member.value && !isFunction(member.value)) {
          checkEvaluation(member.value)
        }
      }
    }

    function checkDeclaration(declaration) {
      switch (declaration.type) {
        case 'VariableDeclaration':
          if (declaration.declare) return
          for (const declarator of declaration.declarations) {
            checkPattern(declarator.id)
            checkEvaluation(declarator.init)
          }
          return
        case 'ClassDeclaration':
          checkClass(declaration)
          return
        case 'TSEnumDeclaration':
          if (declaration.declare) return
          for (const member of declaration.body?.members ??
            declaration.members ??
            []) {
            checkEvaluation(member.initializer)
          }
          return
        case 'TSModuleDeclaration':
          // A namespace with values runs its body; an ambient one has none.
          if (declaration.declare || !declaration.body) return
          if (declaration.body.type === 'TSModuleDeclaration') {
            checkDeclaration(declaration.body)
            return
          }
          inScope(declaration.body.body ?? [], () => {
            for (const statement of declaration.body.body ?? []) {
              checkStatement(statement, false)
            }
          })
          return
        default:
          // Functions, types and interfaces declare.
          return
      }
    }

    function checkStatement(statement, inDevBlock) {
      switch (statement.type) {
        case 'ImportDeclaration':
          if (
            statement.specifiers.length === 0 &&
            statement.importKind !== 'type'
          ) {
            report(
              statement,
              `\`import '${statement.source.value}'\` imports a module only for what it does on import.`,
            )
          }
          return
        case 'ExportAllDeclaration':
          return
        case 'ExportNamedDeclaration':
          if (statement.declaration) checkDeclaration(statement.declaration)
          return
        case 'ExportDefaultDeclaration': {
          const declaration = statement.declaration
          if (
            declaration.type === 'ClassDeclaration' ||
            declaration.type === 'ClassExpression'
          ) {
            checkClass(declaration)
            return
          }
          if (declaration.type === 'FunctionDeclaration') return
          checkEvaluation(declaration)
          return
        }
        case 'ExpressionStatement':
          if (typeof statement.directive === 'string') return
          if (isOwnWrite(statement.expression, false)) return
          report(statement, 'Runs code when the module is imported.')
          return
        case 'IfStatement':
          if (
            !inDevBlock &&
            isDevCheck(statement.test) &&
            !statement.alternate
          ) {
            const body =
              statement.consequent.type === 'BlockStatement'
                ? statement.consequent.body
                : [statement.consequent]
            inScope(body, () => {
              for (const inner of body) checkStatement(inner, true)
            })
            return
          }
          report(statement, 'Runs code when the module is imported.')
          return
        case 'VariableDeclaration':
        case 'ClassDeclaration':
        case 'TSEnumDeclaration':
        case 'TSModuleDeclaration':
          checkDeclaration(statement)
          return
        case 'FunctionDeclaration':
        case 'TSDeclareFunction':
        case 'TSTypeAliasDeclaration':
        case 'TSInterfaceDeclaration':
        case 'TSImportEqualsDeclaration':
        case 'TSNamespaceExportDeclaration':
        case 'EmptyStatement':
          return
        default:
          report(statement, 'Runs code when the module is imported.')
      }
    }

    return {
      Program(program) {
        imports = importBindings(program)
        // The module's scope: declared first, so a pure call's callee
        // resolves against it while its owned objects are worked out.
        const module = {
          declared: declaredNames(program.body, imports),
          owned: new Map(),
          variables: new Set(),
        }
        scopes = [module]
        Object.assign(module, ownBindings(program.body, isPureCall))
        for (const statement of program.body) checkStatement(statement, false)
      },
    }
  },
}
