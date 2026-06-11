import { Card, Button } from '@/components/ui'
import { useState } from 'react'
import { AlertCircle, CheckCircle, Upload, Loader2 } from 'lucide-react'
import { parseZoomCsv } from '@/lib/csvParser'
import { getExistingAttendanceDates, bulkInsertAttendance, getAttendanceForBatch } from '@/lib/db'
import { motion } from 'framer-motion'

interface UploadResult {
  records: number
  newDates: number
  duplicateRecords: number
  weekendSkipped: number
  hostSkipped: number
  deviceSkipped: number
  inserted: number
}

export default function UploadCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batchId, setBatchId] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    const validTypes = ['.csv', '.xlsx', '.xls', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    const ext = selectedFile.name.split('.').pop()?.toLowerCase()
    
    if (!validTypes.includes(`.${ext}`) && !validTypes.includes(selectedFile.type)) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }
    
    setFile(selectedFile)
    setError(null)
    setResult(null)
    setSubmitted(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !batchId) {
      setError('Please select a file and batch')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      let csvText = ''
      const ext = file.name.split('.').pop()?.toLowerCase()
      
      if (ext === 'csv') {
        csvText = await file.text()
      } else if (ext === 'xlsx' || ext === 'xls') {
        // For Excel, we'll need a library, but for now show a message
        setError('Excel support coming soon. Please use CSV format.')
        setLoading(false)
        return
      } else {
        setError('Unsupported file format')
        setLoading(false)
        return
      }

      const existingDates = await getExistingAttendanceDates(batchId)
      const parseResult = parseZoomCsv(csvText, existingDates)
      
      // Check if file was already uploaded
      const existingRecords = await getAttendanceForBatch(batchId)
      const existingSet = new Set(
        existingRecords.map(r => `${r.student_name}|${r.session_date}|${r.join_time}`)
      )
      
      // Filter out duplicates
      const newRecords = parseResult.records.filter(r => 
        !existingSet.has(`${r.name}|${r.date}|${r.join}`)
      )

      if (newRecords.length === 0) {
        setResult({
          records: parseResult.records.length,
          newDates: parseResult.newDates.length,
          duplicateRecords: parseResult.duplicateRecords,
          weekendSkipped: parseResult.weekendSkipped,
          hostSkipped: parseResult.hostSkipped,
          deviceSkipped: parseResult.deviceSkipped,
          inserted: 0,
        })
        setError('All records in this file have already been uploaded.')
        setSubmitted(true)
        return
      }

      // Insert new records
      const attendanceRecords = newRecords.map(r => ({
        batch_id: batchId,
        student_name: r.name,
        session_date: r.date,
        join_time: r.join,
        leave_time: r.leave,
        duration_min: r.dur,
        session_start: r.sessionStart,
        raw_name: r.rawName,
      }))

      const inserted = await bulkInsertAttendance(attendanceRecords)

      setResult({
        records: parseResult.records.length,
        newDates: parseResult.newDates.length,
        duplicateRecords: parseResult.duplicateRecords,
        weekendSkipped: parseResult.weekendSkipped,
        hostSkipped: parseResult.hostSkipped,
        deviceSkipped: parseResult.deviceSkipped,
        inserted,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <h1 className="text-2xl font-semibold mb-2 text-white">Upload Attendance File</h1>
        <p className="text-sm text-white/60 mb-6">Upload Zoom meeting reports or attendance CSV/Excel files</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch ID Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Batch ID</label>
            <input
              type="text"
              placeholder="Enter batch ID (or paste from URL)"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
            />
            <p className="text-xs text-white/40 mt-1">Find batch ID in your batch list or dashboard URL</p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Attendance File</label>
            <div className="flex items-center justify-center px-6 py-12 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all">
              <label className="text-center cursor-pointer w-full">
                <Upload className="w-10 h-10 mx-auto mb-3 text-white/40" />
                <p className="text-sm font-medium text-white">Drop file here or click to browse</p>
                <p className="text-xs text-white/50 mt-1">CSV or Excel (.csv, .xlsx, .xls)</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* File Info */}
          {file && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-[#1de9b6]/10 border border-[#1de9b6]/20 rounded-lg"
            >
              <p className="text-sm font-medium text-white">📄 {file.name}</p>
              <p className="text-xs text-white/60 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Results */}
          {result && submitted && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-white/5 border border-white/10 rounded-lg space-y-3"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-[#1de9b6]" />
                <p className="font-semibold text-white">Upload Summary</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <p className="text-white/60 text-xs">Total Records</p>
                  <p className="text-white font-semibold">{result.records}</p>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <p className="text-white/60 text-xs">Inserted</p>
                  <p className="text-[#1de9b6] font-semibold">{result.inserted}</p>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <p className="text-white/60 text-xs">New Dates</p>
                  <p className="text-white font-semibold">{result.newDates}</p>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <p className="text-white/60 text-xs">Duplicates Skipped</p>
                  <p className="text-white/60 font-semibold">{result.duplicateRecords}</p>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <p className="text-white/60 text-xs">Weekend Records</p>
                  <p className="text-white/60 font-semibold">{result.weekendSkipped}</p>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <p className="text-white/60 text-xs">Hosts/Devices</p>
                  <p className="text-white/60 font-semibold">{result.hostSkipped + result.deviceSkipped}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              disabled={loading}
              onClick={() => {
                setFile(null)
                setResult(null)
                setError(null)
                setBatchId('')
              }}
            >
              Clear
            </Button>
            <Button 
              type="submit" 
              disabled={!file || !batchId || loading}
              className="bg-[#1de9b6] text-black hover:bg-[#1de9b6]/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Help Section */}
      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-white mb-3">ℹ️ How to upload</h3>
        <ul className="text-xs text-white/60 space-y-2">
          <li><span className="text-white/80">1.</span> Download Zoom meeting report as CSV</li>
          <li><span className="text-white/80">2.</span> Find your batch ID in the batches list</li>
          <li><span className="text-white/80">3.</span> Upload the file and click "Upload & Process"</li>
          <li><span className="text-white/80">4.</span> Duplicate records are automatically skipped</li>
          <li><span className="text-white/80">5.</span> Weekend dates are excluded (Mon-Fri only)</li>
        </ul>
      </Card>
    </div>
  )
}
