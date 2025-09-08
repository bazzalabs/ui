import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

/** ---------- CLI parsing (typed) ---------- */

type PkgArg = { name: string; entry: string }

interface Args {
  out: string
  tsconfig?: string
  packages: PkgArg[]
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

  return { out, tsconfig, packages }
}

/** ---------- Output shapes (typed) ---------- */

export type PropMeta = {
  name: string
  type: string
  required: boolean
  description?: string
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
function collectObjectProps(t: ts.Type, checker: ts.TypeChecker): PropMeta[] {
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
    // unions are skipped (e.g., 'a' | 'b'); object unions aren’t summarized here
    addProps(t)
  }

  return [...seen.values()].map((sym) => propMeta(sym, checker))
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

function propMeta(propSym: ts.Symbol, checker: ts.TypeChecker): PropMeta {
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

  return {
    name: propSym.getName(),
    type: checker.typeToString(type),
    required,
    description: getSymbolDoc(propSym, checker),
  }
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

function collectPackageTypes(
  prog: ts.Program,
  checker: ts.TypeChecker,
  pkg: PkgArg,
): PackageMeta {
  const sf = findSourceFile(prog, pkg.entry)
  if (!sf) throw new Error(`Entry not in program: ${pkg.entry}`)
  const moduleSym = checker.getSymbolAtLocation(sf)
  if (!moduleSym) throw new Error(`No module symbol for: ${pkg.entry}`)

  const exportsArr = checker.getExportsOfModule(moduleSym)
  const types: Record<string, TypeMeta> = {}

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
      const props = collectObjectProps(declaredType, checker)
      if (props.length) meta.props = props
    }

    types[meta.name] = meta
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
    const meta = collectPackageTypes(program, checker, pkg)
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
