import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from '@/pages/Landing'
import AuthPage from '@/pages/AuthPage'
import AuthCallback from '@/pages/AuthCallback'
import DashboardLayout from '@/pages/DashboardLayout'
import Overview from '@/pages/dashboard/Overview'
import BatchesPage from '@/pages/dashboard/Batches'
import BatchDetailPage from '@/pages/dashboard/BatchDetail'
import CreateBatchPage from '@/pages/dashboard/CreateBatch'
import UploadCSVPage from '@/pages/dashboard/UploadCSV'
import StudentsPage from '@/pages/dashboard/Students'
import CalendarPage from '@/pages/dashboard/Calendar'
import SettingsPage from '@/pages/dashboard/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="batches/new" element={<CreateBatchPage />} />
          <Route path="batches/:batchId" element={<BatchDetailPage />} />
          <Route path="upload" element={<UploadCSVPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
