import fs from 'node:fs'
import path from 'node:path'
import prettier from 'prettier'
import ts from 'typescript'
import type { TypeExpansionConfig } from './type-extraction.config'
import { defaultConfig, shouldExpandType } from './type-extraction.config'

/** ---------- CLI parsing (typed) ---------- */

type PkgArg = { name: string; entry: string }

interface Args {
  out: string
  tsconfig?: string
  packages: PkgArg[]
  config?: TypeExpansionConfig
}

function parseArgs(argv: string[]): Args {
  const getOnce = (k: string): string | undefined => {
    const i = argv.indexOf(`--${k}`)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const getMany = (k: string): string[] => {
    const out: string[] = []
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === `--${k}` && argv[i + 1]) out.push(argv[i + 1]!)
    }
    return out
  }

  const out = getOnce('out') ?? '.types/types-meta.json'
  const tsconfig = getOnce('tsconfig')
  const pkgSpecs = getMany('pkg')

  if (pkgSpecs.length === 0) {
    throw new Error('Pass at least one --pkg "name=path/to/entry.ts"')
  }

  const packages: PkgArg[] = pkgSpecs.map((spec) => {
    const eq = spec.indexOf('=')
    if (eq === -1)
      throw new Error(`Invalid --pkg "${spec}" (expected "name=path")`)
    const name = spec.slice(0, eq).trim()
    const entry = path.resolve(process.cwd(), spec.slice(eq + 1).trim())
    return { name, entry }
  })

  // Use default config for now (can be extended to load from file)
  const config = defaultConfig

  return { out, tsconfig, packages, config }
}

/** ---------- Output shapes (typed) ---------- */

export type PropMeta = {
  name: string
  type: string
  /** Short display type (e.g., "Align" for a union type alias) */
  shortType?: string
  /** Prettier-formatted version of the type (for complex types) */
  formattedType?: string
  required: boolean
  description?: string
  /** Default value from JSDoc @default tag */
  default?: string
  /** If true, this type has been expanded inline */
  isExpanded?: boolean
  /** Expanded properties if the type was expanded */
  expandedType?: PropMeta[]
  /** Reference path to the type definition (e.g., "@bazza-ui/menu.MenuDef") */
  referencePath?: string
}

/** Metadata for enum members (data attributes, CSS variables, etc.) */
export type EnumMemberMeta = {
  /** The enum member name (e.g., "highlighted") */
  name: string
  /** The enum value (e.g., "data-highlighted" or "--available-width") */
  value: string
  /** Description from JSDoc */
  description?: string
  /** Type annotation from @type JSDoc tag (e.g., "'top' | 'bottom'" for data attributes with values) */
  valueType?: string
}

export type TypeMeta = {
  name: string
  kind: 'interface' | 'typealias' | 'enum'
  /** For enums: 'dataAttributes' | 'cssVars' | 'other' */
  enumCategory?: 'dataAttributes' | 'cssVars' | 'other'
  typeParams?: Array<{ name: string; constraint?: string; default?: string }>
  doc?: string
  props?: PropMeta[] // not present for enums
  definition?: string // not present for enums
  /** Enum members with their values and descriptions */
  members?: EnumMemberMeta[]
}

export type PackageMeta = {
  entrypoint: string
  types: Record<string, TypeMeta>
}

export type MetaOutput = Record<string, PackageMeta>

/** ---------- TS helpers (typed) ---------- */

function isUnionType(t: ts.Type): t is ts.UnionType {
  return (t.flags & ts.TypeFlags.Union) !== 0
}

function isIntersectionType(t: ts.Type): t is ts.IntersectionType {
  return (t.flags & ts.TypeFlags.Intersection) !== 0
}

function isObjectLikeType(t: ts.Type): boolean {
  return (t.flags & ts.TypeFlags.Object) !== 0
}

/**
 * Recursively expand a type to its full form, resolving all type aliases.
 * This handles nested type references like `Align | 'list-start'` where
 * `Align` should be expanded to `'start' | 'center' | 'end'`.
 */
