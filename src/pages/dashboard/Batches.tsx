import { useEffect, useState } from 'react'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Upload, Calendar, Clock, Loader2, Trash2, Eye } from 'lucide-react'
import { getBatches, deleteBatch, type Batch } from '@/lib/db'
import { EmptyState } from '@/components/ui'
import { motion } from 'framer-motion'

interface OutletContext {
  user: { id: string; name: string }
  effectiveInstructorId: string
  isMaster: boolean
}

const MODE_COLORS: Record<string, string> = {
  online: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  offline: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  hybrid: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default function Batches() {
  const { effectiveInstructorId } = useOutletContext<OutletContext>()
  const navigate = useNavigate()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!effectiveInstructorId) return
    setLoading(true)
    getBatches(effectiveInstructorId)
      .then(setBatches)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load batches'))
      .finally(() => setLoading(false))
  }, [effectiveInstructorId])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this batch? All attendance data will be permanently removed.')) return
    setDeletingId(id)
    try {
      await deleteBatch(id)
      setBatches(prev => prev.filter(b => b.id !== id))
    } catch {
      alert('Failed to delete batch.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#1de9b6] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
        {error}
      </div>
    )
  }

  if (batches.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="w-8 h-8" />}
        title="No batches yet"
        description="Create your first batch to start tracking attendance."
        action={
          <Link to="/dashboard/batches/new">
            <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
              <Plus className="w-4 h-4" />
              Create First Batch
            </button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Batches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{batches.length} batch{batches.length !== 1 ? 'es' : ''} total</p>
        </div>
        <Link to="/dashboard/batches/new">
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
            <Plus className="w-4 h-4" />
            New Batch
          </button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {batches.map((batch, i) => (
          <motion.div
            key={batch.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative bg-card border border-border rounded-2xl p-5 hover:border-[#1de9b6]/30 hover:bg-card/80 transition-all cursor-pointer"
            onClick={() => navigate(`/dashboard/batches/${batch.id}`)}
          >
            {/* Batch Code Badge */}
            <div className="flex items-start justify-between mb-3">
              <span className="inline-flex items-center h-6 px-2.5 rounded-md text-xs font-mono font-bold text-[#1de9b6] bg-[#1de9b6]/10 border border-[#1de9b6]/20">
                {batch.batch_code || 'BATCH???'}
              </span>
              <span className={`inline-flex items-center h-6 px-2.5 rounded-md text-xs font-medium border ${MODE_COLORS[batch.mode] || 'bg-gray-500/10 text-gray-400'}`}>
                {batch.mode.charAt(0).toUpperCase() + batch.mode.slice(1)}
              </span>
            </div>

            {/* Batch Name */}
            <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug line-clamp-2">
              {batch.name}
            </h3>

            {batch.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{batch.description}</p>
            )}

            {/* Date Range */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{batch.start_date} – {batch.end_date}</span>
            </div>

            {batch.session_time && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{batch.session_time}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(`/dashboard/upload?batchId=${batch.id}`)
                }}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium bg-[#1de9b6]/10 text-[#1de9b6] border border-[#1de9b6]/20 hover:bg-[#1de9b6]/20 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload CSV
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(`/dashboard/batches/${batch.id}`)
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleDelete(batch.id, e)}
                disabled={deletingId === batch.id}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-colors disabled:opacity-50"
              >
                {deletingId === batch.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
