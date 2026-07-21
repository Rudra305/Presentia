import type { BaseEntity, SqlValue } from '@/core/storage/sqlite';
import { BaseRepository, getDb, seedDev } from '@/core/storage/sqlite';

/** Domain entity for the app-level Teacher user. */
export interface Teacher extends BaseEntity {
  tenantId: string;
  fullName: string;
  email: string | null;
  status: 'active' | 'disabled';
  biometricEnrolled: boolean;
}

export class TeacherRepo extends BaseRepository<Teacher> {
  protected get tableName(): string {
    return 'users';
  }

  protected toRow(e: Teacher): Record<string, SqlValue> {
    return {
      id: e.id,
      tenant_id: e.tenantId,
      role: 'teacher',
      full_name: e.fullName,
      email: e.email,
      biometric_enrolled: e.biometricEnrolled ? 1 : 0,
      status: e.status,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
      version: e.version,
      deleted_at: e.deletedAt,
      sync_status: e.syncStatus,
      remote_id: e.remoteId,
      last_synced_at: e.lastSyncedAt,
    };
  }

  protected fromRow(row: Record<string, SqlValue>): Teacher {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      fullName: row.full_name as string,
      email: (row.email ?? null) as string | null,
      status: (row.status as Teacher['status']) ?? 'active',
      biometricEnrolled: Number(row.biometric_enrolled) === 1,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      version: row.version as number,
      deletedAt: (row.deleted_at ?? null) as number | null,
      syncStatus: row.sync_status as Teacher['syncStatus'],
      remoteId: (row.remote_id ?? null) as string | null,
      lastSyncedAt: (row.last_synced_at ?? null) as number | null,
    };
  }

  /** All active teachers for a tenant, sorted by name. */
  async listByTenant(tenantId: string): Promise<Teacher[]> {
    return this.findAll({
      where: "tenant_id = ? AND role = 'teacher'",
      params: [tenantId],
      orderBy: 'full_name COLLATE NOCASE ASC',
    });
  }

  /** Case-insensitive search by name or email. */
  async search(tenantId: string, query: string): Promise<Teacher[]> {
    const q = `%${query.trim().toLowerCase()}%`;
    return this.findAll({
      where: `tenant_id = ? AND role = 'teacher' AND (LOWER(full_name) LIKE ? OR LOWER(IFNULL(email,'')) LIKE ?)`,
      params: [tenantId, q, q],
      orderBy: 'full_name COLLATE NOCASE ASC',
      limit: 100,
    });
  }
}

/** Convenience factory used by hooks. */
export async function getTeacherRepo(): Promise<TeacherRepo> {
  const db = await getDb();
  return new TeacherRepo(db);
}

/**
 * Ensure the dev tenant + seed data exist so the Principal Dashboard has
 * something to display before any real onboarding is built. Idempotent.
 */
export async function ensureSeedTenant(): Promise<string> {
  const db = await getDb();
  const seed = await seedDev(db);
  return seed.tenantId;
}
