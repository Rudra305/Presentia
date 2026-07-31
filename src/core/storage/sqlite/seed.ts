import type { SQLiteAdapter } from './adapter';
import { nowEpochMs, uuid } from './ids';

/**
 * Development seed data.
 *
 * Idempotent — checks whether the tenant already exists before inserting.
 * Never called in production builds. Only used from:
 *  - Milestone 4 tests (verifying repos against realistic data)
 *  - Later milestones' dev-only "reset & seed" utility
 */

export const SEED_TENANT_ID = 'seed-tenant-000';

export interface SeedResult {
    tenantId: string;
    principalId: string;
    teacherIds: string[];
    classIds: string[];
    studentIds: string[];
}

export async function seedDev(db: SQLiteAdapter): Promise<SeedResult> {
    const now = nowEpochMs();

    // Skip if we've seeded before.
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM tenants WHERE id = ?', [
        SEED_TENANT_ID,
    ]);
    if (existing) {
        const users = await db.getAllAsync<{ id: string; role: string }>(
            'SELECT id, role FROM users WHERE tenant_id = ?',
            [SEED_TENANT_ID],
        );
        const classes = await db.getAllAsync<{ id: string }>(
            'SELECT id FROM classes WHERE tenant_id = ?',
            [SEED_TENANT_ID],
        );
        const students = await db.getAllAsync<{ id: string }>(
            'SELECT id FROM students WHERE tenant_id = ?',
            [SEED_TENANT_ID],
        );
        return {
            tenantId: SEED_TENANT_ID,
            principalId: users.find((u) => u.role === 'principal')?.id ?? '',
            teacherIds: users.filter((u) => u.role === 'teacher').map((u) => u.id),
            classIds: classes.map((c) => c.id),
            studentIds: students.map((s) => s.id),
        };
    }

    const principalId = uuid();
    const teacherIds = [uuid(), uuid()];
    const classIds = [uuid(), uuid(), uuid()];
    const studentIds: string[] = [];

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            'INSERT INTO tenants (id, name, code, created_at, updated_at) VALUES (?,?,?,?,?)',
            [SEED_TENANT_ID, 'Emerald Grove Academy', 'EGA-2026', now, now],
        );

        await db.runAsync(
            `INSERT INTO users
        (id, tenant_id, role, full_name, email, biometric_enrolled, status,
         created_at, updated_at, version, sync_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
                principalId,
                SEED_TENANT_ID,
                'principal',
                'Dr. Ada Okafor',
                'ada.okafor@ega.school',
                1,
                'active',
                now,
                now,
                1,
                'synced',
            ],
        );

        const teacherProfiles = [
            { name: 'Mr. Ravi Menon', email: 'ravi.menon@ega.school' },
            { name: 'Ms. Lin Wei', email: 'lin.wei@ega.school' },
        ];
        for (let i = 0; i < teacherIds.length; i++) {
            const id = teacherIds[i]!;
            const p = teacherProfiles[i]!;
            await db.runAsync(
                `INSERT INTO users
          (id, tenant_id, role, full_name, email, biometric_enrolled, status,
           created_at, updated_at, version, sync_status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    id,
                    SEED_TENANT_ID,
                    'teacher',
                    p.name,
                    p.email,
                    1,
                    'active',
                    now,
                    now,
                    1,
                    'synced',
                ],
            );
        }

        const classProfiles = [
            { name: 'Grade 5 · Section A', grade: '5', section: 'A', teacherId: teacherIds[0]! },
            { name: 'Grade 5 · Section B', grade: '5', section: 'B', teacherId: teacherIds[0]! },
            { name: 'Grade 6 · Section A', grade: '6', section: 'A', teacherId: teacherIds[1]! },
        ];
        for (let i = 0; i < classIds.length; i++) {
            const id = classIds[i]!;
            const c = classProfiles[i]!;
            await db.runAsync(
                `INSERT INTO classes
          (id, tenant_id, name, grade, section, teacher_id,
           created_at, updated_at, version, sync_status)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
                [
                    id,
                    SEED_TENANT_ID,
                    c.name,
                    c.grade,
                    c.section,
                    c.teacherId,
                    now,
                    now,
                    1,
                    'synced',
                ],
            );
        }

        // 5 students per class, unique roll numbers per class.
        const firstNames = ['Aarav', 'Bianca', 'Chen', 'Daniela', 'Ekene'];
        const lastNames = ['Patel', 'Rossi', 'Wang', 'Silva', 'Adeyemi'];
        for (const classId of classIds) {
            for (let i = 0; i < 5; i++) {
                const sid = uuid();
                studentIds.push(sid);
                await db.runAsync(
                    `INSERT INTO students
            (id, tenant_id, class_id, roll_no, full_name,
             created_at, updated_at, version, sync_status)
           VALUES (?,?,?,?,?,?,?,?,?)`,
                    [
                        sid,
                        SEED_TENANT_ID,
                        classId,
                        String(i + 1).padStart(2, '0'),
                        `${firstNames[i]} ${lastNames[i]}`,
                        now,
                        now,
                        1,
                        'synced',
                    ],
                );
            }
        }
    });

    return { tenantId: SEED_TENANT_ID, principalId, teacherIds, classIds, studentIds };
}
