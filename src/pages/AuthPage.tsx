import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Loader2, Lock, Mail } from 'lucide-react'
import { neonClient, MASTER_ACCOUNT, type AuthUser } from '@/lib/auth'
import { initSchema, upsertInstructor } from '@/lib/db'
import { Button, Input } from '@/components/ui'

export default function AuthPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState(MASTER_ACCOUNT.email)
  const [password, setPassword] = useState(MASTER_ACCOUNT.password)
  const [name, setName] = useState('ProAzure Instructor')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const session = await neonClient.auth.getSession()
      if (session?.user) {
        navigate('/dashboard', { replace: true })
        return
      }
      setChecking(false)
    }
    checkSession()
  }, [navigate])

  async function ensureProfile(user: AuthUser) {
    await initSchema()
    await upsertInstructor({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.image,
    })
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const session = await neonClient.auth.signIn({ email, password, name })
      await ensureProfile(session.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1de9b6] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex">
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-end px-12 pb-20 overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#1de9b6]" />
            </div>
            <span className="text-2xl font-semibold">
              <span className="text-[#1de9b6]">Pro</span><span className="text-[#2979ff]">Azure</span>
            </span>
          </div>
          <h1 className="text-5xl font-semibold tracking-tight mb-4">Internship attendance command center</h1>
          <p className="text-white/65 leading-relaxed">
            Track instructor batches, validate Zoom CSV uploads, and review student attendance from one focused dashboard.
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm text-[#1de9b6] font-medium mb-2">ProAzure Software Solutions</p>
            <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-white/45 mt-2">CEO master access and instructor access use the same portal.</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              hint="Use the CEO credentials for master view, or any ProAzure instructor email for instructor view."
              className="bg-white/5 border-white/10 text-white"
            />
            {email.trim().toLowerCase() !== MASTER_ACCOUNT.email && (
              <Input
                label="Instructor Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            )}
            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
            <Button loading={loading} className="w-full h-12">Enter Dashboard</Button>
          </form>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/55">
            Master: {MASTER_ACCOUNT.email}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
