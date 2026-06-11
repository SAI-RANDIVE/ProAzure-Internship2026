export type AttendanceSource = 'zoom' | 'google-meet' | 'zoom-meet' | 'auto'
export type DetectedFormat = 'zoom' | 'google-meet' | 'mixed' | 'unknown'

export interface ParsedRecord {
  name: string
  rawName: string
  date: string // YYYY-MM-DD
  join: string // HH:MM
  leave: string
  dur: number
  sessionStart: string
  sourceType: 'zoom' | 'google-meet'
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
  'Xiaomi Poco M2 Pro', 'Iphone', 'Iphone 16', 'Pc', 'Unknown Device',
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
  const trimmed = s.replace(/^\*?\s*/, '').trim()
  let d = new Date(trimmed)
  if (!isNaN(d.getTime())) return d
  // Try MM/DD/YYYY HH:MM:SS AM/PM
  const m = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i)
  if (m) {
    let h = parseInt(m[4])
    if (m[7].toUpperCase() === 'PM' && h < 12) h += 12
    if (m[7].toUpperCase() === 'AM' && h === 12) h = 0
    return new Date(+m[3], +m[1] - 1, +m[2], h, +m[5], +m[6])
  }
  // Try YYYY-MM-DD HH:MM[:SS]
  const isoLike = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (isoLike) {
    return new Date(+isoLike[1], +isoLike[2] - 1, +isoLike[3], +isoLike[4], +isoLike[5], +(isoLike[6] || 0))
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
  dates: string[]
  newDates: string[]
  weekendSkipped: number
  hostSkipped: number
  deviceSkipped: number
  duplicateRecords: number
  format: string
  detectedFormat: DetectedFormat
}

function emptyParseResult(format: DetectedFormat = 'unknown'): ParseResult {
  return {
    records: [],
    weekendSkipped: 0,
    hostSkipped: 0,
    deviceSkipped: 0,
    dates: [],
    newDates: [],
    duplicateRecords: 0,
    format,
    detectedFormat: format,
  }
}

function resultFor(records: ParsedRecord[], existingDates: Set<string>, counters: Pick<ParseResult, 'weekendSkipped' | 'hostSkipped' | 'deviceSkipped' | 'duplicateRecords'>, format: DetectedFormat): ParseResult {
  const allDates = [...new Set(records.map(r => r.date))].sort()
  const newDates = allDates.filter(d => !existingDates.has(d))
  return { records, dates: allDates, newDates, format, detectedFormat: format, ...counters }
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60 * 1000)
}

function normalizeHeaders(text: string): string[] {
  const firstLine = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').find(line => line.trim()) || ''
  return splitCsvLine(firstLine).map(h => h.toLowerCase().trim())
}

function detectCsvFormat(text: string): DetectedFormat {
  const lower = text.slice(0, 3000).toLowerCase()
  const headers = normalizeHeaders(text)
  const looksZoom = headers.includes('topic') && headers.some(h => h.includes('join time')) && headers.some(h => h.includes('name'))
  const looksMeet = lower.includes('meet') && lower.includes('meeting code') && lower.includes('full name')
  if (looksZoom && looksMeet) return 'mixed'
  if (looksZoom) return 'zoom'
  if (looksMeet) return 'google-meet'
  return 'unknown'
}

function parseZoomCsvInternal(text: string, existingDates: Set<string>): ParseResult {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return emptyParseResult('unknown')

  const headers = splitCsvLine(lines[0])
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim())
  const findHeader = (...matchers: Array<(header: string, index: number) => boolean>) => {
    for (const matcher of matchers) {
      const index = normalizedHeaders.findIndex(matcher)
      if (index !== -1) return index
    }
    return -1
  }
  
  // Flexible column detection
  const nameKey = findHeader(
    h => h.includes('original name'),
    h => h === 'participant' || h === 'participant name' || h === 'user name',
    h => h.includes('participant') && h.includes('name'),
    h => h === 'name'
  )
  const joinKey = findHeader(
    h => h === 'join time',
    h => h.includes('join'),
    h => h.includes('entry')
  )
  const leaveKey = findHeader(
    h => h === 'leave time',
    h => h.includes('leave'),
    h => h.includes('exit')
  )
  const durIdx = findHeader(
    (h, index) => h.includes('duration') && index > joinKey,
    h => h.includes('participant') && h.includes('minutes'),
    h => h === 'duration'
  )
  const startKey = findHeader(
    h => h === 'start time',
    h => h.includes('session start')
  )
  const hostNameKey = findHeader(h => h === 'host name')

  if (nameKey === -1 || joinKey === -1) {
    throw new Error(`Invalid CSV format. Could not find name and join/entry columns. Headers: ${headers.join(', ')}`)
  }

  const records: ParsedRecord[] = []
  let weekendSkipped = 0
  let hostSkipped = 0
  let deviceSkipped = 0
  let duplicateRecords = 0
  const seen = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const parts = splitCsvLine(lines[i])

    const rawName = (parts[nameKey] || '').trim()
    if (!rawName) continue

    const hostName = hostNameKey !== -1 ? (parts[hostNameKey] || '').trim().toLowerCase() : ''
    const rawNameLower = rawName.toLowerCase()
    if (rawNameLower.includes('host') || (hostName && rawNameLower === hostName)) { hostSkipped++; continue }

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

    // Create unique key to detect duplicates
    const recordKey = `${name}|${fmtDate(joinDt)}|${fmtTime(joinDt)}`
    if (seen.has(recordKey)) {
      duplicateRecords++
      continue
    }
    seen.add(recordKey)

    records.push({
      name,
      rawName: titleCase(rawName),
      date: fmtDate(joinDt),
      join: fmtTime(joinDt),
      leave: leaveDt ? fmtTime(leaveDt) : '',
      dur,
      sessionStart: startDt ? fmtTime(startDt) : '',
      sourceType: 'zoom',
    })
  }

  return resultFor(records, existingDates, { weekendSkipped, hostSkipped, deviceSkipped, duplicateRecords }, 'zoom')
}

