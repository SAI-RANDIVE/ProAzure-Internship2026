import { Card, Button } from '@/components/ui'
import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Upload, Loader2, Video, Users, BookOpen, File as FileIcon, X } from 'lucide-react'
import { type AttendanceSource, parseAttendanceCsv } from '@/lib/csvParser'
import { getExistingAttendanceDates, bulkInsertAttendance, getAttendanceForBatch, logCsvUpload, upsertSession, getBatches, getBatch, type Batch } from '@/lib/db'
import { motion } from 'framer-motion'
import readXlsxFile, { type Row } from 'read-excel-file/browser'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'

type UploadSource = Exclude<AttendanceSource, 'auto'>

const ACCEPTED_EXTENSIONS = ['csv', 'xlsx', 'xls']

interface UploadResult {
  filesProcessed: number
  records: number
  newDates: number
  duplicateRecords: number
  weekendSkipped: number
  hostSkipped: number
  deviceSkipped: number
  inserted: number
  source: string
}

interface OutletContext {
  effectiveInstructorId: string
  isMaster: boolean
}

export default function UploadCSV() {
  const { effectiveInstructorId, isMaster } = useOutletContext<OutletContext>()
  const [searchParams] = useSearchParams()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batchId, setBatchId] = useState('')
  const [batches, setBatches] = useState<Batch[]>([])
  const [sourceType, setSourceType] = useState<UploadSource>('zoom')
  const [meetDuration, setMeetDuration] = useState(120)

  useEffect(() => {
    const loadBatches = async () => {
      if (!effectiveInstructorId) {
        setBatches([])
        setBatchId('')
        setBatchesLoading(false)
        return
      }
      setBatchesLoading(true)
      try {
        const list = await getBatches(effectiveInstructorId)
        setBatches(list)
        const requestedBatchId = searchParams.get('batchId') || ''
        const requested = list.find(batch => batch.id === requestedBatchId)
        setBatchId(requested ? requested.id : list[0]?.id || '')
      } catch (err) {
        setError('Unable to load batches.')
      } finally {
        setBatchesLoading(false)
      }
    }
    loadBatches()
  }, [effectiveInstructorId, searchParams])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (!selectedFiles.length) return

    const validFiles = selectedFiles.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase()
      return ext && ACCEPTED_EXTENSIONS.includes(ext)
    })

    if (validFiles.length !== selectedFiles.length) {
      setError('Some files were ignored. Only .csv, .xlsx, and .xls are allowed.')
    } else {
      setError(null)
    }

    setFiles(prev => [...prev, ...validFiles])
    setResult(null)
    setSubmitted(false)
    e.target.value = '' // reset input
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const spreadsheetToCsv = async (selectedFile: File) => {
    const sheets = await readXlsxFile(selectedFile)
    const rows = sheets.find(sheet => sheet.data.some(row => row.some(cell => String(cell ?? '').trim())))?.data ?? []
    return rows.map((row: Row) => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.length || !batchId) {
      setError('Please select a batch and at least one file.')
      return
    }

    setLoading(true)
    setError(null)
    
    let aggregateResult: UploadResult = {
      filesProcessed: 0, records: 0, newDates: 0, duplicateRecords: 0,
      weekendSkipped: 0, hostSkipped: 0, deviceSkipped: 0, inserted: 0, source: sourceType
    }

    try {
      const selectedBatch = await getBatch(batchId)
      if (!selectedBatch || (effectiveInstructorId && selectedBatch.instructor_id !== effectiveInstructorId)) {
        throw new Error('Batch verification failed. Please select a valid batch.')
      }

      for (const file of files) {
        let csvText = ''
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext === 'csv') csvText = await file.text()
        else if (ext === 'xlsx') csvText = await spreadsheetToCsv(file)
        else if (ext === 'xls') csvText = (await file.text()).replace(/\t/g, ',')
        
        if (!csvText.trim()) continue

        const existingDates = await getExistingAttendanceDates(batchId)
        const parseResult = parseAttendanceCsv(csvText, existingDates, sourceType, { defaultMeetDurationMin: meetDuration })
        
        if (!parseResult.records.length) continue

        const existingRecords = await getAttendanceForBatch(batchId)
        const existingSet = new Set(existingRecords.map(r => `${r.student_name}|${r.session_date}|${r.join_time}|${r.source_type}`))
        
        const newRecords = parseResult.records.filter(r => !existingSet.has(`${r.name}|${r.date}|${r.join}|${r.sourceType}`))

        aggregateResult.records += parseResult.records.length
        aggregateResult.duplicateRecords += parseResult.duplicateRecords + (parseResult.records.length - newRecords.length)
        aggregateResult.weekendSkipped += parseResult.weekendSkipped
        aggregateResult.hostSkipped += parseResult.hostSkipped
        aggregateResult.deviceSkipped += parseResult.deviceSkipped
        aggregateResult.filesProcessed++

        if (newRecords.length > 0) {
          const attendanceRecords = newRecords.map(r => ({
            batch_id: batchId, student_name: r.name, session_date: r.date, join_time: r.join,
            leave_time: r.leave, duration_min: r.dur, session_start: r.sessionStart, raw_name: r.rawName, source_type: r.sourceType
          }))

          const inserted = await bulkInsertAttendance(attendanceRecords)
          aggregateResult.inserted += inserted
          
          await Promise.all(parseResult.newDates.map(date => upsertSession(batchId, date)))
          aggregateResult.newDates += parseResult.newDates.length

          await logCsvUpload({
            batch_id: batchId, filename: file.name, source_type: sourceType,
            date_range_start: parseResult.dates[0] || new Date().toISOString().slice(0,10),
            date_range_end: parseResult.dates[parseResult.dates.length - 1] || new Date().toISOString().slice(0,10),
            records_added: inserted
          })
        }
      }

      setResult(aggregateResult)
      setSubmitted(true)
      setFiles([]) // Clear files on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <h1 className="text-2xl font-semibold mb-2 text-foreground">Upload Attendance Files</h1>
        <p className="text-sm text-muted-foreground mb-6">Upload multiple Zoom or Google Meet CSV reports at once.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Batch</label>
            {batchesLoading ? <div className="h-11 rounded-lg bg-muted animate-pulse" /> : (
              <select
                value={batchId} onChange={(e) => setBatchId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {batches.map(batch => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
              </select>
            )}
          </div>

          {/* Attendance Source */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Source Configuration</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[{ value: 'zoom', label: 'Zoom', icon: Video }, { value: 'google-meet', label: 'Meet', icon: Users }, { value: 'zoom-meet', label: 'Mixed', icon: Upload }].map(({ value, label, icon: Icon }) => (
                <button
                  key={value} type="button" onClick={() => setSourceType(value as UploadSource)}
                  className={`h-11 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${sourceType === value ? 'border-primary bg-primary/10 text-foreground' : 'border-gray-200 bg-gray-50 text-muted-foreground hover:bg-gray-100'}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Attendance Files</label>
            <div className="flex items-center justify-center px-6 py-10 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
              <label className="text-center cursor-pointer w-full">
                <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">Select multiple files</p>
                <input type="file" multiple accept=".csv,.xlsx,.xls" onChange={handleFileChange} disabled={loading} className="hidden" />
              </label>
            </div>
            
            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">{error}</div>}

          {result && submitted && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-primary" /><p className="font-semibold">Batch Processing Complete</p></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="p-3 bg-white border rounded"><p className="text-xs text-muted-foreground">Files</p><p className="font-semibold">{result.filesProcessed}</p></div>
                <div className="p-3 bg-white border rounded"><p className="text-xs text-muted-foreground">Total Rows</p><p className="font-semibold">{result.records}</p></div>
                <div className="p-3 bg-white border rounded border-primary/30"><p className="text-xs text-primary">Inserted</p><p className="font-semibold text-primary">{result.inserted}</p></div>
                <div className="p-3 bg-white border rounded"><p className="text-xs text-muted-foreground">Duplicates Skipped</p><p className="font-semibold text-muted-foreground">{result.duplicateRecords}</p></div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" loading={loading} disabled={!files.length || !batchId || loading} className="bg-[#1de9b6] text-black">
              Process {files.length} File{files.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}