function expandTypeRecursively(
  type: ts.Type,
  checker: ts.TypeChecker,
  visited: Set<ts.Type> = new Set(),
  filterUndefined = true,
): string {
  // Prevent infinite recursion
  if (visited.has(type)) {
    return checker.typeToString(type)
  }
  visited.add(type)

  // Handle union types - expand each member
  if (isUnionType(type)) {
    const expandedParts: string[] = []
    for (const memberType of type.types) {
      // Filter out 'undefined' from unions (we show this via the Optional badge instead)
      if (filterUndefined && memberType.flags & ts.TypeFlags.Undefined) {
        continue
      }
      const expanded = expandTypeRecursively(
        memberType,
        checker,
        visited,
        filterUndefined,
      )
      // If the member itself expands to a union, we should include its parts individually
      // to avoid nested parentheses like `('start' | 'center' | 'end') | 'list-start'`
      if (isUnionType(memberType) && !memberType.aliasSymbol) {
        expandedParts.push(expanded)
      } else {
        expandedParts.push(expanded)
      }
    }
    // Deduplicate and join
    const uniqueParts = [...new Set(expandedParts)]
    return uniqueParts.join(' | ')
  }

  // Handle intersection types
  if (isIntersectionType(type)) {
    const parts = type.types.map((t) =>
      expandTypeRecursively(t, checker, visited),
    )
    return parts.join(' & ')
  }

  // Handle type aliases - try to get the underlying type
  const symbol = type.getSymbol() ?? type.aliasSymbol
  if (symbol) {
    const declarations = symbol.getDeclarations()
    if (declarations && declarations.length > 0) {
      const decl = declarations[0]!
      if (isTypeAliasDecl(decl)) {
        // Get the type that the alias points to
        const aliasedType = checker.getTypeFromTypeNode(decl.type)
        // If the aliased type is a union, expand it
        if (isUnionType(aliasedType)) {
          return expandTypeRecursively(aliasedType, checker, visited)
        }
      }
    }
  }

  // For literal types and primitives, just use typeToString
  return checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)
}

/**
 * Check if a type is a type alias (not a primitive, object, or anonymous type)
 * and return its expanded form if so.
 */
function expandTypeAlias(
  type: ts.Type,
  checker: ts.TypeChecker,
): string | null {
  // Check if this is an alias (type reference to a type alias)
  const aliasSymbol = type.aliasSymbol
  if (!aliasSymbol) {
    // Even without an alias symbol, unions should be expanded
    if (isUnionType(type)) {
      const expanded = expandTypeRecursively(type, checker)
      const simple = checker.typeToString(type)
      return expanded !== simple ? expanded : null
    }
    return null
  }

  // Try recursive expansion first
  const expandedType = expandTypeRecursively(type, checker)
  const aliasName = aliasSymbol.getName()

  // If the expanded type is different from just the alias name, return it
  if (expandedType !== aliasName) {
    return expandedType
  }

  // Fallback: Use typeToString with NoTruncation
  const fallbackExpanded = checker.typeToString(
    type,
    undefined,
    ts.TypeFormatFlags.NoTruncation |
      ts.TypeFormatFlags.InTypeAlias |
      ts.TypeFormatFlags.WriteTypeArgumentsOfSignature,
  )

  return fallbackExpanded !== aliasName ? fallbackExpanded : null
}

/** Collect properties only from object(-like) types. Flattens intersections. */
async function collectObjectProps(
  t: ts.Type,
  checker: ts.TypeChecker,
  ctx?: TypeExpansionContext,
): Promise<PropMeta[]> {
  const seen = new Map<string, ts.Symbol>()

  const addProps = (tt: ts.Type) => {
    if (!isObjectLikeType(tt)) return
    for (const s of checker.getPropertiesOfType(tt)) {
      seen.set(s.getName(), s)
    }
  }

  if (isIntersectionType(t)) {
    for (const part of t.types) addProps(part)
  } else if (!isUnionType(t)) {
    // unions are skipped (e.g., 'a' | 'b'); object unions aren't summarized here
    addProps(t)
  }

  // Filter out inherited HTML/React props unless they have custom documentation
  const filteredSymbols = [...seen.values()].filter((sym) =>
    shouldIncludeProp(sym, checker),
  )

  // If context is provided, use it for type expansion
  if (ctx) {
    return await Promise.all(filteredSymbols.map((sym) => propMeta(sym, ctx)))
  }

  // Fallback for backward compatibility (shouldn't happen in practice)
  return filteredSymbols.map((sym) => {
    const decl = (sym.valueDeclaration ?? sym.declarations?.[0]) as
      | ts.Declaration
      | undefined

    // If no valid declaration node exists, fall back to getTypeOfSymbol
    if (!decl) {
      const type = checker.getTypeOfSymbol(sym)
      return {
        name: sym.getName(),
        type: checker.typeToString(type),
        required: true,
        description: getSymbolDoc(sym, checker),
        default: getSymbolDefaultValue(sym),
      }
    }

    const type = checker.getTypeOfSymbolAtLocation(sym, decl)
    const required = ts.isPropertySignature(decl)
      ? !decl.questionToken
      : ts.isPropertyDeclaration(decl)
        ? !decl.questionToken
        : true

    return {
      name: sym.getName(),
      type: checker.typeToString(type),
      required,
      description: getSymbolDoc(sym, checker),
      default: getSymbolDefaultValue(sym),
    }
  })
}

