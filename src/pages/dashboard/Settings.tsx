import { useOutletContext, useNavigate } from 'react-router-dom'
import { User, Mail, Shield, Key, LogOut } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { neonClient, type AuthUser } from '@/lib/auth'

interface OutletContext {
  user: AuthUser | null
  isMaster: boolean
}

export default function Settings() {
  const { user, isMaster } = useOutletContext<OutletContext>()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await neonClient.auth.signOut()
    navigate('/', { replace: true })
  }

  if (!user) return null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Account Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your ProAzure platform profile</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center border-b border-border">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-foreground">{user.name}</h3>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary capitalize">
              <Shield className="w-3.5 h-3.5" />
              {user.role} Account
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6 bg-muted/10">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              Account Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Account ID</label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground truncate">
                  {user.id}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Role Privileges</label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground truncate">
                  {isMaster ? 'Full CEO Access (Cross-Instructor)' : 'Instructor Access (Isolated Data)'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Contact your system administrator to change your email or password.
            </p>
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}