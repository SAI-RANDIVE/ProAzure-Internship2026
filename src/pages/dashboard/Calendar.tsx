import { useCallback, useEffect, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { Calendar as CalendarIcon, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { Card, Badge, EmptyState } from '@/components/ui'
import { getBatches, getSessionsForBatch, type Batch } from '@/lib/db'

interface OutletContext {
  effectiveInstructorId: string
}

interface SessionEntry {
  date: string
  batch: Batch
}

export default function Calendar() {
  const { effectiveInstructorId } = useOutletContext<OutletContext>()
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCalendar = useCallback(async () => {
    if (!effectiveInstructorId) {
      setSessions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const batches = await getBatches(effectiveInstructorId)
      let allSessions: SessionEntry[] = []

      for (const batch of batches) {
        const batchSessions = await getSessionsForBatch(batch.id)
        const entries = batchSessions.map(s => ({
          date: s.session_date,
          batch
        }))
        allSessions = [...allSessions, ...entries]
      }

      // Sort by date descending (newest first)
      allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setSessions(allSessions)
    } catch (err) {
      console.error('Failed to load calendar:', err)
      setError(err instanceof Error ? err.message : 'Failed to load calendar data.')
    } finally {
      setLoading(false)
    }
  }, [effectiveInstructorId])

  useEffect(() => {
    loadCalendar()
  }, [loadCalendar])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-xl" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    )
  }

  if (!sessions.length) {
    return (
      <EmptyState
        icon={<CalendarIcon className="w-8 h-8" />}
        title="No schedule found"
        description="Upload attendance files to automatically generate your session calendar."
      />
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Session Calendar</h2>
        <p className="text-sm text-muted-foreground">Timeline of all recorded batch sessions</p>
      </div>

      <div className="space-y-3">
        {sessions.map((session, i) => {
          const dateObj = new Date(session.date)
          const formattedDate = dateObj.toLocaleDateString('en-GB', { 
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' 
          })

          return (
            <Link key={`${session.batch.id}-${session.date}-${i}`} to={`/dashboard/batches/${session.batch.id}`}>
              <Card className="flex items-center justify-between p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                    <span className="text-xs font-semibold text-primary">{dateObj.toLocaleDateString('en-GB', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-foreground leading-none">{dateObj.getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {session.batch.name}
                      <Badge variant={session.batch.mode === 'online' ? 'accent' : 'outline'} className="text-[10px]">
                        {session.batch.mode}
                      </Badge>
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {formattedDate}
                      </span>
                      {session.batch.session_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.batch.session_time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}