function loadCompilerOptions(tsconfigPath?: string): ts.CompilerOptions {
  if (!tsconfigPath) return { skipLibCheck: true, strict: false }
  const cfg = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  if (cfg.error)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext([cfg.error], formatHost),
    )
  const parsed = ts.parseJsonConfigFileContent(
    cfg.config,
    ts.sys,
    path.dirname(tsconfigPath),
  )
  return parsed.options
}

function sanitizeForAnalysis(options: ts.CompilerOptions): ts.CompilerOptions {
  // We don't emit; ensure JSX + DOM + React types are available and resolution works with .js -> .tsx re-exports.
  const merged: ts.CompilerOptions = {
    ...options,
    noEmit: true,
    skipLibCheck: true,
    jsx: options.jsx ?? ts.JsxEmit.ReactJSX,
    jsxImportSource: options.jsxImportSource ?? 'react',
    lib: options.lib ?? ['ES2021', 'DOM'],
    types: Array.from(
      new Set([...(options.types ?? []), 'node', 'react', 'react-dom']),
    ),
    moduleResolution:
      options.moduleResolution ?? ts.ModuleResolutionKind.Bundler,
  }
  // Remove build-only flags that cause diagnostics in analysis mode
  delete (merged as any).incremental
  delete (merged as any).tsBuildInfoFile
  delete (merged as any).composite
  return merged
}

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (f) => f,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => '\n',
}

const isInterfaceDecl = (n: ts.Node): n is ts.InterfaceDeclaration =>
  n.kind === ts.SyntaxKind.InterfaceDeclaration
const isTypeAliasDecl = (n: ts.Node): n is ts.TypeAliasDeclaration =>
  n.kind === ts.SyntaxKind.TypeAliasDeclaration
const isEnumDecl = (n: ts.Node): n is ts.EnumDeclaration =>
  n.kind === ts.SyntaxKind.EnumDeclaration

function kindOfDecl(
  d: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration,
): TypeMeta['kind'] {
  if (isInterfaceDecl(d)) return 'interface'
  if (isTypeAliasDecl(d)) return 'typealias'
  return 'enum'
}

const printer = ts.createPrinter({ removeComments: false })
function nodeText(node: ts.Node): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile())
}

function getSymbolDoc(
  sym: ts.Symbol,
  checker: ts.TypeChecker,
): string | undefined {
  const txt = ts
    .displayPartsToString(sym.getDocumentationComment(checker))
    .trim()
  return txt || undefined
}

/**
 * Extract @default value from JSDoc tags
 */
function getSymbolDefaultValue(sym: ts.Symbol): string | undefined {
  const tags = sym.getJsDocTags()
  const defaultTag = tags.find((tag) => tag.name === 'default')
  if (!defaultTag) return undefined

  // Get the text of the default tag
  const text = defaultTag.text
    ? ts.displayPartsToString(
        Array.isArray(defaultTag.text) ? defaultTag.text : [defaultTag.text],
      )
    : undefined

  return text?.trim() || undefined
}

/**
 * Extract @type value from JSDoc tags (used for data attribute value types)
 */
function getSymbolTypeTag(sym: ts.Symbol): string | undefined {
  const tags = sym.getJsDocTags()
  const typeTag = tags.find((tag) => tag.name === 'type')
  if (!typeTag) return undefined

  const text = typeTag.text
    ? ts.displayPartsToString(
        Array.isArray(typeTag.text) ? typeTag.text : [typeTag.text],
      )
    : undefined

  return text?.trim() || undefined
}

/**
 * Check if a symbol has the @ignore JSDoc tag
 */
function hasIgnoreTag(sym: ts.Symbol): boolean {
  const tags = sym.getJsDocTags()
  return tags.some((tag) => tag.name === 'ignore')
}

/**
 * Check if a declaration comes from a library file (node_modules or @types)
 */
function isFromLibrary(decl: ts.Declaration | undefined): boolean {
  if (!decl) return false
  const sourceFile = decl.getSourceFile()
  const fileName = sourceFile.fileName
  return (
    fileName.includes('node_modules') ||
    fileName.includes('/lib.') || // TypeScript lib files
    fileName.includes('\\lib.') // Windows path
  )
}

/**
 * Props that should ALWAYS be included in documentation, even if from library files.
 * These are core API props that users need to see.
 * Note: `children` is NOT included here - it only shows when custom (e.g., render function)
 */
const ALWAYS_INCLUDE_PROPS = new Set(['render', 'className', 'style'])

/**
 * Props that should ALWAYS be hidden from documentation.
 * These are internal implementation details or rarely used props.
 */
