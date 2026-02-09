// @bazza-ui/data-view — Column Builder

import { isAnyOf } from '../../lib/array.js'
import {
  isBuiltInOrderFnName,
  isBuiltInOrderFnTuple,
  isCustomOrderFn,
  isOrderDirection,
  orderFns,
} from '../../lib/order-fns.js'
import type { ColumnType } from '../column-types.js'
import {
  bigIntType,
  booleanType,
  dateType,
  multiOptionType,
  numberType,
  optionType,
  textType,
} from '../column-types.js'
import type { OperatorSet } from '../operator-set.js'
import type {
  ColumnConfig,
  ColumnDataType,
  ColumnMeta,
  ColumnOption,
  OrderDirection,
  SortDirection,
  TAccessorFn,
  TBuiltInOrderFnName,
  TCustomOrderFn,
  TOrderFnArg,
  TOrderFns,
  TTransformOptionsFn,
  TTransformValueToOptionFn,
} from '../types.js'

export class ColumnBuilder<
  TData,
  TType extends ColumnDataType = any,
  TVal = unknown,
  TId extends string = string,
> {
  private config: Partial<ColumnConfig<TData, TType, TVal, TId>>

  constructor(type: TType) {
    this.config = { type } as Partial<ColumnConfig<TData, TType, TVal, TId>>
  }

  private clone(): ColumnBuilder<TData, TType, TVal, TId> {
    const newInstance = new ColumnBuilder<TData, TType, TVal, TId>(
      this.config.type as TType,
    )
    newInstance.config = { ...this.config }
    return newInstance
  }

  id<TNewId extends string>(
    value: TNewId,
  ): ColumnBuilder<TData, TType, TVal, TNewId> {
    const newInstance = this.clone() as ColumnBuilder<any, any, any, any>
    newInstance.config.id = value
    return newInstance as ColumnBuilder<TData, TType, TVal, TNewId>
  }

  accessor<TNewVal>(
    accessor: TAccessorFn<TData, TNewVal>,
  ): ColumnBuilder<TData, TType, TNewVal, TId> {
    const newInstance = this.clone() as ColumnBuilder<any, any, any, any>
    newInstance.config.accessor = accessor
    return newInstance as ColumnBuilder<TData, TType, TNewVal, TId>
  }

  displayName(value: string): ColumnBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone()
    newInstance.config.displayName = value
    return newInstance
  }

  icon(value: unknown): ColumnBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone()
    newInstance.config.icon = value
    return newInstance
  }

  hidden(value: boolean): ColumnBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone()
    newInstance.config.hidden = value
    return newInstance
  }

  /**
   * Marks this column as sortable.
   * Optionally sets a default sort direction for when the column is first toggled.
   */
  sortable(options?: {
    default?: { direction: SortDirection }
  }): ColumnBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone()
    newInstance.config.sortable = true
    if (options?.default?.direction) {
      newInstance.config.defaultSortDirection = options.default.direction
    }
    return newInstance
  }

  /**
   * Sets a custom OperatorSet for this column, overriding the default
   * operator set for its column type.
   */
  operators(set: OperatorSet): ColumnBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone()
    newInstance.config.operators = set
    return newInstance
  }

  // Number-specific methods
  min(
    value: TType extends 'number'
      ? number
      : TType extends 'bigint'
        ? bigint
        : never,
  ): this {
    this.validateType(['number', 'bigint'], 'min()')
    this.config.min = value as any
    return this
  }

  max(
    value: TType extends 'number'
      ? number
      : TType extends 'bigint'
        ? bigint
        : never,
  ): this {
    this.validateType(['number', 'bigint'], 'max()')
    this.config.max = value as any
    return this
  }

  // Option-specific methods
  options(value: ColumnOption[]): this {
    this.validateType(['option', 'multiOption'], 'options()')
    this.config.options = value as any
    return this
  }

  transformValueToOptionFn(fn: TTransformValueToOptionFn<TVal>): this {
    this.validateType(['option', 'multiOption'], 'transformValueToOptionFn()')
    this.config.transformValueToOptionFn = fn as any
    return this
  }

  /**
   * Transforms the computed column options after initial computation, with access to faceted data.
   * This is applied AFTER transformValueToOptionFn and has access to both the computed options array
   * and faceted unique values data.
   */
  transformOptionsFn(fn: TTransformOptionsFn): this {
    this.validateType(['option', 'multiOption'], 'transformOptionsFn()')
    this.config.transformOptionsFn = fn as any
    return this
  }

  orderFn(name: TBuiltInOrderFnName, direction: OrderDirection): this
  orderFn(customFn: TCustomOrderFn): this
  orderFn(...args: TOrderFnArg[]): this
  orderFn(...args: any[]): this {
    this.validateType(['option', 'multiOption'], 'orderFn()')

    const orderFnsToApply: TOrderFns = []

    // Handle the case where first two args are built-in name and direction
    if (
      args.length === 2 &&
      isBuiltInOrderFnName(args[0]) &&
      isOrderDirection(args[1])
    ) {
      const [name, direction] = args
      orderFnsToApply.push((a: ColumnOption, b: ColumnOption) =>
        orderFns[name](a, b, direction),
      )
    } else if (args.length === 1 && isCustomOrderFn(args[0])) {
      orderFnsToApply.push(args[0])
    } else {
      // Handle array/rest syntax - validate each argument
      for (const arg of args) {
        if (isBuiltInOrderFnTuple(arg)) {
          const [name, direction] = arg
          orderFnsToApply.push((a: ColumnOption, b: ColumnOption) =>
            orderFns[name](a, b, direction),
          )
        } else if (isCustomOrderFn(arg)) {
          orderFnsToApply.push(arg)
        } else {
          throw new Error(
            `Invalid argument: ${JSON.stringify(arg)}. Expected built-in function tuple or custom function.`,
          )
        }
      }
    }

    this.config.orderFn = orderFnsToApply as any
    return this
  }

  toggledStateName(
    value: string,
  ): ColumnBuilder<TData, TType extends 'boolean' ? TType : never, TVal, TId> {
    if (this.config.type !== 'boolean')
      throw new Error(
        'toggledStateName() is only applicable to boolean columns',
      )

    const newInstance = this.clone() as ColumnBuilder<any, any, any, any>
    newInstance.config.toggledStateName = value
    return newInstance
  }

  meta(value: ColumnMeta): ColumnBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone()
    newInstance.config.meta = value
    return newInstance
  }

  /**
   * Sets the server field path for query generation.
   *
   * Convention:
   * - `'db_column_name'` → rename: the DB column has a different name than the column ID.
   * - `'relation.column'` → relation path: access `column` on the related `relation` table.
   *
   * Omit to default to using the column `id` as the DB column name.
   * This is purely declarative metadata — it has no runtime effect in the core package.
   * Server-side adapters read this to generate queries.
   *
   * @example
   * ```typescript
   * cb.date().id('createdAt').field('created_at')       // rename
   * cb.option().id('status').field('status.name')       // belongs-to
   * cb.multiOption().id('labels').field('labels.name')  // many-to-many
   * ```
   */
  field(value: string): ColumnBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone()
    newInstance.config.field = value
    return newInstance
  }

  private validateType(
    expectedTypes: ColumnDataType | ColumnDataType[],
    methodName: string,
  ) {
    const types = Array.isArray(expectedTypes) ? expectedTypes : [expectedTypes]
    if (!isAnyOf(this.config.type, types)) {
      throw new Error(
        `[Column config builder] ${methodName} is only applicable to ${types.join(' or ')} columns`,
      )
    }
  }

  build(): ColumnConfig<TData, TType, TVal, TId> {
    this.validateRequiredFields()
    return this.config as ColumnConfig<TData, TType, TVal, TId>
  }

  private validateRequiredFields() {
    if (!this.config.id) throw new Error('id is required')
    if (!this.config.accessor) throw new Error('accessor is required')
    if (!this.config.displayName) throw new Error('displayName is required')
  }
}

