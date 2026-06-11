import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Loader2, Lock } from 'lucide-react'
import { neonClient, MASTER_ACCOUNT } from '@/lib/auth'
import { Button } from '@/components/ui'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await neonClient.auth.signIn({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await neonClient.auth.signUp({ email, password, name })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.')
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
            Track batches, validate Zoom CSV uploads, and review student attendance from one focused dashboard.
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm text-[#1de9b6] font-medium mb-2">ProAzure Software Solutions</p>
            <h2 className="text-3xl font-semibold tracking-tight">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>
            <p className="text-sm text-white/45 mt-2">
              {mode === 'signin' 
                ? 'Login as instructor or CEO'
                : 'Register as a new instructor'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg border border-white/10">
            <button
              onClick={() => {
                setMode('signin')
                setError(null)
                setEmail('')
                setPassword('')
                setName('')
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                mode === 'signin'
                  ? 'bg-[#1de9b6] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup')
                setError(null)
                setEmail('')
                setPassword('')
                setName('')
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                mode === 'signup'
                  ? 'bg-[#1de9b6] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                placeholder={mode === 'signin' ? 'you@proazure.com' : 'instructor@proazure.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'signin' ? 'Enter password' : 'At least 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1de9b6] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1de9b6] text-black hover:bg-[#1de9b6]/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'signin' ? 'Sign in' : 'Create account'
              )}
            </Button>
          </form>

          {mode === 'signin' && (
            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 mb-2 font-medium">CEO Access</p>
              <p className="text-xs text-white/50">
                CEO account: <span className="text-white/70 font-mono">{MASTER_ACCOUNT.email}</span>
              </p>
            </div>
          )}

          <p className="text-xs text-white/40 text-center mt-8">
            {mode === 'signin'
              ? "Don't have an account? Create one with Sign Up above."
              : 'Already have an account? Use Sign In above.'}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