const ALWAYS_HIDE_PROPS = new Set(['virtualAnchor'])

/**
 * Common HTML/React/ARIA props that should be filtered out unless customized.
 * These are inherited from HTML element types and don't need documentation.
 */
const NATIVE_PROPS_TO_FILTER = new Set([
  // React internal
  'key',
  'ref',
  // Common HTML attributes (covered by native HTML docs)
  'id',
  'hidden',
  'title',
  'lang',
  'dir',
  'tabIndex',
  'accessKey',
  'draggable',
  'contentEditable',
  'spellCheck',
  'autoCapitalize',
  'autoCorrect',
  'autoFocus',
  'inputMode',
  'enterKeyHint',
  'is',
  'slot',
  'translate',
  'inert',
  'popover',
  'popoverTarget',
  'popoverTargetAction',
  // Form-related
  'form',
  'name',
  'value',
  'defaultValue',
  'defaultChecked',
  'disabled',
  'readOnly',
  'required',
  'placeholder',
  'autoComplete',
  'type',
  // Event handlers (too many to list - filter by prefix)
  // ... handled separately below
])

/**
 * Check if a prop name is a native HTML/React event handler
 */
function isNativeEventHandler(name: string): boolean {
  // React event handlers like onClick, onFocus, onKeyDown, etc.
  if (name.startsWith('on') && name.length > 2) {
    const thirdChar = name[2]
    if (thirdChar && thirdChar === thirdChar.toUpperCase()) {
      return true
    }
  }
  return false
}

/**
 * Check if a prop name is an ARIA attribute
 */
function isAriaAttribute(name: string): boolean {
  return name.startsWith('aria-')
}

/**
 * Check if a prop name is a data attribute
 */
function isDataAttribute(name: string): boolean {
  return name.startsWith('data-')
}

/**
 * Check if a prop should be included in documentation.
 * Excludes inherited HTML/React props.
 */
function shouldIncludeProp(sym: ts.Symbol, checker: ts.TypeChecker): boolean {
  // Always skip props marked with @ignore
  if (hasIgnoreTag(sym)) {
    return false
  }

  const name = sym.getName()
  const decl = sym.valueDeclaration ?? sym.declarations?.[0]

  // Always include core API props (render, className, style, children)
  if (ALWAYS_INCLUDE_PROPS.has(name)) {
    return true
  }

  // Always hide internal/implementation props
  if (ALWAYS_HIDE_PROPS.has(name)) {
    return false
  }

  // Check if this is a native prop that we should always filter
  const isInNativeSet = NATIVE_PROPS_TO_FILTER.has(name)
  const isEventHandler = isNativeEventHandler(name)
  const isAria = isAriaAttribute(name)
  const isData = isDataAttribute(name)

  // Always filter out ARIA and data attributes - they're HTML standard
  if (isAria || isData) {
    return false
  }

  // For event handlers (on*), only filter if from library files
  // This keeps custom callbacks like onOpenChange, onHighlightChange while
  // filtering native handlers like onClick, onFocus from React types
  if (isEventHandler) {
    return !isFromLibrary(decl)
  }

  // For other native props, filter if declared in a library file
  if (isInNativeSet) {
    // Only include if it's declared in our source files (not inherited from React types)
    return !isFromLibrary(decl)
  }

  // If prop is declared in a library file, skip it
  if (isFromLibrary(decl)) {
    return false
  }

  // Props from our source files are included
  return true
}

/**
 * Determine the enum category based on its name
 */
function getEnumCategory(
  enumName: string,
): 'dataAttributes' | 'cssVars' | 'other' {
  if (enumName.endsWith('DataAttributes') || enumName.endsWith('DataAttrs')) {
    return 'dataAttributes'
  }
  if (enumName.endsWith('CssVars') || enumName.endsWith('CSSVars')) {
    return 'cssVars'
  }
  return 'other'
}

/**
 * Extract enum members with their values and JSDoc
 */
function extractEnumMembers(
  enumDecl: ts.EnumDeclaration,
  checker: ts.TypeChecker,
): EnumMemberMeta[] {
  const members: EnumMemberMeta[] = []

  for (const member of enumDecl.members) {
    const memberName = member.name.getText()
    const memberSym = checker.getSymbolAtLocation(member.name)

    // Get the enum member value
    let value: string | undefined
    if (member.initializer) {
      // If there's an explicit initializer, use it
      if (ts.isStringLiteral(member.initializer)) {
        value = member.initializer.text
      } else {
        value = member.initializer.getText()
      }
    }

    if (!value) continue // Skip members without explicit string values

    const description = memberSym ? getSymbolDoc(memberSym, checker) : undefined
    const valueType = memberSym ? getSymbolTypeTag(memberSym) : undefined

    members.push({
      name: memberName,
      value,
      description,
      valueType,
    })
  }

  return members
}

