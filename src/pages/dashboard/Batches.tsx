import { EmptyState } from '@/components/ui'
import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Batches() {
  return (
    <EmptyState
      icon={<BookOpen className="w-8 h-8" />}
      title="No batches yet"
      description="Create your first batch to start tracking attendance."
      action={
        <Link to="/dashboard/batches/new">
          <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
            Create First Batch
          </button>
        </Link>
      }
    />
  )
}
