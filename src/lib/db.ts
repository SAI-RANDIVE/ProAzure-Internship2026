import { neon } from '@neondatabase/serverless'

const DATABASE_URL = import.meta.env.VITE_DATABASE_URL as string

let sqlClient: ReturnType<typeof neon> | null = null

export function getDb() {
  if (!DATABASE_URL) {
    throw new Error('Missing VITE_DATABASE_URL. Add it to .env.local before using the database.')
  }
  if (!sqlClient) {
    sqlClient = neon(DATABASE_URL)
  }
  return sqlClient
}

function dateOnly(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function textValue(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function timeValue(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
  }
  return String(value).slice(0, 5)
}

function normalizeBatch(row: Batch): Batch {
  return {
    ...row,
    start_date: dateOnly(row.start_date),
    end_date: dateOnly(row.end_date),
    session_time: timeValue(row.session_time),
    created_at: textValue(row.created_at),
  }
}

function normalizeSession(row: Session): Session {
  return {
    ...row,
    session_date: dateOnly(row.session_date),
    created_at: textValue(row.created_at),
  }
}

function normalizeAttendance(row: AttendanceRecord): AttendanceRecord {
  return {
    ...row,
    session_date: dateOnly(row.session_date),
    join_time: timeValue(row.join_time),
    leave_time: timeValue(row.leave_time),
    session_start: timeValue(row.session_start),
  }
}

function normalizeCsvUpload(row: CsvUpload): CsvUpload {
  return {
    ...row,
    date_range_start: dateOnly(row.date_range_start),
    date_range_end: dateOnly(row.date_range_end),
    uploaded_at: textValue(row.uploaded_at),
  }
}

// ── Schema DDL ──────────────────────────────────────────────────────────────
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS instructors (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'instructor' CHECK (role IN ('master','instructor')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id TEXT NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  mode          TEXT NOT NULL CHECK (mode IN ('online','offline','hybrid')),
  start_date    DATE NOT NULL DEFAULT '2026-06-01',
  end_date      DATE NOT NULL DEFAULT '2026-08-30',
  session_time  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  session_date  DATE NOT NULL,
  topic         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, session_date)
);

CREATE TABLE IF NOT EXISTS csv_uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  source_type   TEXT NOT NULL DEFAULT 'zoom',
  date_range_start DATE,
  date_range_end   DATE,
  records_added INT DEFAULT 0,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id       UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  student_name   TEXT NOT NULL,
  session_date   DATE NOT NULL,
  join_time      TEXT,
  leave_time     TEXT,
  duration_min   INT NOT NULL DEFAULT 0,
  session_start  TEXT,
  raw_name       TEXT,
  source_type    TEXT NOT NULL DEFAULT 'zoom',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, student_name, session_date, join_time, source_type)
);