/**
 * Component prefixes for namespace conversion.
 * Maps internal prefixes to their namespace form.
 */
const COMPONENT_PREFIXES = [
  'PopupMenu',
  'DropdownMenu',
  'ContextMenu',
  'Select',
  'Combobox',
] as const

/**
 * Component parts that follow the prefix (e.g., Item, Trigger, Surface).
 * These get converted to dot notation.
 */
const COMPONENT_PARTS = [
  'Arrow',
  'Backdrop',
  'CheckboxItem',
  'CheckboxItemIndicator',
  'Clear',
  'Empty',
  'Group',
  'GroupLabel',
  'Icon',
  'Input',
  'InputWrapper',
  'Item',
  'ItemIndicator',
  'ItemLabel',
  'List',
  'Popup',
  'Portal',
  'Positioner',
  'RadioGroup',
  'RadioGroupValue',
  'RadioItem',
  'RadioItemIndicator',
  'Root',
  'ScrollArrow',
  'ScrollDownArrow',
  'ScrollUpArrow',
  'Separator',
  'Shortcut',
  'SubmenuRoot',
  'SubmenuTrigger',
  'SubmenuTriggerIndicator',
  'Surface',
  'Trigger',
  'Value',
] as const

/**
 * Type suffixes that get converted to namespace form.
 */
const TYPE_SUFFIXES = ['State', 'Props', 'ChildrenState'] as const

/**
 * Convert internal type names to namespaced form.
 * e.g., PopupMenuItemState → PopupMenu.Item.State
 */
function convertToNamespacedType(typeStr: string): string {
  let result = typeStr

  // Build regex patterns for each prefix
  for (const prefix of COMPONENT_PREFIXES) {
    for (const part of COMPONENT_PARTS) {
      for (const suffix of TYPE_SUFFIXES) {
        // Match the full type name (e.g., PopupMenuItemState)
        const fullTypeName = `${prefix}${part}${suffix}`
        // Convert to namespace form (e.g., PopupMenu.Item.State)
        const namespacedForm = `${prefix}.${part}.${suffix}`

        // Use word boundary to avoid partial matches
        const regex = new RegExp(`\\b${fullTypeName}\\b`, 'g')
        result = result.replace(regex, namespacedForm)
      }
    }
  }

  return result
}

/**
 * Clean up a type string for better readability in documentation.
 * This simplifies complex React types and expands known type aliases.
 *
 * Transformations:
 * - ReactElement<unknown, string | JSXElementConstructor<any>> → ReactElement
 * - ComponentRenderFn<Props, State> → ((props: Props, state: State) => ReactElement)
 * - Remove trailing "| undefined" (shown via "Optional" badge instead)
 * - PopupMenuItemState → PopupMenu.Item.State (namespace form)
 */
function cleanDetailedType(typeStr: string): string {
  let result = typeStr

  // Remove trailing "| undefined" - we show "Optional" badge instead
  result = result.replace(/\s*\|\s*undefined\s*$/, '')

  // Simplify ReactElement<unknown, string | JSXElementConstructor<any>> to ReactElement
  // This pattern appears in render prop types
  result = result.replace(
    /ReactElement<\s*unknown\s*,\s*string\s*\|\s*JSXElementConstructor<any>\s*>/g,
    'ReactElement',
  )

  // Also handle React.ReactElement variant
  result = result.replace(
    /React\.ReactElement<\s*unknown\s*,\s*string\s*\|\s*JSXElementConstructor<any>\s*>/g,
    'ReactElement',
  )

  // Expand ComponentRenderFn<Props, State> to ((props: Props, state: State) => ReactElement)
  // Need to handle nested angle brackets properly
  result = result.replace(
    /ComponentRenderFn<([^<>]+(?:<[^<>]*>)?),\s*([^<>]+(?:<[^<>]*>)?)>/g,
    '((props: $1, state: $2) => ReactElement)',
  )

  // Simplify HTMLProps<any> to HTMLProps
  result = result.replace(/HTMLProps<any>/g, 'HTMLProps')

  // Convert internal type names to namespaced form
  result = convertToNamespacedType(result)

  // Clean up any double spaces
  result = result.replace(/\s{2,}/g, ' ')

  return result.trim()
}

/**
 * Format a TypeScript type string using Prettier
 */
