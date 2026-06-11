import { EmptyState } from '@/components/ui'
import { Users } from 'lucide-react'

export default function Students() {
  return (
    <EmptyState
      icon={<Users className="w-8 h-8" />}
      title="Students"
      description="Upload a CSV to see student attendance data."
    />
  )
}
