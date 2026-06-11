import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Calendar, Upload, Settings,
  LogOut, Menu, X, BookOpen, Bell, Plus, Shield
} from 'lucide-react'
import { neonClient, type AuthUser } from '@/lib/auth'
import { getInstructors, initSchema, type Instructor } from '@/lib/db'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview' },
  { to: '/dashboard/batches', icon: <BookOpen className="w-4 h-4" />, label: 'Batches' },
  { to: '/dashboard/upload', icon: <Upload className="w-4 h-4" />, label: 'Upload CSV' },
  { to: '/dashboard/students', icon: <Users className="w-4 h-4" />, label: 'Students' },
  { to: '/dashboard/calendar', icon: <Calendar className="w-4 h-4" />, label: 'Calendar' },
  { to: '/dashboard/settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [selectedInstructorId, setSelectedInstructorId] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const isMaster = user?.role === 'master'
  const effectiveInstructorId = isMaster ? selectedInstructorId : user?.id || ''
  const activeInstructor = instructors.find(i => i.id === effectiveInstructorId)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await neonClient.auth.getSession()
        if (!session?.user) { navigate('/auth', { replace: true }); return }
        setUser(session.user)
        await initSchema()
        if (session.user.role === 'master') {
          const list = await getInstructors()
          setInstructors(list)
          setSelectedInstructorId(list[0]?.id || '')
        } else {
          setInstructors([{
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: 'instructor',
            avatar_url: session.user.image,
            created_at: new Date().toISOString(),
          }])
          setSelectedInstructorId(session.user.id)
        }
      } catch {
        navigate('/auth', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [navigate])

  const handleSignOut = async () => {
    await neonClient.auth.signOut()
    navigate('/auth', { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out',
        'bg-sidebar text-sidebar-foreground border-r border-white/5',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <svg width="30" height="24" viewBox="0 0 40 32" fill="none">
              <ellipse cx="20" cy="12" rx="14" ry="9" stroke="#1de9b6" strokeWidth="1.5" fill="none"/>
              <circle cx="20" cy="12" r="4" stroke="#1de9b6" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="6" r="2" fill="#1de9b6"/>
              <circle cx="32" cy="6" r="2" fill="#1de9b6"/>
              <circle cx="8" cy="18" r="2" fill="#2979ff"/>
              <circle cx="32" cy="18" r="2" fill="#2979ff"/>
            </svg>
            <div>
              <p className="text-sm font-semibold leading-none">
                <span style={{ color: '#1de9b6' }}>Pro</span>
                <span style={{ color: '#2979ff' }}>Azure</span>
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">Internship 2026</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick action */}
        <div className="px-3 pt-4">
          <Link to="/dashboard/batches/new"
            className="flex items-center gap-2 w-full h-9 px-3 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, rgba(29,233,182,0.15), rgba(41,121,255,0.15))', border: '1px solid rgba(29,233,182,0.2)' }}>
            <Plus className="w-3.5 h-3.5 text-[#1de9b6]" />
            New Batch
          </Link>
        </div>

        {isMaster && (
          <div className="px-3 pt-3">
            <div className="rounded-xl border border-[#1de9b6]/20 bg-[#1de9b6]/10 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#1de9b6] mb-2">
                <Shield className="w-3.5 h-3.5" />
                CEO view
              </div>
              <select
                value={selectedInstructorId}
                onChange={e => setSelectedInstructorId(e.target.value)}
                className="w-full h-9 rounded-lg bg-[#0d1117] border border-white/10 text-xs text-white px-2"
              >
                {instructors.length === 0 && <option value="">No instructors yet</option>}
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 w-full h-9 px-3 rounded-xl text-sm font-medium transition-all',
                location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
                  ? 'bg-sidebar-accent/20 text-white border border-sidebar-accent/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              )}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1de9b6] to-[#2979ff] flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || 'I'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{user?.name}</p>
              <p className="text-xs text-white/30 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-white/30 hover:text-white/70 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">ProAzure Software Solutions · Internship 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMaster && activeInstructor && (
              <div className="hidden md:block text-right mr-2">
                <p className="text-xs font-medium text-foreground">{activeInstructor.name}</p>
                <p className="text-[11px] text-muted-foreground">selected instructor</p>
              </div>
            )}
            <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <Link to="/dashboard/upload">
              <button className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1de9b6, #2979ff)' }}>
                <Upload className="w-3 h-3" />
                Upload CSV
              </button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet context={{ user, effectiveInstructorId, isMaster, instructors, selectedInstructorId, setSelectedInstructorId }} />
        </main>
      </div>
    </div>
  )
}