async function formatTypeString(typeStr: string): Promise<string | undefined> {
  // First, clean up the type for better readability
  const cleanedType = cleanDetailedType(typeStr)

  // Skip formatting for simple types
  if (
    cleanedType.length < 50 &&
    !cleanedType.includes('{') &&
    !cleanedType.includes('(')
  ) {
    // Still return the cleaned type if it's different from original
    return cleanedType !== typeStr ? cleanedType : undefined
  }

  // Skip types with truncation markers (...) as they're not valid TypeScript
  if (cleanedType.includes('...')) {
    return cleanedType !== typeStr ? cleanedType : undefined
  }

  try {
    // Wrap the type in a declaration to make it valid TypeScript
    const wrappedType = `type FormattedType = ${cleanedType}`

    // Format using prettier (async in Prettier 3.x)
    const formatted = await prettier.format(wrappedType, {
      parser: 'typescript',
      printWidth: 60,
      semi: false,
      singleQuote: true,
      trailingComma: 'all',
      tabWidth: 2,
    })

    // Extract just the type definition
    // Handle both single-line and multi-line formatted output
    const typeDeclarationPrefix = 'type FormattedType ='
    let result = formatted.trim()

    if (result.startsWith(typeDeclarationPrefix)) {
      // Remove the "type FormattedType =" prefix
      result = result.slice(typeDeclarationPrefix.length).trim()
    }

    // Only return if it's actually different from the original
    return result !== typeStr ? result : undefined
  } catch (error) {
    // If formatting fails, return the cleaned type if different
    if (process.env.DEBUG_TYPES) {
      console.warn('Failed to format type:', cleanedType, error)
    }
    return cleanedType !== typeStr ? cleanedType : undefined
  }
}

function typeParamsMeta(
  node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
): Array<{ name: string; constraint?: string; default?: string }> | undefined {
  const tps =
    node.typeParameters?.map((tp) => ({
      name: tp.name.getText(),
      constraint: tp.constraint ? nodeText(tp.constraint) : undefined,
      default: tp.default ? nodeText(tp.default) : undefined,
    })) ?? []
  return tps.length ? tps : undefined
}

interface TypeExpansionContext {
  checker: ts.TypeChecker
  config: TypeExpansionConfig
  currentDepth: number
  allTypes: Map<string, TypeMeta> // All documented types for reference lookup
  currentPackage: string
  /** Map of type parameter names to their constraints (e.g., "TColumns" -> "ReadonlyArray<...>") */
  typeParamConstraints?: Map<string, string>
}

/**
 * Extract the base type name from a type string
 * e.g., "MenuDef<T>" -> "MenuDef", "Array<string>" -> "Array"
 */
function extractBaseTypeName(typeStr: string): string {
  const match = typeStr.match(/^([a-zA-Z_$][a-zA-Z0-9_$.]*)/)
  return match?.[1] ?? typeStr
}

/**
 * Resolve a type string by replacing generic type parameters with their constraints.
 * e.g., if TColumns extends ReadonlyArray<ColumnConfig<TData>>, then "TColumns" -> "ReadonlyArray<ColumnConfig<TData>>"
 *
 * Also handles types that use generics, e.g., "Partial<Record<OptionColumnIds<TColumns>, ...>>"
 * will have TColumns resolved within it.
 */
function resolveTypeWithConstraints(
  typeStr: string,
  typeParamConstraints?: Map<string, string>,
): string {
  if (!typeParamConstraints || typeParamConstraints.size === 0) {
    return typeStr
  }

  // Check if the entire type is just a generic parameter
  const trimmed = typeStr.trim()
  if (typeParamConstraints.has(trimmed)) {
    return typeParamConstraints.get(trimmed)!
  }

  // For more complex types, we could do regex replacement,
  // but that risks breaking valid type syntax. For now, only
  // resolve when the entire type is a single generic parameter.
  // Future enhancement: parse and transform the type AST.

  return typeStr
}

