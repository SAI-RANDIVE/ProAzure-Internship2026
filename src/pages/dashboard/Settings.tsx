import { EmptyState } from '@/components/ui'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <EmptyState
      icon={<Settings className="w-8 h-8" />}
      title="Settings"
      description="Manage your profile and preferences."
    />
  )
}
