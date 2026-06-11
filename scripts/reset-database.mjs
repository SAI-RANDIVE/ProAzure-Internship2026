import { readFileSync, existsSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

function loadEnvFile(path) {
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    process.env[key] ??= value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const databaseUrl = process.env.VITE_DATABASE_URL
if (!databaseUrl) {
  throw new Error('Missing VITE_DATABASE_URL in .env.local or environment.')
}

const sql = neon(databaseUrl)

const statements = [
  'DROP TABLE IF EXISTS attendance CASCADE',
  'DROP TABLE IF EXISTS csv_uploads CASCADE',
  'DROP TABLE IF EXISTS sessions CASCADE',
  'DROP TABLE IF EXISTS batches CASCADE',
  'DROP TABLE IF EXISTS instructors CASCADE',
  `CREATE TABLE instructors (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'instructor' CHECK (role IN ('master','instructor')),
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE batches (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id TEXT NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT,
    mode          TEXT NOT NULL CHECK (mode IN ('online','offline','hybrid')),
    start_date    DATE NOT NULL DEFAULT '2026-06-01',
    end_date      DATE NOT NULL DEFAULT '2026-08-30',
    session_time  TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id      UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    session_date  DATE NOT NULL,
    topic         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(batch_id, session_date)
  )`,
  `CREATE TABLE csv_uploads (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id      UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    filename      TEXT NOT NULL,
    source_type   TEXT NOT NULL DEFAULT 'zoom',
    date_range_start DATE,
    date_range_end   DATE,
    records_added INT DEFAULT 0,
    uploaded_at   TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE attendance (
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
  )`,
  'CREATE INDEX idx_attendance_batch ON attendance(batch_id)',
  'CREATE INDEX idx_attendance_date ON attendance(session_date)',
  'CREATE INDEX idx_attendance_name ON attendance(student_name)',
  'CREATE INDEX idx_sessions_batch ON sessions(batch_id)',
]

for (const statement of statements) {
  await sql(statement)
  console.log(`ok: ${statement.split(/\s+/).slice(0, 5).join(' ')}`)
}

console.log('Database reset complete. App tables are empty and schema is fresh.')
