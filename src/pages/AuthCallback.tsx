import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { neonClient } from '@/lib/auth'
import { upsertInstructor } from '@/lib/db'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handle = async () => {
      try {
        // Wait a moment for the session to be set by the OAuth callback
        await new Promise(r => setTimeout(r, 1000))
        
        const session = await neonClient.auth.getSession?.()
        if (session?.user) {
          await upsertInstructor({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.name || session.user.email?.split('@')[0] || 'Instructor',
            role: 'instructor',
            avatar_url: session.user.image ?? undefined,
          })
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/auth', { replace: true })
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Authentication failed'
        setError(msg)
        setTimeout(() => navigate('/auth'), 3000)
      }
    }
    handle()
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <p className="text-white/30 text-xs">Redirecting back to sign in…</p>
        </div>
      ) : (
        <>
          <Loader2 className="w-8 h-8 text-[#1de9b6] animate-spin" />
          <p className="text-white/40 text-sm">Signing you in…</p>
        </>
      )}
    </div>
  )
}