function parseGoogleMeetCsvInternal(text: string, existingDates: Set<string>, defaultDurationMin: number): ParseResult {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return emptyParseResult('google-meet')

  let meetingStart: Date | null = null
  let meetingEnd: Date | null = null
  let nameStart = -1

  for (let i = 0; i < lines.length; i++) {
    const values = splitCsvLine(lines[i])
    const value = (values[0] || '').trim()
    const lower = value.toLowerCase()
    if (lower.includes('created on')) {
      meetingStart = parseDT(value.replace(/^\*?\s*created on\s*/i, ''))
    }
    if (lower.includes('ended on')) {
      meetingEnd = parseDT(value.replace(/^\*?\s*ended on\s*/i, ''))
    }
    if (lower === 'full name') {
      nameStart = i + 1
      break
    }
  }

  if (!meetingStart) {
    throw new Error('Invalid Google Meet CSV. Could not find the "Created on" meeting timestamp.')
  }
  if (nameStart === -1) {
    throw new Error('Invalid Google Meet CSV. Could not find the "Full Name" column.')
  }

  const effectiveDuration = Math.max(1, Math.round(defaultDurationMin || 1))
  if (!meetingEnd || meetingEnd <= meetingStart) {
    meetingEnd = addMinutes(meetingStart, effectiveDuration)
  }
  const durationMin = Math.max(1, Math.round((meetingEnd.getTime() - meetingStart.getTime()) / 60000))

  const records: ParsedRecord[] = []
  let weekendSkipped = 0
  let hostSkipped = 0
  let deviceSkipped = 0
  let duplicateRecords = 0
  const seen = new Set<string>()
  const dow = meetingStart.getDay()

  for (let i = nameStart; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const parts = splitCsvLine(lines[i])
    const rawName = (parts[0] || '').trim()
    if (!rawName) continue
    if (rawName.toLowerCase().includes('host')) { hostSkipped++; continue }

    const name = canonicalName(rawName)
    if (!name) { deviceSkipped++; continue }
    if (dow === 0 || dow === 6) { weekendSkipped++; continue }

    const recordKey = `${name}|${fmtDate(meetingStart)}|${fmtTime(meetingStart)}|google-meet`
    if (seen.has(recordKey)) {
      duplicateRecords++
      continue
    }
    seen.add(recordKey)

    records.push({
      name,
      rawName: titleCase(rawName),
      date: fmtDate(meetingStart),
      join: fmtTime(meetingStart),
      leave: fmtTime(meetingEnd),
      dur: durationMin,
      sessionStart: fmtTime(meetingStart),
      sourceType: 'google-meet',
    })
  }

  return resultFor(records, existingDates, { weekendSkipped, hostSkipped, deviceSkipped, duplicateRecords }, 'google-meet')
}

export function parseAttendanceCsv(
  text: string,
  existingDates: Set<string>,
  source: AttendanceSource = 'auto',
  options: { defaultMeetDurationMin?: number } = {}
): ParseResult {
  const detected = detectCsvFormat(text)
  const defaultMeetDurationMin = options.defaultMeetDurationMin ?? 120

  if (source === 'zoom') return parseZoomCsvInternal(text, existingDates)
  if (source === 'google-meet') return parseGoogleMeetCsvInternal(text, existingDates, defaultMeetDurationMin)
  if (source === 'zoom-meet') {
    if (detected === 'google-meet') return parseGoogleMeetCsvInternal(text, existingDates, defaultMeetDurationMin)
    if (detected === 'zoom') return parseZoomCsvInternal(text, existingDates)
    throw new Error('Could not detect Zoom or Google Meet data in this CSV.')
  }
  if (detected === 'google-meet') return parseGoogleMeetCsvInternal(text, existingDates, defaultMeetDurationMin)
  if (detected === 'zoom') return parseZoomCsvInternal(text, existingDates)
  throw new Error('Unknown attendance CSV format. Choose Zoom or Google Meet and upload a matching CSV.')
}

export function parseZoomCsv(text: string, existingDates: Set<string>): ParseResult {
  return parseZoomCsvInternal(text, existingDates)
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
