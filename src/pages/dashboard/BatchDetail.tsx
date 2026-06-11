import { EmptyState } from '@/components/ui'
import { BookOpen } from 'lucide-react'

export default function BatchDetail() {
  return (
    <EmptyState
      icon={<BookOpen className="w-8 h-8" />}
      title="Batch Details"
      description="Select a batch to view details."
    />
  )
}
