// @bazza-ui/data-view/server — Server-side query generation
// Framework-agnostic AST types, compiler, and adapter interface.
// No ORM-specific code here — see /drizzle/pg, /drizzle/mysql, etc.

// ── AST Types ───────────────────────────────────────────────

export type {
  BelongsToFieldPath,
  ComparisonCondition,
  ComparisonOp,
  Condition,
  CursorPagination,
  DataViewQueryAST,
  DirectFieldPath,
  FieldPath,
  FieldRef,
  HasManyFieldPath,
  JsonSafeValue,
  LogicalCondition,
  NotCondition,
  OffsetPagination,
  PaginationNode,
  SearchNode,
  SortNode,
} from './ast.js'

// ── Compiler ────────────────────────────────────────────────

export type {
  BuildQueryASTOptions,
  CompileFilterOptions,
  CompileSearchOptions,
  CompileSortOptions,
} from './compile.js'
export {
  buildQueryAST,
  compileFilters,
  compileSearch,
  compileSort,
  serializeFilterValues,
} from './compile.js'

// ── Operator Compilers ──────────────────────────────────────

export type { OperatorCompiler, OperatorCompilerMap } from './compilers.js'
export {
  bigIntCompilers,
  booleanCompilers,
  builtInCompilers,
  dateCompilers,
  escapeLike,
  multiOptionCompilers,
  numberCompilers,
  optionCompilers,
  textCompilers,
} from './compilers.js'

// ── Field Resolution ────────────────────────────────────────

export type { HasManyRelationSet } from './resolve.js'
export {
  parseFieldPath,
  refineFieldPath,
  resolveFieldRef,
  resolveFieldRefs,
} from './resolve.js'

// ── Adapter Interface ───────────────────────────────────────

export type { DataViewResult, QueryAdapter } from './adapter.js'
