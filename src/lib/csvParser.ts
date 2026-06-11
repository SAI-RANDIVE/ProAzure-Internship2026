export interface ParsedRecord {
  name: string
  rawName: string
  date: string // YYYY-MM-DD
  join: string // HH:MM
  leave: string
  dur: number
  sessionStart: string
}

// Name normalization map
const NAME_MAP: Record<string, string> = {
  'Abhay Dhas': 'Abhay Dhas',
  'Aditya ( Aditya Mahagavkar )': 'Aditya Mahagavkar',
  'Aditya Mahagavkar': 'Aditya Mahagavkar',
  'Adwait Ghosale ( Realme Rmx5030 )': 'Adwait Ghosale',
  'Hitesh Kapure ( Hitesh Kapure )': 'Hitesh Kapure',
  'Iqoo Z10 Elite': 'Vaishnav Subash',
  'Iqoo Z10 Elite ( Vaishnav )': 'Vaishnav Subash',
  'Iqoo Z10 Elite ( Vaishnav Subash )': 'Vaishnav Subash',
  'Krushna Patil ( Krushna Patil )': 'Krushna Patil',
  'Nothing Phone 3A ( Vighnesh Jagadale )': 'Vighnesh Jagadale',
  '#Sarthak Amkar': 'Sarthak Amkar',
  '..#...#...# ( Krushna Patil )': 'Krushna Patil',
  '35/10F Vighanesh Santosh Talekar': 'Vighanesh Santosh Talekar',
  'Vighanesh Santosh Talekar': 'Vighanesh Santosh Talekar',
  'Manthan Jadhav Std:8': 'Manthan Jadhav',
  'Pirjade Aavez': 'Aavez Pirjade',
  'Siddhi Deolalikar Co Adsul': 'Siddhi Deolalikar',
  'Ayush Sharma-': 'Ayush Sharma',
  'Ajit339': 'Ajit',
  'Ronit': 'Ronit Patil',
}

const SKIP_NAMES = new Set([
  'Xiaomi Poco M2 Pro', 'Iphone 16', 'Pc', 'Unknown Device',
])

function titleCase(s: string): string {
  return s.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

export function canonicalName(raw: string): string | null {
  const t = titleCase(raw.trim())
  if (SKIP_NAMES.has(t)) return null
  return NAME_MAP[t] ?? t
}

function splitCsvLine(line: string): string[] {
  const res: string[] = []
  let cur = ''
  let inQ = false
  for (const c of line) {
    if (c === '"') { inQ = !inQ }
    else if (c === ',' && !inQ) { res.push(cur); cur = '' }
    else { cur += c }
  }
  res.push(cur)
  return res.map(s => s.replace(/^"|"$/g, '').trim())
}

function parseDT(s: string): Date | null {
  if (!s) return null
  let d = new Date(s)
  if (!isNaN(d.getTime())) return d
  // Try MM/DD/YYYY HH:MM:SS AM/PM
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i)
  if (m) {
    let h = parseInt(m[4])
    if (m[7].toUpperCase() === 'PM' && h < 12) h += 12
    if (m[7].toUpperCase() === 'AM' && h === 12) h = 0
    return new Date(+m[3], +m[1] - 1, +m[2], h, +m[5], +m[6])
  }
  return null
}

