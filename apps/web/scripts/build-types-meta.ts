import fs from 'node:fs'
import path from 'node:path'
import prettier from 'prettier'
import {
  type EnumDeclaration,
  type InterfaceDeclaration,
  isEnumDeclaration,
  isInterfaceDeclaration,
  isPropertyDeclaration,
  isPropertySignatureDeclaration,
  isStringLiteral,
  isTypeAliasDeclaration,
  type Node,
  SyntaxKind,
  type TypeAliasDeclaration,
} from 'typescript/unstable/ast'
import {
  API,
  type Checker,
  type Diagnostic,
  DiagnosticCategory,
  isIntersectionType,
  isObjectType,
  isTypeReference,
  isUnionType,
  type Program,
  SymbolFlags,
  type Symbol as TsSymbol,
  type Type,
  TypeFlags,
} from 'typescript/unstable/sync'
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

/**
 * `typeToString` flags. TypeScript 7's API takes the numeric flags but does
 * not export the `TypeFormatFlags` enum; the values match TypeScript 5's.
 */
const TypeFormatFlags = {
  NoTruncation: 1 << 0,
  WriteTypeArgumentsOfSignature: 1 << 5,
  InTypeAlias: 1 << 23,
} as const

/** Resolve a symbol's declaration handles to AST nodes. */
function declarationsOf(sym: TsSymbol): Node[] {
  return sym.declarations
    .map((handle) => handle.resolve())
    .filter((node): node is Node => node !== undefined)
}

/** The value declaration if present, otherwise the first declaration. */
function primaryDeclaration(sym: TsSymbol): Node | undefined {
  return (sym.valueDeclaration ?? sym.declarations[0])?.resolve()
}

/**
 * `typeToString` of a symbol's type. TypeScript 7's `getTypeOfSymbol` can
 * return nothing, which TypeScript 5's never did; say so instead of hiding it.
 */
function typeTextOfSymbol(sym: TsSymbol, checker: Checker): string {
  const type = checker.getTypeOfSymbol(sym)
  if (type) return checker.typeToString(type)
  console.warn(`[types:meta] could not resolve the type of \`${sym.name}\``)
  return 'unknown'
}

/** Whether a property signature or declaration is written as optional (`name?:`). */
function isOptionalMember(decl: Node): boolean {
  if (isPropertySignatureDeclaration(decl) || isPropertyDeclaration(decl)) {
    return decl.postfixToken?.kind === SyntaxKind.QuestionToken
  }
  return false
}

/**
 * Recursively expand a type to its full form, resolving all type aliases.
 * This handles nested type references like `Align | 'list-start'` where
 * `Align` should be expanded to `'start' | 'center' | 'end'`.
 */