async function propMeta(
  propSym: ts.Symbol,
  ctx: TypeExpansionContext,
): Promise<PropMeta> {
  const { checker, config, currentDepth, allTypes, currentPackage } = ctx
  const decl = (propSym.valueDeclaration ?? propSym.declarations?.[0]) as
    | ts.Declaration
    | undefined

  // If no valid declaration node exists, fall back to getTypeOfSymbol
  // (can happen with synthetic properties from mapped types, etc.)
  if (!decl) {
    const type = checker.getTypeOfSymbol(propSym)
    const rawTypeStr = checker.typeToString(type)
    const typeStr = resolveTypeWithConstraints(
      rawTypeStr,
      ctx.typeParamConstraints,
    )
    return {
      name: propSym.getName(),
      type: typeStr,
      required: true,
      description: getSymbolDoc(propSym, checker),
      default: getSymbolDefaultValue(propSym),
    }
  }

  const type = checker.getTypeOfSymbolAtLocation(propSym, decl)
  const required = ts.isPropertySignature(decl)
    ? !decl.questionToken
    : ts.isPropertyDeclaration(decl)
      ? !decl.questionToken
      : true

  const rawTypeStr = checker.typeToString(type)
  // Resolve generic type parameters to their constraints for better documentation
  const typeStr = resolveTypeWithConstraints(
    rawTypeStr,
    ctx.typeParamConstraints,
  )
  const baseTypeName = extractBaseTypeName(typeStr)
  const description = getSymbolDoc(propSym, checker)
  const defaultValue = getSymbolDefaultValue(propSym)

  // Well-known types that shouldn't be expanded (everyone knows what they are)
  const SKIP_EXPANSION_TYPES = new Set([
    'ReactNode',
    'ReactElement',
    'CSSProperties',
    'HTMLAttributes',
    'RefObject',
    'MutableRefObject',
  ])

  // Check if the type is a well-known type that shouldn't be expanded
  const shouldSkipExpansion =
    SKIP_EXPANSION_TYPES.has(typeStr) ||
    SKIP_EXPANSION_TYPES.has(typeStr.replace(/ \| undefined$/, ''))

  // Try to expand type aliases to show their full definition
  const expandedTypeStr = shouldSkipExpansion
    ? null
    : expandTypeAlias(type, checker)
  // Use expanded type for formatting if available, otherwise use the type string
  const typeToFormat = expandedTypeStr ?? typeStr
  // Format the type for display
  let formattedType = shouldSkipExpansion
    ? undefined
    : await formatTypeString(typeToFormat)
  // If we have an expanded type that's different from the original,
  // always include it even if formatTypeString didn't change it
  if (!formattedType && expandedTypeStr && expandedTypeStr !== typeStr) {
    formattedType = cleanDetailedType(expandedTypeStr)
  }

  // Extract short type name from type alias (e.g., "Align" from PopupMenuPositionerAlign)
  // This is used for display in the collapsed type column
  let shortType: string | undefined
  const aliasSymbol = type.aliasSymbol
  if (aliasSymbol) {
    const aliasName = aliasSymbol.getName()
    // Extract the last part of the type name (e.g., "Align" from "PopupMenuPositionerAlign")
    // Look for common suffixes like Align, Side, etc.
    const suffixMatch = aliasName.match(
      /(Align|Side|Placement|Position|Size|Variant|Direction|Orientation|Mode|Status|State)$/,
    )
    if (suffixMatch) {
      shortType = suffixMatch[1]
    }
  }

  const meta: PropMeta = {
    name: propSym.getName(),
    type: typeStr,
    shortType,
    formattedType,
    required,
    description,
    default: defaultValue,
  }

  // Check if we should expand this type
  const maxDepth = config.maxDepth ?? 2
  const shouldExpand =
    currentDepth < maxDepth &&
    shouldExpandType(
      baseTypeName,
      undefined, // TODO: detect package name from symbol
      config,
    )

  if (shouldExpand && isObjectLikeType(type)) {
    // Recursively expand the type
    const expandedProps = await collectObjectProps(type, checker, {
      ...ctx,
      currentDepth: currentDepth + 1,
    })

    if (expandedProps.length > 0) {
      meta.isExpanded = true
      meta.expandedType = expandedProps
    }
  }

  // Check if this is a reference to a documented type
  const referencePath = findTypeReference(
    baseTypeName,
    allTypes,
    currentPackage,
  )
  if (referencePath) {
    meta.referencePath = referencePath
  }

  return meta
}

/**
 * Find a reference path for a type in the documented types
 */
function findTypeReference(
  typeName: string,
  allTypes: Map<string, TypeMeta>,
  currentPackage: string,
): string | undefined {
  // Check if this type is documented
  if (allTypes.has(typeName)) {
    return `${currentPackage}.${typeName}`
  }
  return undefined
}

/** Resolve a SourceFile robustly (path normalization). */
function findSourceFile(
  program: ts.Program,
  absPath: string,
): ts.SourceFile | undefined {
  const want = path.normalize(absPath)
  return program
    .getSourceFiles()
    .find((sf) => path.normalize(sf.fileName) === want)
}

/** Resolve re-exported symbols to their real declarations. */
function resolveExport(sym: ts.Symbol, checker: ts.TypeChecker): ts.Symbol {
  return (sym.getFlags() & ts.SymbolFlags.Alias) !== 0
    ? checker.getAliasedSymbol(sym)
    : sym
}

/** ---------- Collector ---------- */

