// @bazza-ui/data-view/drizzle — Drizzle adapter barrel
// Re-exports all database-specific adapters.
// Import from the specific sub-path for your database:
//   import { applyDataView } from '@bazza-ui/data-view/drizzle/pg'
//   import { applyDataView } from '@bazza-ui/data-view/drizzle/mysql'  (future)
//   import { applyDataView } from '@bazza-ui/data-view/drizzle/sqlite' (future)

export {
  type ApplyDataViewOptions,
  applyDataView,
  type PgRelationsConfig,
} from './pg.js'
