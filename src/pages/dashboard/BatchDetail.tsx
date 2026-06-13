import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Users, Upload, Clock } from 'lucide-react'
import { Card, Badge, Button, EmptyState } from '@/components/ui'
import { getBatch, getAttendanceForBatch, getSessionsForBatch, type Batch } from '@/lib/db'

export default function BatchDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [stats, setStats] = useState({ students: 0, sessions: 0, records: 0 })
  const [loading, setLoading] = useState(true)

  const loadDetails = useCallback(async () => {
    if (!batchId) return
    setLoading(true)
    try {
      const b = await getBatch(batchId)
      setBatch(b)
      if (b) {
        const [att, sess] = await Promise.all([getAttendanceForBatch(batchId), getSessionsForBatch(batchId)])
        setStats({
          students: new Set(att.map(r => r.student_name)).size,
          sessions: sess.length || new Set(att.map(r => r.session_date.slice(0, 10))).size,
          records: att.length
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => { loadDetails() }, [loadDetails])

  if (loading) return <div className="h-40 bg-muted animate-pulse rounded-xl" />
  if (!batch) return <EmptyState title="Batch Not Found" description="The batch you are looking for does not exist." />

  return (
    <div className="space-y-6">
      <Link to="/dashboard/batches" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Batches
      </Link>

      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-border pb-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{batch.name}</h1>
              <Badge variant={batch.mode === 'online' ? 'accent' : 'outline'}>{batch.mode}</Badge>
            </div>
            <p className="text-muted-foreground text-sm font-mono">{batch.id}</p>
          </div>
          <Link to={`/dashboard/upload?batchId=${batch.id}`}>
            <Button className="bg-primary text-primary-foreground"><Upload className="w-4 h-4" /> Upload CSV</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted/30 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1"><Users className="w-4 h-4 inline mr-1"/> Students</p><p className="text-xl font-semibold">{stats.students}</p></div>
          <div className="p-4 bg-muted/30 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1"><Calendar className="w-4 h-4 inline mr-1"/> Sessions</p><p className="text-xl font-semibold">{stats.sessions}</p></div>
          <div className="p-4 bg-muted/30 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1"><Clock className="w-4 h-4 inline mr-1"/> Time</p><p className="text-xl font-semibold">{batch.session_time || 'N/A'}</p></div>
          <div className="p-4 bg-muted/30 rounded-xl border border-border"><p className="text-xs text-muted-foreground mb-1">Start Date</p><p className="text-xl font-semibold">{batch.start_date.slice(5)}</p></div>
        </div>

        {batch.description && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{batch.description}</p>
          </div>
        )}
      </Card>
    </div>
  )
}