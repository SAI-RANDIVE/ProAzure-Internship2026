export type UserRole = 'master' | 'instructor'

export interface AuthUser {
  id: string
  email: string
  name: string
  image?: string
  role: UserRole
}

interface AuthSession {
  user: AuthUser
}

const SESSION_KEY = 'proazure.session'

export const MASTER_ACCOUNT = {
  id: 'master-bapuraje-arkas',
  email: 'bapurajearkas@proazuresoft.com',
  password: 'bapuraje123',
  name: 'Bapuraje Arkas',
  role: 'master' as const,
}

function readSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

function writeSession(user: AuthUser): AuthSession {
  const session = { user }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export const neonClient = {
  auth: {
    getSession: async (): Promise<AuthSession | null> => readSession(),
    signIn: async (credentials: { email: string; password?: string; name?: string }) => {
      const email = credentials.email.trim().toLowerCase()
      if (email === MASTER_ACCOUNT.email && credentials.password === MASTER_ACCOUNT.password) {
        return writeSession({
          id: MASTER_ACCOUNT.id,
          email: MASTER_ACCOUNT.email,
          name: MASTER_ACCOUNT.name,
          role: MASTER_ACCOUNT.role,
        })
      }

      if (!email.endsWith('@proazuresoft.com') && !email.endsWith('@proazure.com')) {
        throw new Error('Use a ProAzure instructor email address.')
      }

      return writeSession({
        id: `instructor-${email.replace(/[^a-z0-9]/g, '-')}`,
        email,
        name: credentials.name?.trim() || email.split('@')[0].replace(/[._-]+/g, ' '),
        role: 'instructor',
      })
    },
    signOut: async () => {
      localStorage.removeItem(SESSION_KEY)
    },
  },
}
