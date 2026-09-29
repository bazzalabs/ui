/**
 * `bazza/data-attrs-enum`: data-attribute and CSS-variable files export enums.
 *
 * The docs type generator (`apps/web/scripts/build-types-meta.ts`) reads only
 * `enum` declarations named `*DataAttributes` or `*CssVars`. Anything else in
 * these files is invisible to it, so its `DataAttrsTable` renders empty.
 * Which files the rule applies to is set in `.oxlintrc.json`; a file whose name
 * doesn't say which kind it is gets reported rather than skipped.
 */
import { findImport, findTopLevelBinding } from './ast.mjs'

const kinds = [
  {
    file: /\.data-(attrs|attributes)\.ts$/,
    name: /(DataAttributes|DataAttrs)$/,
    suffix: 'DataAttributes',
    section: 'Data Attributes File',
  },
  {
    file: /\.css-vars\.ts$/,
    name: /(CssVars|CSSVars)$/,
    suffix: 'CssVars',
    section: 'CSS Variables File',
  },
]

/** Whether an import path points at a file this rule checks. */
const isEnumFile = (source) =>
  kinds.some(({ file }) => file.test(source.replace(/\.js$/, '.ts')))

/** How to name what a data-attribute file exports instead of an enum. */
function describe(node) {
  if (
    node?.type === 'VariableDeclaration' ||
    node?.type === 'VariableDeclarator'
  ) {
    return 'a variable (an `as const` object?)'
  }
  return node
    ? 'something other than an enum'
    : 'a type, or a name this file never declares'
}

export const dataAttrsEnum = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Data-attribute and CSS-variable files export only enums the docs can read.',
    },
  },
  create(context) {
    const kind = kinds.find(({ file }) => file.test(context.filename))
    if (!kind) {
      return {
        Program(program) {
          context.report({
            node: program,
            message:
              "Can't tell whether this is a data-attribute or CSS-variable file: name it `<part>.data-attrs.ts` or `<part>.css-vars.ts`, or remove it from `bazza/data-attrs-enum` in `.oxlintrc.json`.",
          })
        },
      }
    }
    let program
    const tail = `The docs type tables only read \`enum\` declarations named \`*${kind.suffix}\`, so anything else here shows up empty on the docs site. See "${kind.section}" in packages/react/AGENTS.md.`
    const checkName = (node, name) => {
      if (kind.name.test(name)) return
      context.report({
        node,
        message: `\`${name}\` should end in \`${kind.suffix}\`. ${tail}`,
      })
    }
    const cantTell = (node, name, source) =>
      context.report({
        node,
        message: `Can't tell whether \`${name}\` is an enum: \`${source}\` isn't a data-attribute or CSS-variable file, so nothing checks it. Declare the enum here, or in a \`<part>.data-attrs.ts\` file you re-export from. ${tail}`,
      })
    const notAnEnum = (node, what) =>
      context.report({
        node,
        message: `Only enums belong in a ${kind.suffix} file; this exports ${what}. Convert it to \`export enum\`. ${tail}`,
      })
    return {
      Program(node) {
        program = node
      },
      ExportDefaultDeclaration(node) {
        context.report({
          node,
          message: `Default export in a ${kind.suffix} file. Export a named \`enum\`. ${tail}`,
        })
      },
      ExportAllDeclaration(node) {
        context.report({
          node,
          message: `\`export *\` in a ${kind.suffix} file. Re-export each enum by name. ${tail}`,
        })
      },
      ExportNamedDeclaration(node) {
        const { declaration } = node
        if (!declaration) {
          for (const specifier of node.specifiers) {
            const name = specifier.exported.name ?? specifier.exported.value
            checkName(specifier.exported, name)
            // An enum from another data-attribute or CSS-variable file is
            // checked when that file is linted, unless that file is on this
            // rule's allowlist. From anywhere else, it can't be checked.
            const imported = node.source
              ? { source: node.source.value }
              : findImport(program, specifier.local.name)
            if (imported) {
              if (!isEnumFile(imported.source)) {
                cantTell(specifier, name, imported.source)
              }
              continue
            }
            const binding = findTopLevelBinding(program, specifier.local.name)
            if (binding?.type !== 'TSEnumDeclaration') {
              notAnEnum(specifier, describe(binding))
            }
          }
          return
        }
        if (declaration.type === 'TSEnumDeclaration') {
          checkName(declaration.id, declaration.id.name)
          return
        }
        notAnEnum(declaration, describe(declaration))
      },
    }
  },
}