function expandTypeRecursively(
  type: Type,
  checker: Checker,
  visited: Set<number> = new Set(),
  filterUndefined = true,
): string {
  // Prevent infinite recursion (type objects are proxies; compare by id)
  if (visited.has(type.id)) {
    return checker.typeToString(type)
  }
  visited.add(type.id)

  // Handle union types - expand each member
  if (isUnionType(type)) {
    const expandedParts: string[] = []
    for (const memberType of type.getTypes()) {
      // Filter out 'undefined' from unions (we show this via the Optional badge instead)
      if (filterUndefined && memberType.flags & TypeFlags.Undefined) {
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
      if (isUnionType(memberType) && !memberType.getAliasSymbol()) {
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
    const parts = type
      .getTypes()
      .map((t) => expandTypeRecursively(t, checker, visited))
    return parts.join(' & ')
  }

  // Handle type aliases - try to get the underlying type
  const symbol = type.getSymbol() ?? type.getAliasSymbol()
  if (symbol) {
    const decl = declarationsOf(symbol)[0]
    if (decl && isTypeAliasDeclaration(decl)) {
      // Get the type that the alias points to
      const aliasedType = checker.getTypeFromTypeNode(decl.type)
      // If the aliased type is a union, expand it
      if (aliasedType && isUnionType(aliasedType)) {
        return expandTypeRecursively(aliasedType, checker, visited)
      }
    }
  }

  // For literal types and primitives, just use typeToString
  return checker.typeToString(type, undefined, TypeFormatFlags.NoTruncation)
}

/**
 * Check if a type is a type alias (not a primitive, object, or anonymous type)
 * and return its expanded form if so.
 */
function expandTypeAlias(type: Type, checker: Checker): string | null {
  // Check if this is an alias (type reference to a type alias)
  const aliasSymbol = type.getAliasSymbol()
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
  const aliasName = aliasSymbol.name

  // If the expanded type is different from just the alias name, return it
  if (expandedType !== aliasName) {
    return expandedType
  }

  // Fallback: Use typeToString with NoTruncation
  const fallbackExpanded = checker.typeToString(
    type,
    undefined,
    TypeFormatFlags.NoTruncation |
      TypeFormatFlags.InTypeAlias |
      TypeFormatFlags.WriteTypeArgumentsOfSignature,
  )

  return fallbackExpanded !== aliasName ? fallbackExpanded : null
}

/**
 * Property names of `t` in declaration order: an interface's own members in
 * source order, then each base type's in `extends` order; an intersection's
 * parts one after another. TypeScript 5's checker returned properties in this
 * order; TypeScript 7's does not (it lists inherited members first), and the
 * docs tables render props in array order.
 */
function propertyOrder(
  t: Type,
  checker: Checker,
  seen: Set<number> = new Set(),
): string[] {
  if (seen.has(t.id)) return []
  seen.add(t.id)
  const names: string[] = []
  const add = (list: readonly string[]) => {
    for (const n of list) if (!names.includes(n)) names.push(n)
  }
  // A generic interface instantiation (`Props<X>`) orders like its interface.
  const iface = t.isClassOrInterface()
    ? t
    : isTypeReference(t) && t.getTarget().isClassOrInterface()
      ? t.getTarget()
      : undefined
  if (isIntersectionType(t)) {
    for (const part of t.getTypes()) add(propertyOrder(part, checker, seen))
  } else if (iface?.isClassOrInterface()) {
    const ownDecls = new Set(
      declarationsOf(iface.getSymbol()!).filter(isInterfaceDeclaration),
    )
    const own = checker
      .getPropertiesOfType(iface)
      .map((p) => ({ name: p.name, decl: primaryDeclaration(p) }))
      .filter(({ decl }) => decl && ownDecls.has(decl.parent as never))
      .sort((a, b) => a.decl!.pos - b.decl!.pos)
    add(own.map(({ name }) => name))
    for (const base of checker.getBaseTypes(iface)) {
      add(propertyOrder(base, checker, seen))
    }
  }
  add(checker.getPropertiesOfType(t).map((p) => p.name))
  return names
}

/** Collect properties only from object(-like) types. Flattens intersections. */
async function collectObjectProps(
  t: Type,
  checker: Checker,
  ctx?: TypeExpansionContext,
): Promise<PropMeta[]> {
  const seen = new Map<string, TsSymbol>()

  const addProps = (tt: Type) => {
    if (!isObjectType(tt)) return
    for (const s of checker.getPropertiesOfType(tt)) {
      seen.set(s.name, s)
    }
  }

  if (isIntersectionType(t)) {
    for (const part of t.getTypes()) addProps(part)
  } else if (!isUnionType(t)) {
    // unions are skipped (e.g., 'a' | 'b'); object unions aren't summarized here
    addProps(t)
  }

  // Filter out inherited HTML/React props unless they have custom documentation
  const order = propertyOrder(t, checker)
  const rank = (sym: TsSymbol) => {
    const i = order.indexOf(sym.name)
    return i === -1 ? order.length : i
  }
  const filteredSymbols = [...seen.values()]
    .filter((sym) => shouldIncludeProp(sym, checker))
    .sort((a, b) => rank(a) - rank(b))

  // If context is provided, use it for type expansion
  if (ctx) {
    return await Promise.all(filteredSymbols.map((sym) => propMeta(sym, ctx)))
  }

  // Fallback for backward compatibility (shouldn't happen in practice)
  return filteredSymbols.map((sym) => {
    const decl = primaryDeclaration(sym)

    // If no valid declaration node exists, fall back to getTypeOfSymbol
    if (!decl) {
      return {
        name: sym.name,
        type: typeTextOfSymbol(sym, checker),
        required: true,
        description: getSymbolDoc(sym, checker),
        default: getSymbolDefaultValue(sym, checker),
      }
    }

    const type = checker.getTypeOfSymbolAtLocation(sym, decl)

    return {
      name: sym.name,
      type: checker.typeToString(type),
      required: !isOptionalMember(decl),
      description: getSymbolDoc(sym, checker),
      default: getSymbolDefaultValue(sym, checker),
    }
  })
}

/**
 * Write a throwaway tsconfig next to `tsconfigPath` that extends it, roots the
 * program at the package entries, and makes the DOM/React/Node types available
 * for analysis. It lives next to the original so relative `extends`, `paths`,
 * and type-root lookups resolve exactly as they do for the app.
 */
function writeAnalysisTsconfig(
  api: API,
  entries: string[],
  tsconfigPath?: string,
): string {
  const dir = tsconfigPath ? path.dirname(tsconfigPath) : process.cwd()
  const baseTypes = tsconfigPath
    ? ((api.parseConfigFile(tsconfigPath).options.types as
        | string[]
        | undefined) ?? [])
    : []
  const config = {
    ...(tsconfigPath ? { extends: `./${path.basename(tsconfigPath)}` } : {}),
    include: [],
    files: entries,
    compilerOptions: {
      noEmit: true,
      skipLibCheck: true,
      ...(tsconfigPath ? {} : { strict: false }),
      incremental: false,
      composite: false,
      types: [...new Set([...baseTypes, 'node', 'react', 'react-dom'])],
    },
  }
  const file = path.join(dir, `.tsconfig.types-meta.${process.pid}.json`)
  fs.writeFileSync(file, JSON.stringify(config, null, 2))
  return file
}

/** `file(line,col): category TS1234: message` plus the indented message chain. */
function formatDiagnostic(d: Diagnostic, program: Program): string {
  let location = ''
  if (d.fileName) {
    const file = path.relative(process.cwd(), d.fileName)
    const sourceFile = program.getSourceFile(d.fileName)
    const at = sourceFile?.getLineAndCharacterOfPosition(d.pos)
    location = at
      ? `${file}(${at.line + 1},${at.character + 1}): `
      : `${file}: `
  }
  const category = DiagnosticCategory[d.category].toLowerCase()
  const chain = (items: readonly Diagnostic[] = [], depth = 1): string[] =>
    items.flatMap((c) => [
      `${'  '.repeat(depth)}${c.text}`,
      ...chain(c.messageChain, depth + 1),
    ])
  return [
    `${location}${category} TS${d.code}: ${d.text}`,
    ...chain(d.messageChain),
  ].join('\n')
}

function preEmitDiagnostics(program: Program): readonly Diagnostic[] {
  return [
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getProgramDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ]
}

type DocumentedDecl =
  | InterfaceDeclaration
  | TypeAliasDeclaration
  | EnumDeclaration

function isDocumentedDecl(n: Node): n is DocumentedDecl {
  return (
    isInterfaceDeclaration(n) ||
    isTypeAliasDeclaration(n) ||
    isEnumDeclaration(n)
  )
}

function kindOfDecl(d: DocumentedDecl): TypeMeta['kind'] {
  if (isInterfaceDeclaration(d)) return 'interface'
  if (isTypeAliasDeclaration(d)) return 'typealias'
  return 'enum'
}

/**
 * Source text of a type node, comments included (also a comment before the
 * first union member), with continuation lines dedented by the indentation of
 * the line the node starts on. TypeScript 7's printer drops comments, which
 * the docs show for annotated unions.
 */
function nodeText(node: Node): string {
  const sourceFile = node.getSourceFile()
  const start = node.getStart(sourceFile)
  const lineStart = sourceFile.text.lastIndexOf('\n', start - 1) + 1
  const lineIndent = /^[ \t]*/.exec(sourceFile.text.slice(lineStart))![0].length
  const [first = '', ...rest] = node.getFullText(sourceFile).trim().split('\n')
  const indent = new RegExp(`^[ \\t]{0,${lineIndent}}`)
  return [first, ...rest.map((line) => line.replace(indent, ''))].join('\n')
}

function getSymbolDoc(sym: TsSymbol, checker: Checker): string | undefined {
  const txt =
    sym.getDocumentationComment(checker).trim() || getInheritedDoc(sym, checker)
  return txt || undefined
}

/**
 * Documentation inherited by an undocumented interface member, following
 * TypeScript 5's `getDocumentationComment` fallback: the first base type that
 * has a same-named property with a single declaration supplies the docs, even
 * when they are empty. TypeScript 7's API inherits by a different rule and
 * misses some of these (e.g. a member redeclared over an `Omit<…>` base).
 */
function getInheritedDoc(
  sym: TsSymbol,
  checker: Checker,
  seen: Set<number> = new Set([sym.id]),
): string {
  for (const decl of declarationsOf(sym)) {
    const owner = decl.parent
    if (!owner || !isInterfaceDeclaration(owner)) continue
    const ownerSym = checker.getSymbolAtLocation(owner.name)
    if (!ownerSym) continue
    const ownerType = checker.getDeclaredTypeOfSymbol(ownerSym)
    if (!ownerType.isClassOrInterface()) continue
    for (const base of checker.getBaseTypes(ownerType)) {
      const baseProp = checker.getPropertyOfType(base, sym.name)
      if (!baseProp || seen.has(baseProp.id)) continue
      seen.add(baseProp.id)
      if (baseProp.declarations.length !== 1) continue
      return (
        baseProp.getDocumentationComment(checker).trim() ||
        getInheritedDoc(baseProp, checker, seen)
      )
    }
  }
  return ''
}

/** Text of the first JSDoc tag with this name (e.g. `default`, `type`). */
function getSymbolTagText(
  sym: TsSymbol,
  checker: Checker,
  tagName: string,
): string | undefined {
  const tag = sym.getJsDocTags(checker).find((t) => t.name === tagName)
  return tag?.text?.trim() || undefined
}

/**
 * Extract @default value from JSDoc tags
 */
function getSymbolDefaultValue(
  sym: TsSymbol,
  checker: Checker,
): string | undefined {
  return getSymbolTagText(sym, checker, 'default')
}

/**
 * Extract @type value from JSDoc tags (used for data attribute value types)
 */
function getSymbolTypeTag(sym: TsSymbol, checker: Checker): string | undefined {
  return getSymbolTagText(sym, checker, 'type')
}

/**
 * Check if a symbol has the @ignore JSDoc tag
 */
function hasIgnoreTag(sym: TsSymbol, checker: Checker): boolean {
  return sym.getJsDocTags(checker).some((tag) => tag.name === 'ignore')
}

/**
 * Check if a declaration comes from a library file (node_modules or @types)
 */
function isFromLibrary(decl: Node | undefined): boolean {
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
function shouldIncludeProp(sym: TsSymbol, checker: Checker): boolean {
  // Always skip props marked with @ignore
  if (hasIgnoreTag(sym, checker)) {
    return false
  }

  const name = sym.name
  const decl = primaryDeclaration(sym)

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
  enumDecl: EnumDeclaration,
  checker: Checker,
): EnumMemberMeta[] {
  const members: EnumMemberMeta[] = []

  for (const member of enumDecl.members) {
    const memberName = member.name.getText()
    const memberSym = checker.getSymbolAtLocation(member.name)

    // Get the enum member value
    let value: string | undefined
    if (member.initializer) {
      // If there's an explicit initializer, use it
      if (isStringLiteral(member.initializer)) {
        value = member.initializer.text
      } else {
        value = member.initializer.getText()
      }
    }

    if (!value) continue // Skip members without explicit string values

    const description = memberSym ? getSymbolDoc(memberSym, checker) : undefined
    const valueType = memberSym
      ? getSymbolTypeTag(memberSym, checker)
      : undefined

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
  'CheckboxGroup',
  'CheckboxGroupValue',
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
  node: InterfaceDeclaration | TypeAliasDeclaration,
): Array<{ name: string; constraint?: string; default?: string }> | undefined {
  const tps =
    node.typeParameters?.map((tp) => ({
      name: tp.name.getText(),
      constraint: tp.constraint ? nodeText(tp.constraint) : undefined,
      default: tp.defaultType ? nodeText(tp.defaultType) : undefined,
    })) ?? []
  return tps.length ? tps : undefined
}

interface TypeExpansionContext {
  checker: Checker
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
  propSym: TsSymbol,
  ctx: TypeExpansionContext,
): Promise<PropMeta> {
  const { checker, config, currentDepth, allTypes, currentPackage } = ctx
  const decl = primaryDeclaration(propSym)

  // If no valid declaration node exists, fall back to getTypeOfSymbol
  // (can happen with synthetic properties from mapped types, etc.)
  if (!decl) {
    const typeStr = resolveTypeWithConstraints(
      typeTextOfSymbol(propSym, checker),
      ctx.typeParamConstraints,
    )
    return {
      name: propSym.name,
      type: typeStr,
      required: true,
      description: getSymbolDoc(propSym, checker),
      default: getSymbolDefaultValue(propSym, checker),
    }
  }

  const type = checker.getTypeOfSymbolAtLocation(propSym, decl)
  const required = !isOptionalMember(decl)

  const rawTypeStr = checker.typeToString(type)
  // Resolve generic type parameters to their constraints for better documentation
  const typeStr = resolveTypeWithConstraints(
    rawTypeStr,
    ctx.typeParamConstraints,
  )
  const baseTypeName = extractBaseTypeName(typeStr)
  const description = getSymbolDoc(propSym, checker)
  const defaultValue = getSymbolDefaultValue(propSym, checker)

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
  const aliasSymbol = type.getAliasSymbol()
  if (aliasSymbol) {
    const aliasName = aliasSymbol.name
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
    name: propSym.name,
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

  if (shouldExpand && isObjectType(type)) {
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

/** Resolve re-exported symbols to their real declarations. */
function resolveExport(sym: TsSymbol, checker: Checker): TsSymbol {
  return (sym.flags & SymbolFlags.Alias) !== 0
    ? checker.getAliasedSymbol(sym)
    : sym
}

/** ---------- Collector ---------- */

async function collectPackageTypes(
  prog: Program,
  checker: Checker,
  pkg: PkgArg,
  config: TypeExpansionConfig,
): Promise<PackageMeta> {
  const sf = prog.getSourceFile(pkg.entry)
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

    const decls = declarationsOf(target)
    const decl = decls.find(isDocumentedDecl)

    if (process.env.DEBUG_TYPES) {
      const kinds = decls.map((d) => SyntaxKind[d.kind]).join(', ')
      console.log(
        ' export',
        exp.name,
        exp.flags & SymbolFlags.Alias ? '(alias)' : '',
        '-> decl kinds:',
        kinds || '(none)',
      )
    }

    if (!decl) continue

    const kind = kindOfDecl(decl)
    const typeParams = isEnumDeclaration(decl)
      ? undefined
      : typeParamsMeta(decl)
    const doc = getSymbolDoc(target, checker) || getSymbolDoc(exp, checker)

    const meta: TypeMeta = { name: exp.name, kind, typeParams, doc }

    if (isTypeAliasDeclaration(decl)) {
      meta.definition = nodeText(decl.type) // e.g. "'item' | 'group' | 'submenu'"
    }

    if (kind === 'enum' && isEnumDeclaration(decl)) {
      // Extract enum members with values and JSDoc
      const members = extractEnumMembers(decl, checker)
      if (members.length > 0) {
        meta.members = members
      }
      // Categorize the enum (dataAttributes, cssVars, or other)
      meta.enumCategory = getEnumCategory(exp.name)
    } else if (kind !== 'enum') {
      const declaredType = checker.getDeclaredTypeOfSymbol(
        target /* not exp; see alias fix */,
      )

      // Build a map of type parameter names to their constraints
      // e.g., "TColumns" -> "ReadonlyArray<ColumnConfig<TData, any, any, any>>"
      const typeParamConstraints = new Map<string, string>()
      if (!isEnumDeclaration(decl) && decl.typeParameters) {
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
  const tsconfigPath = args.tsconfig
    ? path.resolve(process.cwd(), args.tsconfig)
    : undefined
  const rootNames = args.packages.map((p) => p.entry)

  // TypeScript 7 runs the checker in a separate process; the API talks to it.
  const api = new API({ cwd: process.cwd() })
  let analysisTsconfig: string | undefined
  const removeAnalysisTsconfig = () => {
    if (analysisTsconfig) fs.rmSync(analysisTsconfig, { force: true })
  }
  process.once('SIGINT', () => {
    removeAnalysisTsconfig()
    process.exit(130)
  })
  process.once('SIGTERM', () => {
    removeAnalysisTsconfig()
    process.exit(143)
  })
  try {
    analysisTsconfig = writeAnalysisTsconfig(api, rootNames, tsconfigPath)
    const snapshot = api.updateSnapshot({ openProjects: [analysisTsconfig] })
    const project = snapshot.getProject(analysisTsconfig)
    if (!project) throw new Error(`Could not open ${analysisTsconfig}`)
    const { program, checker } = project

    if (process.env.DEBUG_TYPES) {
      console.log(
        'Program files:\n' +
          program
            .getSourceFileNames()
            .map((f) => ` - ${f}`)
            .join('\n'),
      )
    }

    // Trigger type checking so diagnostics surface early
    const diagnostics = preEmitDiagnostics(program)
    if (diagnostics.length) {
      console.warn(
        diagnostics.map((d) => formatDiagnostic(d, program)).join('\n'),
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
  } finally {
    try {
      api.close()
    } catch (error) {
      // The checker process may already be gone; keep the original error.
      if (process.env.DEBUG_TYPES) console.warn('api.close() failed:', error)
    }
    removeAnalysisTsconfig()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
