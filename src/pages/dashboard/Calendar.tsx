import { EmptyState } from '@/components/ui'
import { Calendar } from 'lucide-react'

export default function CalendarPage() {
  return (
    <EmptyState
      icon={<Calendar className="w-8 h-8" />}
      title="Calendar"
      description="View and manage your session schedule."
    />
  )
}
