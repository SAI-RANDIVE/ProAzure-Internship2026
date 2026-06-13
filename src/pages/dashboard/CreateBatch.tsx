import { Card, Button } from '@/components/ui'
import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { createBatch } from '@/lib/db'
import { motion } from 'framer-motion'

interface OutletContext {
  user: { id: string; name: string }
  effectiveInstructorId: string
  isMaster: boolean
}

export default function CreateBatch() {
  const navigate = useNavigate()
  const { effectiveInstructorId } = useOutletContext<OutletContext>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mode: 'online' as 'online' | 'offline' | 'hybrid',
    session_time: '10:00',
    start_date: '2026-06-01',
    end_date: '2026-08-30',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Batch name is required')
      return
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('End date must be after start date')
      return
    }

    setLoading(true)
    try {
      await createBatch({
        instructor_id: effectiveInstructorId,
        name: formData.name,
        description: formData.description,
        mode: formData.mode,
        session_time: formData.session_time,
        start_date: formData.start_date,
        end_date: formData.end_date,
      })
      navigate('/dashboard/batches')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <h1 className="text-2xl font-semibold mb-2 text-foreground">Create New Batch</h1>
        <p className="text-sm text-muted-foreground mb-6">Set up a new training batch with comprehensive details</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Batch Name *</label>
            <input
              type="text"
              placeholder="e.g., ProAzure Full-Stack Internship 2026"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              placeholder="Describe the batch, topics covered, etc."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent resize-none"
            />
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Mode *</label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({...formData, mode: e.target.value as 'online' | 'offline' | 'hybrid'})}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
            >
              <option value="online" className="bg-white text-gray-900">Online</option>
              <option value="offline" className="bg-white text-gray-900">Offline</option>
              <option value="hybrid" className="bg-white text-gray-900">Hybrid</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">End Date *</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
              />
            </div>
          </div>

          {/* Session Time */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Session Time *</label>
            <input
              type="time"
              value={formData.session_time}
              onChange={(e) => setFormData({...formData, session_time: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">Time when sessions typically occur</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => navigate('/dashboard/batches')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              loading={loading}
              className="bg-[#1de9b6] text-black hover:bg-[#1de9b6]/90 disabled:opacity-50"
            >
              Create Batch
            </Button>
          </div>
        </form>
      </Card>

      {/* Information */}
      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">📝 Batch Guidelines</h3>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li><span className="text-foreground/80">•</span> Give your batch a descriptive name for easy identification</li>
          <li><span className="text-foreground/80">•</span> Set accurate start and end dates covering your training period</li>
          <li><span className="text-foreground/80">•</span> Choose the session delivery mode (Online/Offline/Hybrid)</li>
          <li><span className="text-foreground/80">•</span> Set the time when daily sessions typically begin</li>
          <li><span className="text-foreground/80">•</span> You can upload attendance files after creating the batch</li>
        </ul>
      </Card>
    </div>
  )
}