CREATE INDEX IF NOT EXISTS idx_attendance_batch ON attendance(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date  ON attendance(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_name  ON attendance(student_name);
CREATE INDEX IF NOT EXISTS idx_sessions_batch   ON sessions(batch_id);
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'instructor';
ALTER TABLE instructors DROP CONSTRAINT IF EXISTS instructors_role_check;
ALTER TABLE instructors ADD CONSTRAINT instructors_role_check CHECK (role IN ('master','instructor'));
ALTER TABLE csv_uploads ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'zoom';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'zoom';
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_batch_id_student_name_session_date_join_time_key;
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_batch_student_date_join_source_key;
ALTER TABLE attendance ADD CONSTRAINT attendance_batch_student_date_join_source_key UNIQUE(batch_id, student_name, session_date, join_time, source_type);
`

// ── Types ────────────────────────────────────────────────────────────────────
export interface Instructor {
  id: string
  email: string
  name: string
  role: 'master' | 'instructor'
  avatar_url?: string
  created_at: string
}

export interface Batch {
  id: string
  instructor_id: string
  name: string
  description?: string
  mode: 'online' | 'offline' | 'hybrid'
  start_date: string
  end_date: string
  session_time?: string
  created_at: string
}

export interface Session {
  id: string
  batch_id: string
  session_date: string
  topic?: string
  created_at: string
}

export interface AttendanceRecord {
  id: string
  batch_id: string
  student_name: string
  session_date: string
  join_time: string
  leave_time: string
  duration_min: number
  session_start: string
  raw_name: string
  source_type: 'zoom' | 'google-meet'
}

export interface CsvUpload {
  id: string
  batch_id: string
  filename: string
  date_range_start: string
  date_range_end: string
  records_added: number
  source_type: 'zoom' | 'google-meet' | 'zoom-meet'
  uploaded_at: string
}

// ── DB helpers ────────────────────────────────────────────────────────────────
export async function initSchema() {
  const sql = getDb()
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
  for (const stmt of statements) {
    try {
      // Use raw template string for DDL statements
      await (sql as any)(stmt)
      console.log('Schema statement executed')
    } catch (e) {
      console.error('Schema init error:', e)
    }
  }
}

export async function upsertInstructor(data: Pick<Instructor,'id'|'email'|'name'|'role'|'avatar_url'>) {
  const sql = getDb()
  await sql`
    INSERT INTO instructors (id, email, name, role, avatar_url)
    VALUES (${data.id}, ${data.email}, ${data.name}, ${data.role}, ${data.avatar_url ?? null})
    ON CONFLICT (id) DO UPDATE SET
      name       = EXCLUDED.name,
      role       = EXCLUDED.role,
      avatar_url = EXCLUDED.avatar_url
  `
}

export async function getInstructor(id: string): Promise<Instructor | null> {
  const sql = getDb()
  const rows = (await sql`SELECT * FROM instructors WHERE id = ${id}`) as Instructor[]
  return rows[0] ?? null
}

export async function getInstructors(): Promise<Instructor[]> {
  const sql = getDb()
  const rows = (await sql`
    SELECT * FROM instructors WHERE role = 'instructor' ORDER BY name ASC
  `) as Instructor[]
  return rows
}

export async function getBatches(instructorId: string): Promise<Batch[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM batches WHERE instructor_id = ${instructorId} ORDER BY created_at DESC
  `
  return (rows as Batch[]).map(normalizeBatch)
}

export async function getAllBatches(): Promise<Batch[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM batches ORDER BY created_at DESC
  `
  return (rows as Batch[]).map(normalizeBatch)
}

export async function createBatch(data: Omit<Batch,'id'|'created_at'>): Promise<Batch> {
  const sql = getDb()
  const rows = (await sql`
    INSERT INTO batches (instructor_id, name, description, mode, start_date, end_date, session_time)
    VALUES (${data.instructor_id}, ${data.name}, ${data.description ?? null},
            ${data.mode}, ${data.start_date}, ${data.end_date}, ${data.session_time ?? null})
    RETURNING *
  `) as Batch[]
  return normalizeBatch(rows[0])
}

export async function updateBatch(id: string, data: Partial<Omit<Batch,'id'|'instructor_id'|'created_at'>>): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE batches SET
      name = COALESCE(${data.name ?? null}, name),
      description = COALESCE(${data.description ?? null}, description),
      mode = COALESCE(${data.mode ?? null}, mode),
      start_date = COALESCE(${data.start_date ?? null}, start_date),
      end_date = COALESCE(${data.end_date ?? null}, end_date),
      session_time = COALESCE(${data.session_time ?? null}, session_time)
    WHERE id = ${id}
  `
}

export async function deleteBatch(id: string): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM batches WHERE id = ${id}`
}

export async function getBatch(id: string): Promise<Batch | null> {
  const sql = getDb()
  const rows = (await sql`SELECT * FROM batches WHERE id = ${id}`) as Batch[]
  return rows[0] ? normalizeBatch(rows[0]) : null
}

export async function getAttendanceForBatch(batchId: string): Promise<AttendanceRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM attendance WHERE batch_id = ${batchId}
    ORDER BY session_date ASC, student_name ASC
  `
  return (rows as AttendanceRecord[]).map(normalizeAttendance)
}

export async function getSessionsForBatch(batchId: string): Promise<Session[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM sessions WHERE batch_id = ${batchId} ORDER BY session_date ASC
  `
  return (rows as Session[]).map(normalizeSession)
}

export async function bulkInsertAttendance(records: Omit<AttendanceRecord,'id'|'created_at'>[]): Promise<number> {
  if (!records.length) return 0
  const sql = getDb()
  let inserted = 0
  for (const r of records) {
    try {
      const result = (await sql`
        INSERT INTO attendance (batch_id, student_name, session_date, join_time, leave_time, duration_min, session_start, raw_name, source_type)
        VALUES (${r.batch_id}, ${r.student_name}, ${r.session_date}, ${r.join_time}, ${r.leave_time}, ${r.duration_min}, ${r.session_start}, ${r.raw_name}, ${r.source_type})
        ON CONFLICT (batch_id, student_name, session_date, join_time, source_type) DO NOTHING
        RETURNING id
      `) as Array<{ id: string }>
      if (result.length > 0) inserted++
    } catch (e) {
      console.error('Insert error:', e)
    }
  }
  return inserted
}

export async function upsertSession(batchId: string, date: string, topic?: string): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO sessions (batch_id, session_date, topic)
    VALUES (${batchId}, ${date}, ${topic ?? null})
    ON CONFLICT (batch_id, session_date) DO NOTHING
  `
}