async function collectPackageTypes(
  prog: ts.Program,
  checker: ts.TypeChecker,
  pkg: PkgArg,
  config: TypeExpansionConfig,
): Promise<PackageMeta> {
  const sf = findSourceFile(prog, pkg.entry)
  if (!sf) throw new Error(`Entry not in program: ${pkg.entry}`)
  const moduleSym = checker.getSymbolAtLocation(sf)
  if (!moduleSym) throw new Error(`No module symbol for: ${pkg.entry}`)

  const exportsArr = checker.getExportsOfModule(moduleSym)
  const types: Record<string, TypeMeta> = {}
  const allTypes = new Map<string, TypeMeta>()

  if (process.env.DEBUG_TYPES) {
    console.log(`\n[${pkg.name}] entry: ${pkg.entry}`)
  }

  for (const exp of exportsArr) {
    const target = resolveExport(exp, checker)

    const decls = target.getDeclarations() ?? []
    const decl = decls.find(
      (d) => isInterfaceDecl(d) || isTypeAliasDecl(d) || isEnumDecl(d),
    ) as
      | ts.InterfaceDeclaration
      | ts.TypeAliasDeclaration
      | ts.EnumDeclaration
      | undefined

    if (process.env.DEBUG_TYPES) {
      const kinds = decls.map((d) => ts.SyntaxKind[d.kind]).join(', ')
      console.log(
        ' export',
        exp.getName(),
        exp.getFlags() & ts.SymbolFlags.Alias ? '(alias)' : '',
        '-> decl kinds:',
        kinds || '(none)',
      )
    }

    if (!decl) continue

    const kind = kindOfDecl(decl)
    const typeParams = isEnumDecl(decl) ? undefined : typeParamsMeta(decl)
    const doc = getSymbolDoc(target, checker) || getSymbolDoc(exp, checker)

    const meta: TypeMeta = { name: exp.getName(), kind, typeParams, doc }

    if (isTypeAliasDecl(decl)) {
      meta.definition = nodeText(decl.type) // e.g. "'item' | 'group' | 'submenu'"
    }

    if (kind === 'enum' && isEnumDecl(decl)) {
      // Extract enum members with values and JSDoc
      const members = extractEnumMembers(decl, checker)
      if (members.length > 0) {
        meta.members = members
      }
      // Categorize the enum (dataAttributes, cssVars, or other)
      meta.enumCategory = getEnumCategory(exp.getName())
    } else if (kind !== 'enum') {
      const declaredType = checker.getDeclaredTypeOfSymbol(
        target /* not exp; see alias fix */,
      )

      // Build a map of type parameter names to their constraints
      // e.g., "TColumns" -> "ReadonlyArray<ColumnConfig<TData, any, any, any>>"
      const typeParamConstraints = new Map<string, string>()
      if (!isEnumDecl(decl) && decl.typeParameters) {
        for (const tp of decl.typeParameters) {
          if (tp.constraint) {
            typeParamConstraints.set(tp.name.getText(), nodeText(tp.constraint))
          }
        }
      }

      // Create expansion context
      const ctx: TypeExpansionContext = {
        checker,
        config,
        currentDepth: 0,
        allTypes,
        currentPackage: pkg.name,
        typeParamConstraints:
          typeParamConstraints.size > 0 ? typeParamConstraints : undefined,
      }

      const props = await collectObjectProps(declaredType, checker, ctx)
      if (props.length) meta.props = props
    }

    types[meta.name] = meta
    allTypes.set(meta.name, meta)
  }

  return { entrypoint: path.relative(process.cwd(), pkg.entry), types }
}

/** ---------- Main ---------- */

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const rawOptions = loadCompilerOptions(args.tsconfig)
  const options = sanitizeForAnalysis(rawOptions)
  const rootNames = args.packages.map((p) => p.entry)
  const program = ts.createProgram({ rootNames, options })
  const checker = program.getTypeChecker()

  if (process.env.DEBUG_TYPES) {
    console.log(
      'Program files:\n' +
        program
          .getSourceFiles()
          .map((sf) => ' - ' + sf.fileName)
          .join('\n'),
    )
  }

  // Trigger type checking so diagnostics surface early
  const diagnostics = ts.getPreEmitDiagnostics(program)
  if (diagnostics.length) {
    console.warn(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
    )
  }

  const output: MetaOutput = {}
  for (const pkg of args.packages) {
    const meta = await collectPackageTypes(
      program,
      checker,
      pkg,
      args.config ?? defaultConfig,
    )
    if (process.env.DEBUG_TYPES && Object.keys(meta.types).length === 0) {
      console.warn(`[warn] No exported types found for ${pkg.name}`)
    }
    output[pkg.name] = meta
  }

  fs.mkdirSync(path.dirname(args.out), { recursive: true })
  fs.writeFileSync(args.out, JSON.stringify(output, null, 2))
  console.log(`[types:meta] wrote ${args.out}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
