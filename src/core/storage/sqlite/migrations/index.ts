import initSql from './0001_init.sql';
import indexesSql from './0002_indexes.sql';

/**
 * Ordered list of migrations.
 *
 * Rules:
 *  - `version` is monotonically increasing; runner refuses to skip.
 *  - `sql` MUST be idempotent-friendly OR the runner enforces one-shot
 *    application via the `_meta.schema_version` marker (we do the latter).
 *  - Never edit a shipped migration; add a new one instead.
 */

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const migrations: Migration[] = [
  { version: 1, name: 'init', sql: initSql },
  { version: 2, name: 'indexes', sql: indexesSql },
];
