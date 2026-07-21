/**
 * Common SQLite adapter interface.
 *
 * Two implementations exist:
 *  - ExpoSQLiteAdapter (production, on device)
 *  - BetterSqliteAdapter (tests, Node)
 *
 * By programming against this interface, the migration runner, base
 * repository, and every feature repo can run in both environments — the
 * SAME SQL executes against the SAME SQL dialect (SQLite) in Jest and on
 * the device.
 */

export type SqlValue = string | number | boolean | null | Uint8Array;

export type SqlRow = Record<string, SqlValue>;

export interface SQLiteAdapter {
  /** Execute one or more statements (no bind params, no return). */
  execAsync(sql: string): Promise<void>;

  /** Run a single statement with bind params; returns { changes, lastInsertRowId }. */
  runAsync(sql: string, params?: SqlValue[]): Promise<{ changes: number }>;

  /** Query returning first row or null. */
  getFirstAsync<T extends SqlRow = SqlRow>(sql: string, params?: SqlValue[]): Promise<T | null>;

  /** Query returning all rows. */
  getAllAsync<T extends SqlRow = SqlRow>(sql: string, params?: SqlValue[]): Promise<T[]>;

  /** Wrap `fn` in a transaction; rolls back on throw. */
  withTransactionAsync<T>(fn: () => Promise<T>): Promise<T>;

  /** Close the underlying handle. */
  closeAsync(): Promise<void>;
}
