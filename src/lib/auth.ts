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
    
    signIn: async (credentials: { email: string; password: string }) => {
      const email = credentials.email.trim().toLowerCase()
      const password = credentials.password
      
      // Only CEO has hardcoded password
      if (email === MASTER_ACCOUNT.email) {
        if (password === MASTER_ACCOUNT.password) {
          return writeSession({
            id: MASTER_ACCOUNT.id,
            email: MASTER_ACCOUNT.email,
            name: MASTER_ACCOUNT.name,
            role: MASTER_ACCOUNT.role,
          })
        } else {
          throw new Error('Invalid credentials.')
        }
      }
      
      // For instructors, check if account exists in database
      const { getInstructor } = await import('@/lib/db')
      const instructorId = `instructor-${email.replace(/[^a-z0-9]/g, '-')}`
      const instructor = await getInstructor(instructorId)
      
      if (!instructor) {
        throw new Error('Instructor account not found. Please sign up first.')
      }
      
      // Verify password (in production, use bcrypt)
      const storedPassword = localStorage.getItem(`instructor-pwd-${instructorId}`)
      if (storedPassword !== password) {
        throw new Error('Invalid credentials.')
      }
      
      return writeSession({
        id: instructor.id,
        email: instructor.email,
        name: instructor.name,
        role: instructor.role,
        image: instructor.avatar_url,
      })
    },
    
    signUp: async (credentials: { email: string; password: string; name: string }) => {
      const email = credentials.email.trim().toLowerCase()
      const password = credentials.password.trim()
      const name = credentials.name.trim()
      
      if (!email || !password || !name) {
        throw new Error('All fields are required.')
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }
      
      if (email === MASTER_ACCOUNT.email) {
        throw new Error('This email is reserved. Please use a different email.')
      }
      
      // Check if instructor already exists
      const instructorId = `instructor-${email.replace(/[^a-z0-9]/g, '-')}`
      const { getInstructor, upsertInstructor, initSchema } = await import('@/lib/db')
      const existing = await getInstructor(instructorId)
      
      if (existing) {
        throw new Error('This instructor account already exists.')
      }
      
      // Create new instructor
      await initSchema()
      await upsertInstructor({
        id: instructorId,
        email,
        name,
        role: 'instructor',
        avatar_url: undefined,
      })
      
      // Store password (in production, use bcrypt with salt)
      localStorage.setItem(`instructor-pwd-${instructorId}`, password)
      
      return writeSession({
        id: instructorId,
        email,
        name,
        role: 'instructor',
      })
    },
    
    signOut: async () => {
      localStorage.removeItem(SESSION_KEY)
    },
  },
}
