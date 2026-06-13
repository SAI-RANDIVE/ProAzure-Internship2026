import { Badge, Button, Card, EmptyState } from '@/components/ui'
import { displayDate } from '@/lib/csvParser'
import { getAttendanceForBatch, getBatches, getSessionsForBatch, type Batch } from '@/lib/db'
import { BookOpen, Calendar, Copy, Plus, Upload, Users, AlertCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

interface OutletContext {
  effectiveInstructorId: string
  isMaster: boolean
}

interface BatchRow {
  batch: Batch
  students: number
  sessions: number
  records: number
}

export default function Batches() {
  const { effectiveInstructorId, isMaster } = useOutletContext<OutletContext>()
  const [rows, setRows] = useState<BatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState('')

  const loadBatches = useCallback(async () => {
    if (!effectiveInstructorId) {
      setRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const batchList = await getBatches(effectiveInstructorId)
      const enriched = await Promise.all(batchList.map(async batch => {
        const [attendance, sessions] = await Promise.all([
          getAttendanceForBatch(batch.id),
          getSessionsForBatch(batch.id),
        ])
        return {
          batch,
          students: new Set(attendance.map(record => record.student_name)).size,
          sessions: sessions.length || new Set(attendance.map(record => String(record.session_date).slice(0, 10))).size,
          records: attendance.length,
        }
      }))
      setRows(enriched)
    } catch (err) {
      console.error("Failed to load batches:", err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while loading batches.')
    } finally {
      setLoading(false)
    }
  }, [effectiveInstructorId])

  useEffect(() => {
    loadBatches()
  }, [loadBatches])

  const copyBatchId = async (id: string) => {
    await navigator.clipboard.writeText(id)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(''), 1500)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-9 w-48 rounded-xl bg-muted" />
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-32 rounded-2xl bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <div>
          <h3 className="text-lg font-semibold text-red-500">Failed to load batches</h3>
          <p className="text-sm text-red-400 mt-1">{error}</p>
        </div>
        <Button onClick={loadBatches} variant="outline" className="mt-2 bg-transparent text-red-500 border-red-500/30 hover:bg-red-500/10">
          Try Again
        </Button>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <EmptyState
        icon={<BookOpen className="w-8 h-8" />}
        title={isMaster && !effectiveInstructorId ? 'No instructor selected' : 'No batches yet'}
        description={isMaster && !effectiveInstructorId ? 'Select an instructor from CEO view to see their batches.' : 'Create your first batch to start tracking attendance.'}
        action={
          !isMaster || effectiveInstructorId ? (
            <Link to="/dashboard/batches/new">
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
                <Plus className="w-4 h-4" />
                Create First Batch
              </button>
            </Link>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Batches</h2>
          <p className="text-sm text-muted-foreground">Select a batch ID from here when uploading attendance.</p>
        </div>
        <Link to="/dashboard/batches/new">
          <Button className="bg-[#1de9b6] text-black hover:bg-[#1de9b6]/90">
            <Plus className="w-4 h-4" />
            New Batch
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map(({ batch, students, sessions, records }) => (
          <Card key={batch.id} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{batch.name}</h3>
                  <Badge variant={batch.mode === 'online' ? 'accent' : batch.mode === 'offline' ? 'success' : 'warning'}>{batch.mode}</Badge>
                </div>
                {batch.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{batch.description}</p>}
              </div>
              <Link to={`/dashboard/upload?batchId=${batch.id}`}>
                <Button size="sm" variant="outline">
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <Users className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="font-semibold text-foreground">{students}</p>
                <p className="text-xs text-muted-foreground">students</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <Calendar className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="font-semibold text-foreground">{sessions}</p>
                <p className="text-xs text-muted-foreground">sessions</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <BookOpen className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="font-semibold text-foreground">{records}</p>
                <p className="text-xs text-muted-foreground">records</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Batch ID</p>
                  <p className="font-mono text-xs text-foreground truncate">{batch.id}</p>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => copyBatchId(batch.id)}>
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === batch.id ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{displayDate(batch.start_date)} to {displayDate(batch.end_date)}{batch.session_time ? ` · ${batch.session_time}` : ''}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}