export async function logCsvUpload(data: Omit<CsvUpload,'id'|'uploaded_at'>): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO csv_uploads (batch_id, filename, source_type, date_range_start, date_range_end, records_added)
    VALUES (${data.batch_id}, ${data.filename}, ${data.source_type}, ${data.date_range_start}, ${data.date_range_end}, ${data.records_added})
  `
}

export async function getCsvUploads(batchId: string): Promise<CsvUpload[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM csv_uploads WHERE batch_id = ${batchId} ORDER BY uploaded_at DESC
  `
  return (rows as CsvUpload[]).map(normalizeCsvUpload)
}

export async function getExistingAttendanceDates(batchId: string): Promise<Set<string>> {
  const sql = getDb()
  const rows = (await sql`
    SELECT DISTINCT session_date FROM attendance WHERE batch_id = ${batchId}
  `) as Array<{ session_date: string }>
  return new Set(rows.map(row => dateOnly(row.session_date)))
}

// ── Dynamic Analytics (Real-time from Database) ─────────────────────────────

export async function getTotalStudentCount(instructorId?: string): Promise<number> {
  const sql = getDb()
  let rows
  if (instructorId) {
    rows = (await sql`
      SELECT COUNT(DISTINCT student_name) as count FROM attendance
      WHERE batch_id IN (SELECT id FROM batches WHERE instructor_id = ${instructorId})
    `) as Array<{ count: number }>
  } else {
    rows = (await sql`
      SELECT COUNT(DISTINCT student_name) as count FROM attendance
    `) as Array<{ count: number }>
  }
  return rows[0]?.count ?? 0
}

export async function getTotalSessionCount(instructorId?: string): Promise<number> {
  const sql = getDb()
  let rows
  if (instructorId) {
    rows = (await sql`
      SELECT COUNT(DISTINCT session_date) as count FROM sessions
      WHERE batch_id IN (SELECT id FROM batches WHERE instructor_id = ${instructorId})
    `) as Array<{ count: number }>
  } else {
    rows = (await sql`
      SELECT COUNT(DISTINCT session_date) as count FROM sessions
    `) as Array<{ count: number }>
  }
  return rows[0]?.count ?? 0
}

export async function getWeekdaySessionCount(instructorId?: string): Promise<number> {
  const sql = getDb()
  let rows
  if (instructorId) {
    rows = (await sql`
      SELECT COUNT(DISTINCT session_date) as count FROM attendance
      WHERE batch_id IN (SELECT id FROM batches WHERE instructor_id = ${instructorId})
      AND EXTRACT(DOW FROM session_date) BETWEEN 1 AND 5
    `) as Array<{ count: number }>
  } else {
    rows = (await sql`
      SELECT COUNT(DISTINCT session_date) as count FROM attendance
      WHERE EXTRACT(DOW FROM session_date) BETWEEN 1 AND 5
    `) as Array<{ count: number }>
  }
  return rows[0]?.count ?? 0
}

export async function getAverageAttendance(instructorId?: string): Promise<number> {
  const sql = getDb()
  let rows
  if (instructorId) {
    rows = (await sql`
      SELECT 
        ROUND(AVG(CASE 
          WHEN duration_min > 0 THEN 100 
          ELSE 0 
        END)) as avg
      FROM attendance
      WHERE batch_id IN (SELECT id FROM batches WHERE instructor_id = ${instructorId})
    `) as Array<{ avg: number }>
  } else {
    rows = (await sql`
      SELECT 
        ROUND(AVG(CASE 
          WHEN duration_min > 0 THEN 100 
          ELSE 0 
        END)) as avg
      FROM attendance
    `) as Array<{ avg: number }>
  }
  return rows[0]?.avg ?? 0
}

export async function getTotalAttendanceRecords(instructorId?: string): Promise<number> {
  const sql = getDb()
  let rows
  if (instructorId) {
    rows = (await sql`
      SELECT COUNT(*) as count FROM attendance
      WHERE batch_id IN (SELECT id FROM batches WHERE instructor_id = ${instructorId})
    `) as Array<{ count: number }>
  } else {
    rows = (await sql`
      SELECT COUNT(*) as count FROM attendance
    `) as Array<{ count: number }>
  }
  return rows[0]?.count ?? 0
}
