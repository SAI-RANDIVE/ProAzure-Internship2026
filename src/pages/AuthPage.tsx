import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Loader2, Lock } from 'lucide-react'
import { neonClient } from '@/lib/auth'
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid credentials')
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed')
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
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1de9b6]/10 to-transparent pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1de9b6] to-[#2979ff] flex items-center justify-center shadow-[0_0_30px_rgba(29,233,182,0.3)]">
            <Lock className="w-6 h-6 text-black" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">
          {mode === 'signin' ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="mt-2 text-center text-sm text-white/50">
          {mode === 'signin' ? 'Enter your credentials to access your dashboard' : 'Join ProAzure to manage your batches'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px] relative z-10">
        <div className="bg-[#161b22] border border-white/10 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
            
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Full Name</label>
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-2.5 text-white placeholder-white/20 focus:border-[#1de9b6] focus:ring-1 focus:ring-[#1de9b6] transition-colors"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Email address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-2.5 text-white placeholder-white/20 focus:border-[#1de9b6] focus:ring-1 focus:ring-[#1de9b6] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-2.5 pr-10 text-white placeholder-white/20 focus:border-[#1de9b6] focus:ring-1 focus:ring-[#1de9b6] transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white/70"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
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

          <p className="text-xs text-center text-white/40 mt-6">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="text-[#1de9b6] hover:underline font-medium"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}