function fmtDate(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

function fmtTime(d: Date): string {
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

export interface ParseResult {
  records: ParsedRecord[]
  weekendSkipped: number
  hostSkipped: number
  deviceSkipped: number
  dates: string[]
  newDates: string[]
}

export function parseZoomCsv(text: string, existingDates: Set<string>): ParseResult {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return { records: [], weekendSkipped: 0, hostSkipped: 0, deviceSkipped: 0, dates: [], newDates: [] }

  const headers = splitCsvLine(lines[0])
  const nameKey = headers.findIndex(h => h.toLowerCase().includes('name (original'))
  const joinKey = headers.findIndex(h => h.toLowerCase().startsWith('join'))
  const leaveKey = headers.findIndex(h => h.toLowerCase().startsWith('leave'))
  const durIdx = (() => {
    const i = headers.findIndex(h => h.toLowerCase().includes('duration') && h.includes('.1'))
    if (i !== -1) return i
    return headers.findIndex(h => h.toLowerCase().includes('duration (minutes)') && !h.toLowerCase().includes('total'))
  })()
  const startKey = headers.findIndex(h => h.toLowerCase().startsWith('start'))

  if (nameKey === -1 || joinKey === -1) {
    throw new Error('Invalid Zoom CSV format. Expected "Name (original name)" and "Join time" columns.')
  }

  const records: ParsedRecord[] = []
  let weekendSkipped = 0
  let hostSkipped = 0
  let deviceSkipped = 0

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const parts = splitCsvLine(lines[i])

    const rawName = (parts[nameKey] || '').trim()
    if (!rawName) continue

    if (rawName.toLowerCase().includes('host')) { hostSkipped++; continue }

    const name = canonicalName(rawName)
    if (!name) { deviceSkipped++; continue }

    const joinDt = parseDT(parts[joinKey] || '')
    if (!joinDt) continue

    // Skip weekends (0=Sun, 6=Sat)
    const dow = joinDt.getDay()
    if (dow === 0 || dow === 6) { weekendSkipped++; continue }

    const leaveDt = parseDT(parts[leaveKey] || '')
    const startDt = parseDT(parts[startKey] || '')
    const dur = parseInt(parts[durIdx] || '0') || 0
    if (dur <= 0) continue

    records.push({
      name,
      rawName: titleCase(rawName),
      date: fmtDate(joinDt),
      join: fmtTime(joinDt),
      leave: leaveDt ? fmtTime(leaveDt) : '',
      dur,
      sessionStart: startDt ? fmtTime(startDt) : '',
    })
  }

  const allDates = [...new Set(records.map(r => r.date))].sort()
  const newDates = allDates.filter(d => !existingDates.has(d))

  return { records, weekendSkipped, hostSkipped, deviceSkipped, dates: allDates, newDates }
}

// ── Analytics helpers ─────────────────────────────────────────────────────────
export interface StudentSummary {
  name: string
  daysAttended: number
  totalMins: number
  avgMins: number
  records: number
  attendancePct: number
}

export interface DaySummary {
  date: string
  studentsPresent: number
  totalRecords: number
  totalMins: number
  avgMins: number
}

export function computeStudentSummaries(records: ParsedRecord[], totalDays: number): StudentSummary[] {
  const map = new Map<string, ParsedRecord[]>()
  for (const r of records) {
    if (!map.has(r.name)) map.set(r.name, [])
    map.get(r.name)!.push(r)
  }
  return [...map.entries()].map(([name, recs]) => {
    const daysSet = new Set(recs.map(r => r.date))
    const totalMins = recs.reduce((s, r) => s + r.dur, 0)
    return {
      name,
      daysAttended: daysSet.size,
      totalMins,
      avgMins: recs.length ? Math.round(totalMins / recs.length) : 0,
      records: recs.length,
      attendancePct: totalDays > 0 ? Math.round(daysSet.size / totalDays * 100) : 0,
    }
  }).sort((a, b) => b.daysAttended - a.daysAttended || b.totalMins - a.totalMins)
}

export function computeDaySummaries(records: ParsedRecord[]): DaySummary[] {
  const map = new Map<string, ParsedRecord[]>()
  for (const r of records) {
    if (!map.has(r.date)) map.set(r.date, [])
    map.get(r.date)!.push(r)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, recs]) => {
    const students = new Set(recs.map(r => r.name)).size
    const totalMins = recs.reduce((s, r) => s + r.dur, 0)
    return {
      date,
      studentsPresent: students,
      totalRecords: recs.length,
      totalMins,
      avgMins: recs.length ? Math.round(totalMins / recs.length) : 0,
    }
  })
}

// Generate expected weekday dates between start and end
export function getExpectedWeekdays(startDate: string, endDate: string): string[] {
  const result: string[] = []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const cur = new Date(start)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  while (cur <= end && cur <= today) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) {
      result.push(fmtDate(cur))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

export function displayDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function displayDayName(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })
}

export function displayTime(t: string): string {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ap}`
}

export function remarkLabel(dur: number): { label: string; color: string } {
  if (dur >= 90) return { label: 'Full Session', color: 'success' }
  if (dur >= 30) return { label: 'Partial', color: 'warning' }
  return { label: 'Brief Join', color: 'destructive' }
}
