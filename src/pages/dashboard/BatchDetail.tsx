import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Calendar, Clock, Loader2, FileText } from 'lucide-react'
import { getBatch, getCsvUploads, getAttendanceForBatch, type Batch, type CsvUpload } from '@/lib/db'
import { Card } from '@/components/ui'
import { motion } from 'framer-motion'

const MODE_COLORS: Record<string, string> = {
  online: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  offline: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  hybrid: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default function BatchDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [uploads, setUploads] = useState<CsvUpload[]>([])
  const [studentCount, setStudentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!batchId) return
    setLoading(true)
    Promise.all([
      getBatch(batchId),
      getCsvUploads(batchId),
      getAttendanceForBatch(batchId),
    ])
      .then(([b, u, att]) => {
        if (!b) { setError('Batch not found'); return }
        setBatch(b)
        setUploads(u)
        const unique = new Set(att.map(r => r.student_name))
        setStudentCount(unique.size)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load batch'))
      .finally(() => setLoading(false))
  }, [batchId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#1de9b6] animate-spin" />
      </div>
    )
  }

  if (error || !batch) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
        {error || 'Batch not found.'}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => navigate('/dashboard/batches')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Batches
      </button>

      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center h-7 px-3 rounded-md text-sm font-mono font-bold text-[#1de9b6] bg-[#1de9b6]/10 border border-[#1de9b6]/20">
              {batch.batch_code || 'BATCH???'}
            </span>
            <span className={`inline-flex items-center h-7 px-3 rounded-md text-xs font-medium border ${MODE_COLORS[batch.mode] || ''}`}>
              {batch.mode.charAt(0).toUpperCase() + batch.mode.slice(1)}
            </span>
          </div>
          <button
            onClick={() => navigate(`/dashboard/upload?batchId=${batch.id}`)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
        </div>

        <h1 className="text-xl font-semibold text-foreground mb-1">{batch.name}</h1>
        {batch.description && (
          <p className="text-sm text-muted-foreground mb-4">{batch.description}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">Students</p>
            <p className="text-lg font-bold text-foreground">{studentCount}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">Uploads</p>
            <p className="text-lg font-bold text-foreground">{uploads.length}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Calendar className="w-3 h-3" />
              Start
            </div>
            <p className="text-sm font-semibold text-foreground">{batch.start_date}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Calendar className="w-3 h-3" />
              End
            </div>
            <p className="text-sm font-semibold text-foreground">{batch.end_date}</p>
          </div>
        </div>

        {batch.session_time && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Session time: {batch.session_time}</span>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Upload History
        </h2>
        {uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded yet for this batch.</p>
        ) : (
          <div className="space-y-2">
            {uploads.map((upload, i) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{upload.filename}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {upload.source_type} · {upload.records_added} records · {upload.date_range_start} – {upload.date_range_end}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(upload.uploaded_at).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
