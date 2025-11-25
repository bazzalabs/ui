import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import prettier from 'prettier'
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

export type TypeMeta = {
  name: string
  kind: 'interface' | 'typealias' | 'enum'
  typeParams?: Array<{ name: string; constraint?: string; default?: string }>
  doc?: string
  props?: PropMeta[] // not present for enums
  definition?: string // not present for enums
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

  // If context is provided, use it for type expansion
  if (ctx) {
    return await Promise.all([...seen.values()].map((sym) => propMeta(sym, ctx)))
  }

  // Fallback for backward compatibility (shouldn't happen in practice)
  return [...seen.values()].map((sym) => {
    const decl = (sym.valueDeclaration ?? sym.declarations?.[0]) as
      | ts.Declaration
      | undefined
    const type = checker.getTypeOfSymbolAtLocation(
      sym,
      decl ?? sym.declarations?.[0] ?? (sym as unknown as ts.Node),
    )
    const required =
      decl && ts.isPropertySignature(decl)
        ? !decl.questionToken
        : decl && ts.isPropertyDeclaration(decl)
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
    ? ts.displayPartsToString(Array.isArray(defaultTag.text) ? defaultTag.text : [defaultTag.text])
    : undefined

  return text?.trim() || undefined
}

/**
 * Format a TypeScript type string using Prettier
 */
async function formatTypeString(typeStr: string): Promise<string | undefined> {
  // Skip formatting for simple types
  if (typeStr.length < 50 && !typeStr.includes('{') && !typeStr.includes('(')) {
    return undefined // Return undefined to indicate no formatting needed
  }

  // Skip types with truncation markers (...) as they're not valid TypeScript
  if (typeStr.includes('...')) {
    return undefined
  }

  try {
    // Wrap the type in a declaration to make it valid TypeScript
    const wrappedType = `type FormattedType = ${typeStr}`

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
    // If formatting fails, return undefined
    if (process.env.DEBUG_TYPES) {
      console.warn('Failed to format type:', typeStr, error)
    }
    return undefined
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
}

/**
 * Extract the base type name from a type string
 * e.g., "MenuDef<T>" -> "MenuDef", "Array<string>" -> "Array"
 */
function extractBaseTypeName(typeStr: string): string {
  const match = typeStr.match(/^([a-zA-Z_$][a-zA-Z0-9_$.]*)/)
  return match?.[1] ?? typeStr
}

async function propMeta(
  propSym: ts.Symbol,
  ctx: TypeExpansionContext,
): Promise<PropMeta> {
  const { checker, config, currentDepth, allTypes, currentPackage } = ctx
  const decl = (propSym.valueDeclaration ?? propSym.declarations?.[0]) as
    | ts.Declaration
    | undefined
  const type = checker.getTypeOfSymbolAtLocation(
    propSym,
    decl ?? propSym.declarations?.[0] ?? (propSym as unknown as ts.Node),
  )
  const required =
    decl && ts.isPropertySignature(decl)
      ? !decl.questionToken
      : decl && ts.isPropertyDeclaration(decl)
        ? !decl.questionToken
        : true

  const typeStr = checker.typeToString(type)
  const baseTypeName = extractBaseTypeName(typeStr)
  const description = getSymbolDoc(propSym, checker)
  const defaultValue = getSymbolDefaultValue(propSym)
  const formattedType = await formatTypeString(typeStr)

  const meta: PropMeta = {
    name: propSym.getName(),
    type: typeStr,
    formattedType,
    required,
    description,
    default: defaultValue,
  }

  // Check if we should expand this type
  const maxDepth = config.maxDepth ?? 2
  const shouldExpand = currentDepth < maxDepth && shouldExpandType(
    baseTypeName,
    undefined, // TODO: detect package name from symbol
    config,
  )

  if (shouldExpand && isObjectLikeType(type)) {
    // Recursively expand the type
    const expandedProps = await collectObjectProps(type, checker, { ...ctx, currentDepth: currentDepth + 1 })

    if (expandedProps.length > 0) {
      meta.isExpanded = true
      meta.expandedType = expandedProps
    }
  }

  // Check if this is a reference to a documented type
  const referencePath = findTypeReference(baseTypeName, allTypes, currentPackage)
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

    if (kind !== 'enum') {
      const declaredType = checker.getDeclaredTypeOfSymbol(
        target /* not exp; see alias fix */,
      )

      // Create expansion context
      const ctx: TypeExpansionContext = {
        checker,
        config,
        currentDepth: 0,
        allTypes,
        currentPackage: pkg.name,
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
    const meta = await collectPackageTypes(program, checker, pkg, args.config ?? defaultConfig)
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
