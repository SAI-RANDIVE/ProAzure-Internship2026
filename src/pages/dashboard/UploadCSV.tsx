import { Card } from '@/components/ui'
import { useState } from 'react'
import { Upload } from 'lucide-react'
import { parseZoomCsv } from '@/lib/csvParser'

export default function UploadCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ records: number; newDates: string[] } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setLoading(true)
    try {
      const text = await selectedFile.text()
      const parseResult = parseZoomCsv(text, new Set())
      setResult({
        records: parseResult.records.length,
        newDates: parseResult.newDates,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Upload Zoom CSV</h1>
        
        <div className="flex items-center justify-center px-6 py-16 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
          <label className="text-center cursor-pointer w-full">
            <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Drop your CSV file here</p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <div className="mt-6 p-4 bg-muted rounded-xl">
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            {result && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Records: {result.records}</p>
                <p>New dates: {result.newDates.length}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
