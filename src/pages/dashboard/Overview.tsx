import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertCircle, BookOpen, Calendar, TrendingUp, Upload, Users } from 'lucide-react'
import { Badge, Card, EmptyState, StatCard } from '@/components/ui'
import { getAttendanceForBatch, getBatches, getSessionsForBatch, type Batch } from '@/lib/db'
import { computeDaySummaries, computeStudentSummaries, getExpectedWeekdays } from '@/lib/csvParser'
import { cn } from '@/lib/utils'

interface OutletContext {
  user: { name: string }
  effectiveInstructorId: string
  isMaster: boolean
}

interface OverviewData {
  totalStudents: number
  totalSessions: number
  avgAttendance: number
  totalRecords: number
  missingDays: number
  dailyData: { date: string; students: number; label: string }[]
  topStudents: { name: string; pct: number; days: number }[]
  durationSplit: { name: string; value: number }[]
  batchStats: { batch: Batch; students: number; sessions: number; avg: number }[]
}

const emptyData: OverviewData = {
  totalStudents: 0,
  totalSessions: 0,
  avgAttendance: 0,
  totalRecords: 0,
  missingDays: 0,
  dailyData: [],
  topStudents: [],
  durationSplit: [],
  batchStats: [],
}

export default function Overview() {
  const { user, effectiveInstructorId, isMaster } = useOutletContext<OutletContext>()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OverviewData>(emptyData)

  const loadData = useCallback(async () => {
    if (!effectiveInstructorId) {
      setBatches([])
      setData(emptyData)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const batchList = await getBatches(effectiveInstructorId)
      setBatches(batchList)
      if (!batchList.length) {
        setData(emptyData)
        return
      }

      const allRecords = []
      const allDailyMap = new Map<string, number>()
      const durationBuckets = { full: 0, partial: 0, brief: 0 }
      const batchStats: OverviewData['batchStats'] = []
      let totalRecords = 0
      let missingDays = 0

      for (const batch of batchList) {
        const [records, sessions] = await Promise.all([
          getAttendanceForBatch(batch.id),
          getSessionsForBatch(batch.id),
        ])
        const parsed = records.map(r => ({
          name: r.student_name,
          rawName: r.raw_name,
          date: r.session_date,
          join: r.join_time,
          leave: r.leave_time,
          dur: r.duration_min,
          sessionStart: r.session_start,
        }))

        allRecords.push(...parsed)
        totalRecords += parsed.length
        parsed.forEach(record => {
          allDailyMap.set(record.date, (allDailyMap.get(record.date) || 0) + 1)
          if (record.dur >= 90) durationBuckets.full++
          else if (record.dur >= 30) durationBuckets.partial++
          else durationBuckets.brief++
        })

        const days = computeDaySummaries(parsed)
        const expected = getExpectedWeekdays(batch.start_date, batch.end_date)
        const actual = new Set(days.map(day => day.date))
        missingDays += expected.filter(day => !actual.has(day)).length

        const totalDays = sessions.length || days.length
        const students = computeStudentSummaries(parsed, totalDays)
        batchStats.push({
          batch,
          students: students.length,
          sessions: totalDays,
          avg: students.length ? Math.round(students.reduce((sum, item) => sum + item.attendancePct, 0) / students.length) : 0,
        })
      }

      const totalSessionDays = new Set(allRecords.map(record => record.date)).size
      const dailyData = [...allDailyMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-20)
        .map(([date, students]) => ({
          date,
          students,
          label: new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        }))

      const topStudents = computeStudentSummaries(allRecords, totalSessionDays)
        .slice(0, 8)
        .map(student => ({ name: student.name, pct: student.attendancePct, days: student.daysAttended }))

      setData({
        totalStudents: new Set(allRecords.map(record => record.name)).size,
        totalSessions: totalSessionDays,
        avgAttendance: batchStats.length ? Math.round(batchStats.reduce((sum, item) => sum + item.avg, 0) / batchStats.length) : 0,
        totalRecords,
        missingDays,
        dailyData,
        topStudents,
        durationSplit: [
          { name: 'Full (90+)', value: durationBuckets.full },
          { name: 'Partial (30-89)', value: durationBuckets.partial },
          { name: 'Brief (<30)', value: durationBuckets.brief },
        ],
        batchStats,
      })
    } finally {
      setLoading(false)
    }
  }, [effectiveInstructorId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) return <OverviewSkeleton />

  if (!batches.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title={isMaster && !effectiveInstructorId ? 'No instructors yet' : 'No batches yet'}
          description={isMaster && !effectiveInstructorId ? 'Ask instructors to sign in once, then select them from the CEO view.' : 'Create your first batch to start tracking attendance.'}
          action={
            !isMaster || effectiveInstructorId ? (
              <Link to="/dashboard/batches/new">
                <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
                  Create first batch
                </button>
              </Link>
            ) : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Welcome back, {user?.name?.split(' ')[0] || 'Instructor'}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Web Internship 2026 · Jun 1 - Aug 30, 2026</p>
          </div>
          {data.missingDays > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {data.missingDays} session{data.missingDays > 1 ? 's' : ''} missing CSV
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={data.totalStudents} sub="across selected batches" icon={<Users className="w-4 h-4" />} color="bg-blue-500/10 text-blue-500" />
        <StatCard title="Sessions Held" value={data.totalSessions} sub="uploaded weekdays" icon={<Calendar className="w-4 h-4" />} color="bg-[#1de9b6]/10 text-[#1de9b6]" />
        <StatCard title="Avg Attendance" value={`${data.avgAttendance}%`} sub="batch average" icon={<TrendingUp className="w-4 h-4" />} color="bg-purple-500/10 text-purple-500" />
        <StatCard title="Total Records" value={data.totalRecords.toLocaleString()} sub="attendance entries" icon={<Upload className="w-4 h-4" />} color="bg-orange-500/10 text-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Daily Attendance</h3>
              <p className="text-xs text-muted-foreground">Students present per uploaded session day</p>
            </div>
            <Badge variant="outline">{data.dailyData.length} days</Badge>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2979ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2979ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="students" stroke="#2979ff" strokeWidth={2} fill="url(#attendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-foreground text-sm">Duration Split</h3>
          <p className="text-xs text-muted-foreground mb-4">Session length distribution</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.durationSplit} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                  {data.durationSplit.map((_, i) => <Cell key={i} fill={['#1de9b6', '#f59e0b', '#ef4444'][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {data.durationSplit.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Top Attendees</h3>
            <Link to="/dashboard/students" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {data.topStudents.map((student, index) => (
              <div key={student.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${student.pct}%`, background: 'linear-gradient(90deg, #1de9b6, #2979ff)' }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{student.pct}%</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{student.days}d</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Batches</h3>
            <Link to="/dashboard/batches" className="text-xs text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {data.batchStats.map(({ batch, students, sessions, avg }) => (
              <Link key={batch.id} to={`/dashboard/batches/${batch.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2979ff, #1de9b6)' }}>
                  {batch.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{batch.name}</p>
                    <Badge variant={batch.mode === 'online' ? 'accent' : batch.mode === 'offline' ? 'success' : 'warning'}>{batch.mode}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{students} students · {sessions} sessions</p>
                </div>
                <p className={cn('text-sm font-semibold', avg >= 70 ? 'text-success' : avg >= 40 ? 'text-warning' : 'text-destructive')}>{avg}%</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-64 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    </div>
  )
}
