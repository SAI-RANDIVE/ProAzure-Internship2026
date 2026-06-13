import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AlertCircle, Search, Users } from 'lucide-react'
import { Badge, Card, EmptyState } from '@/components/ui'
import { getBatches, getAttendanceForBatch } from '@/lib/db'

interface OutletContext {
  effectiveInstructorId: string
  isMaster: boolean
}

interface StudentAggregate {
  name: string
  batches: Set<string>
  sessionsAttended: Set<string>
  totalDuration: number
}

export default function Students() {
  const { effectiveInstructorId, isMaster } = useOutletContext<OutletContext>()
  const [students, setStudents] = useState<StudentAggregate[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStudents = useCallback(async () => {
    if (!effectiveInstructorId) {
      setStudents([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const batches = await getBatches(effectiveInstructorId)
      const studentMap = new Map<string, StudentAggregate>()

      for (const batch of batches) {
        const records = await getAttendanceForBatch(batch.id)
        records.forEach(r => {
          if (!studentMap.has(r.student_name)) {
            studentMap.set(r.student_name, {
              name: r.student_name,
              batches: new Set(),
              sessionsAttended: new Set(),
              totalDuration: 0,
            })
          }
          const student = studentMap.get(r.student_name)!
          student.batches.add(batch.name)
          student.sessionsAttended.add(r.session_date)
          student.totalDuration += r.duration_min
        })
      }

      setStudents(Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name)))
    } catch (err) {
      console.error('Failed to load students:', err)
      setError(err instanceof Error ? err.message : 'Failed to load students.')
    } finally {
      setLoading(false)
    }
  }, [effectiveInstructorId])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-full md:w-72 bg-muted rounded-xl" />
        <div className="h-96 bg-muted rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
        <p className="text-red-500 font-semibold">Error Loading Students</p>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!students.length) {
    return (
      <EmptyState
        icon={<Users className="w-8 h-8" />}
        title="No students found"
        description="Upload CSV attendance files to your batches to populate this list."
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Students</h2>
          <p className="text-sm text-muted-foreground">{students.length} total students tracked</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Student Name</th>
                <th className="px-6 py-4 font-medium">Batches</th>
                <th className="px-6 py-4 font-medium">Days Attended</th>
                <th className="px-6 py-4 font-medium text-right">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student) => (
                <tr key={student.name} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{student.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(student.batches).map(b => (
                        <Badge key={b} variant="outline" className="text-[10px]">{b}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{student.sessionsAttended.size} days</td>
                  <td className="px-6 py-4 text-right font-medium text-foreground">
                    {(student.totalDuration / 60).toFixed(1)}h
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No students match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}