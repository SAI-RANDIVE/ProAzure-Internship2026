import { Card, Input, Select, Button } from '@/components/ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBatch } from '@/lib/db'

export default function CreateBatch() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    mode: 'online' as const,
    session_time: '10:00',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createBatch({
        instructor_id: 'temp-user',
        name: formData.name,
        mode: formData.mode,
        session_time: formData.session_time,
        start_date: '2026-06-01',
        end_date: '2026-08-30',
      })
      navigate('/dashboard/batches')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Create New Batch</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Batch Name"
            placeholder="e.g., Web Development Internship"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          
          <Select
            label="Mode"
            value={formData.mode}
            onChange={(e) => setFormData({...formData, mode: e.target.value as 'online' | 'offline' | 'hybrid'})}>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </Select>

          <Input
            label="Session Time"
            type="time"
            value={formData.session_time}
            onChange={(e) => setFormData({...formData, session_time: e.target.value})}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard/batches')}>Cancel</Button>
            <Button loading={loading}>Create Batch</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
