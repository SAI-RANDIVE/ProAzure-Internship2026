export type UserRole = 'master' | 'instructor'

export interface AuthUser {
  id: string
  email: string
  name: string
  image?: string
  role: UserRole
  needsPasswordChange?: boolean
}

interface AuthSession {
  user: AuthUser
}

const SESSION_KEY = 'proazure.session'

export const MASTER_ACCOUNT = {
  id: 'master-bapuraje-arkas',
  email: 'bapurajearkas@proazuresoft.com',
  defaultPassword: 'bapuraje123',
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
      
      // CEO Authentication
      if (email === MASTER_ACCOUNT.email) {
        const storedPwd = localStorage.getItem('master-pwd')
        const currentPwd = storedPwd || MASTER_ACCOUNT.defaultPassword
        
        if (password === currentPwd) {
          return writeSession({
            id: MASTER_ACCOUNT.id,
            email: MASTER_ACCOUNT.email,
            name: MASTER_ACCOUNT.name,
            role: MASTER_ACCOUNT.role,
            needsPasswordChange: !storedPwd // True if they haven't set a custom password
          })
        }
        throw new Error('Invalid email or password.')
      }
      
      // Instructor Authentication
      const instructorId = `instructor-${email.replace(/[^a-z0-9]/g, '-')}`
      const storedInstructorPwd = localStorage.getItem(`instructor-pwd-${instructorId}`)
      
      if (!storedInstructorPwd) {
        throw new Error('Account not found. Please sign up.')
      }
      if (password !== storedInstructorPwd) {
        throw new Error('Invalid email or password.')
      }
      
      const { getInstructor } = await import('@/lib/db')
      const instructor = await getInstructor(instructorId)
      
      if (!instructor) {
        throw new Error('Instructor record not found in database.')
      }
      
      return writeSession({
        id: instructor.id,
        email: instructor.email,
        name: instructor.name,
        role: 'instructor',
      })
    },

    signUp: async (credentials: { email: string; password: string; name: string }) => {
      const email = credentials.email.trim().toLowerCase()
      const password = credentials.password.trim()
      const name = credentials.name.trim()
      
      if (!email || !password || !name) throw new Error('All fields are required.')
      if (password.length < 6) throw new Error('Password must be at least 6 characters.')
      if (email === MASTER_ACCOUNT.email) throw new Error('This email is reserved.')
      
      const instructorId = `instructor-${email.replace(/[^a-z0-9]/g, '-')}`
      const { getInstructor, upsertInstructor, initSchema } = await import('@/lib/db')
      const existing = await getInstructor(instructorId)
      
      if (existing) throw new Error('This instructor account already exists.')
      
      await initSchema()
      await upsertInstructor({
        id: instructorId,
        email,
        name,
        role: 'instructor',
        avatar_url: undefined,
      })
      
      localStorage.setItem(`instructor-pwd-${instructorId}`, password)
      
      return writeSession({
        id: instructorId,
        email,
        name,
        role: 'instructor',
      })
    },

    updateMasterPassword: async (newPassword: string): Promise<AuthUser> => {
      const session = readSession()
      if (session?.user.role !== 'master') throw new Error('Unauthorized')
      
      localStorage.setItem('master-pwd', newPassword)
      const updatedUser = { ...session.user, needsPasswordChange: false }
      writeSession(updatedUser)
      return updatedUser
    },
    
    signOut: async () => {
      localStorage.removeItem(SESSION_KEY)
    },
  },
}