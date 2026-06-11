import { Card, Button } from '@/components/ui'
import { useState } from 'react'
import { AlertCircle, CheckCircle, Upload, Loader2, Video, Users } from 'lucide-react'
import { type AttendanceSource, parseAttendanceCsv } from '@/lib/csvParser'
import { getExistingAttendanceDates, bulkInsertAttendance, getAttendanceForBatch, logCsvUpload, upsertSession } from '@/lib/db'
import { motion } from 'framer-motion'
import readXlsxFile, { type Row } from 'read-excel-file/browser'

type UploadSource = Exclude<AttendanceSource, 'auto'>

const ACCEPTED_EXTENSIONS = ['csv', 'xlsx', 'xls']
const ACCEPTED_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

interface UploadResult {
  records: number
  newDates: number
  duplicateRecords: number
  weekendSkipped: number
  hostSkipped: number
  deviceSkipped: number
  inserted: number
  source: string
  detectedFormat: string
}

export default function UploadCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batchId, setBatchId] = useState('')
  const [sourceType, setSourceType] = useState<UploadSource>('zoom')
  const [meetDuration, setMeetDuration] = useState(120)

  const normalizeBatchId = (value: string) => {
    const trimmed = value.trim()
    const uuid = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)
    return uuid?.[0] ?? trimmed
  }

  const csvEscape = (value: unknown) => {
    let text = ''
    if (value instanceof Date) {
      const hours = value.getHours()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const hour12 = hours % 12 || 12
      text = `${String(value.getMonth() + 1).padStart(2, '0')}/${String(value.getDate()).padStart(2, '0')}/${value.getFullYear()} ${String(hour12).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')} ${ampm}`
    } else {
      text = String(value ?? '')
    }
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const spreadsheetToCsv = async (selectedFile: File) => {
    const sheets = await readXlsxFile(selectedFile)
    const rows = sheets.find(sheet => sheet.data.some(row => row.some(cell => String(cell ?? '').trim())))?.data ?? []
    const meaningfulRows = rows.filter((row: Row) => row.some(cell => String(cell ?? '').trim()))
    if (!meaningfulRows.length) {
      throw new Error('The Excel file does not contain any readable attendance rows.')
    }
    return meaningfulRows.map(row => row.map(csvEscape).join(',')).join('\n')
  }

  const readLegacyExcelLikeText = async (selectedFile: File) => {
    const text = await selectedFile.text()
    if (!text.trim() || text.includes('\u0000')) {
      throw new Error('Legacy binary .xls files are not supported safely. Please export attendance as .csv or save the sheet as .xlsx.')
    }
    return text.includes('\t') && !text.includes(',') ? text.replace(/\t/g, ',') : text
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    const ext = selectedFile.name.split('.').pop()?.toLowerCase()
    
    if (!ext || (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_MIME_TYPES.includes(selectedFile.type))) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }

    if (selectedFile.size === 0) {
      setError('The selected file is empty.')
      return
    }

    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      setError('Please upload a file smaller than 10 MB.')
      return
    }
    
    setFile(selectedFile)
    setError(null)
    setResult(null)
    setSubmitted(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanBatchId = normalizeBatchId(batchId)
    if (!file || !cleanBatchId) {
      setError('Please select a file and enter batch ID')
      return
    }

    if ((sourceType === 'google-meet' || sourceType === 'zoom-meet') && (!Number.isFinite(meetDuration) || meetDuration < 1 || meetDuration > 480)) {
      setError('Meet session duration must be between 1 and 480 minutes.')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      let csvText = ''
      const ext = file.name.split('.').pop()?.toLowerCase()
      
      if (ext === 'csv') {
        csvText = await file.text()
      } else if (ext === 'xlsx') {
        csvText = await spreadsheetToCsv(file)
      } else if (ext === 'xls') {
        csvText = await readLegacyExcelLikeText(file)
      } else {
        setError('Unsupported file format')
        setLoading(false)
        return
      }

      if (!csvText.trim()) {
        setError('No readable attendance data found in the selected file.')
        setLoading(false)
        return
      }

      // Validate batch exists
      try {
        await getAttendanceForBatch(cleanBatchId)
        // If query succeeds but returns empty, batch might still be valid (no records yet)
        // If query fails with 400/404, batch ID is invalid
      } catch (batchErr) {
        setError(`Batch ID not found. Please check and try again. Error: ${batchErr instanceof Error ? batchErr.message : 'Unknown error'}`)
        setLoading(false)
        return
      }

      const existingDates = await getExistingAttendanceDates(cleanBatchId)
      const parseResult = parseAttendanceCsv(csvText, existingDates, sourceType, {
        defaultMeetDurationMin: meetDuration,
      })
      
      if (!parseResult.records || parseResult.records.length === 0) {
        setError('No valid attendance records found in the CSV file. Please check the file format.')
        setLoading(false)
        return
      }
      
      // Check if file was already uploaded
      const existingRecordsForDedup = await getAttendanceForBatch(cleanBatchId)
      const existingSet = new Set(
        existingRecordsForDedup.map(r => `${r.student_name}|${r.session_date}|${r.join_time}|${r.source_type || 'zoom'}`)
      )
      
      // Filter out duplicates
      const newRecords = parseResult.records.filter(r => 
        !existingSet.has(`${r.name}|${r.date}|${r.join}|${r.sourceType}`)
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
          source: sourceType,
          detectedFormat: parseResult.detectedFormat,
        })
        setError('All records in this file have already been uploaded.')
        setSubmitted(true)
        return
      }

      // Insert new records
      const attendanceRecords = newRecords.map(r => ({
        batch_id: cleanBatchId,
        student_name: r.name,
        session_date: r.date,
        join_time: r.join,
        leave_time: r.leave,
        duration_min: r.dur,
        session_start: r.sessionStart,
        raw_name: r.rawName,
        source_type: r.sourceType,
      }))

      const inserted = await bulkInsertAttendance(attendanceRecords)

      if (inserted === 0) {
        setError('Records could not be inserted. Please check the batch ID and try again.')
        setLoading(false)
        return
      }

      await Promise.all(parseResult.dates.map(date => upsertSession(cleanBatchId, date)))
      await logCsvUpload({
        batch_id: cleanBatchId,
        filename: file.name,
        source_type: sourceType,
        date_range_start: parseResult.dates[0],
        date_range_end: parseResult.dates[parseResult.dates.length - 1],
        records_added: inserted,
      })

      setResult({
        records: parseResult.records.length,
        newDates: parseResult.newDates.length,
        duplicateRecords: parseResult.duplicateRecords,
        weekendSkipped: parseResult.weekendSkipped,
        hostSkipped: parseResult.hostSkipped,
        deviceSkipped: parseResult.deviceSkipped,
        inserted,
        source: sourceType,
        detectedFormat: parseResult.detectedFormat,
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please check the file format and batch ID.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <h1 className="text-2xl font-semibold mb-2 text-foreground">Upload Attendance File</h1>
        <p className="text-sm text-muted-foreground mb-6">Upload Zoom reports, Google Meet extension CSVs, or batches that use both platforms</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch ID Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Batch ID</label>
            <input
              type="text"
              placeholder="Enter batch ID (or paste from URL)"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">Find batch ID in your batch list or dashboard URL</p>
          </div>

          {/* Attendance Source */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Attendance Source</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'zoom', label: 'Zoom', icon: Video },
                { value: 'google-meet', label: 'Google Meet', icon: Users },
                { value: 'zoom-meet', label: 'Zoom + Meet', icon: Upload },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSourceType(value as UploadSource)}
                  className={`h-11 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    sourceType === value
                      ? 'border-[#1de9b6] bg-[#1de9b6]/10 text-foreground'
                      : 'border-gray-200 bg-gray-50 text-muted-foreground hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Choose Zoom + Meet when a batch may have attendance from either platform; each upload is stored with its source.</p>
          </div>

          {(sourceType === 'google-meet' || sourceType === 'zoom-meet') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Meet Session Duration</label>
              <input
                type="number"
                min={1}
                max={480}
                value={meetDuration}
                onChange={(e) => setMeetDuration(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">Google Meet extension CSVs usually list names only, so this duration is used for those records.</p>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Attendance File</label>
            <div className="flex items-center justify-center px-6 py-12 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
              <label className="text-center cursor-pointer w-full">
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-foreground">Drop file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">CSV or Excel (.csv, .xlsx, .xls)</p>
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
              <p className="text-sm font-medium text-foreground">📄 {file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
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
              className="p-5 bg-gray-50 border border-gray-200 rounded-lg space-y-3"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-[#1de9b6]" />
                <p className="font-semibold text-foreground">Upload Summary</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-white rounded border border-gray-200">
                  <p className="text-muted-foreground text-xs">Total Records</p>
                  <p className="text-foreground font-semibold">{result.records}</p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <p className="text-muted-foreground text-xs">Inserted</p>
                  <p className="text-[#1de9b6] font-semibold">{result.inserted}</p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <p className="text-muted-foreground text-xs">New Dates</p>
                  <p className="text-foreground font-semibold">{result.newDates}</p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <p className="text-muted-foreground text-xs">Duplicates Skipped</p>
                  <p className="text-muted-foreground font-semibold">{result.duplicateRecords}</p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <p className="text-muted-foreground text-xs">Weekend Records</p>
                  <p className="text-muted-foreground font-semibold">{result.weekendSkipped}</p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <p className="text-muted-foreground text-xs">Hosts/Devices</p>
                  <p className="text-muted-foreground font-semibold">{result.hostSkipped + result.deviceSkipped}</p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <p className="text-muted-foreground text-xs">Detected Format</p>
                  <p className="text-foreground font-semibold capitalize">{result.detectedFormat.replace('-', ' ')}</p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <p className="text-muted-foreground text-xs">Selected Source</p>
                  <p className="text-foreground font-semibold capitalize">{result.source.replace('-', ' + ')}</p>
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
                setSourceType('zoom')
                setMeetDuration(120)
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
        <h3 className="text-sm font-semibold text-foreground mb-3">ℹ️ How to upload</h3>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li><span className="text-foreground/80">1.</span> Download Zoom report or Google Meet extension attendance as CSV</li>
          <li><span className="text-foreground/80">2.</span> Find your batch ID in the batches list</li>
          <li><span className="text-foreground/80">3.</span> Pick Zoom, Google Meet, or Zoom + Meet before processing</li>
          <li><span className="text-foreground/80">4.</span> Duplicate records are automatically skipped per platform</li>
          <li><span className="text-foreground/80">5.</span> Weekend dates are excluded (Mon-Fri only)</li>
        </ul>
      </Card>
    </div>
  )
}