// ── Helpers: wire columnType into a builder ─────────────────

function withColumnType<TData, TType extends ColumnDataType, TVal>(
  builder: ColumnBuilder<TData, TType, TVal>,
  // biome-ignore lint/suspicious/noExplicitAny: variance
  colType: ColumnType<any>,
): ColumnBuilder<TData, TType, TVal> {
  // Use the build-then-reconstruct pattern isn't needed — we access internal config
  // through the public API by chaining. But since columnType/normalizeValues are on config,
  // we need to cast to access the private config. We'll use Object.assign on the builder's
  // prototype-hidden config via a trick: build a partial config object and assign it.
  //
  // Actually, the simplest approach is to expose a package-internal static helper.
  // But to keep things clean, we'll just set properties via Object.defineProperty
  // or we'll use a different approach: return a new builder with the columnType set.
  //
  // Simplest: access the private config via (builder as any).
  const b = builder as any
  b.config.columnType = colType
  b.config.normalizeValues = colType.normalizeValues
  return builder
}

// ── Fluent builder interface ────────────────────────────────

interface FluentColumnBuilder<TData> {
  text: () => ColumnBuilder<TData, 'text', string>
  number: () => ColumnBuilder<TData, 'number', number>
  bigint: () => ColumnBuilder<TData, 'bigint', bigint>
  date: () => ColumnBuilder<TData, 'date', Date>
  boolean: () => ColumnBuilder<TData, 'boolean', boolean>
  option: () => ColumnBuilder<TData, 'option', string>
  multiOption: () => ColumnBuilder<TData, 'multiOption', string[]>
  /**
   * Creates a builder for a custom column type defined via `defineColumnType`.
   * Sets `type`, `operators`, `normalizeValues`, and `columnType` from the type config.
   */
  custom: <TValue>(
    type: ColumnType<TValue>,
  ) => ColumnBuilder<TData, string, TValue>
}

// Factory function
export function createColumnBuilder<TData>(): FluentColumnBuilder<TData> {
  return {
    text: () =>
      withColumnType(
        new ColumnBuilder<TData, 'text', string>('text'),
        textType,
      ),
    number: () =>
      withColumnType(
        new ColumnBuilder<TData, 'number', number>('number'),
        numberType,
      ),
    bigint: () =>
      withColumnType(
        new ColumnBuilder<TData, 'bigint', bigint>('bigint'),
        bigIntType,
      ),
    date: () =>
      withColumnType(new ColumnBuilder<TData, 'date', Date>('date'), dateType),
    boolean: () =>
      withColumnType(
        new ColumnBuilder<TData, 'boolean', boolean>('boolean'),
        booleanType,
      ),
    option: () =>
      withColumnType(
        new ColumnBuilder<TData, 'option', string>('option'),
        optionType,
      ),
    multiOption: () =>
      withColumnType(
        new ColumnBuilder<TData, 'multiOption', string[]>('multiOption'),
        multiOptionType,
      ),
    custom: <TValue>(type: ColumnType<TValue>) => {
      const builder = new ColumnBuilder<TData, string, TValue>(type.id as any)
      const b = builder as any
      b.config.columnType = type
      b.config.operators = type.operators
      b.config.normalizeValues = type.normalizeValues
      return builder
    },
  }
}
