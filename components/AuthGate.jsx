'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Users, Loader2 } from 'lucide-react'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthGate({ children }) {
  const [status, setStatus] = useState('loading') // loading | authed | unauthed
  const [user, setUser] = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await res.json()
      if (data.authenticated) {
        setUser(data.user)
        setStatus('authed')
      } else {
        setNeedsSetup(!!data.needsSetup)
        setStatus('unauthed')
      }
    } catch {
      setStatus('unauthed')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      setStatus('unauthed')
      refresh()
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (status === 'unauthed') {
    return <AuthScreen needsSetup={needsSetup} onSuccess={refresh} />
  }

  return (
    <AuthContext.Provider value={{ user, logout, refresh }}>{children}</AuthContext.Provider>
  )
}

function AuthScreen({ needsSetup, onSuccess }) {
  const [mode, setMode] = useState(needsSetup ? 'register' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMode(needsSetup ? 'register' : 'login')
  }, [needsSetup])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const payload =
        mode === 'register'
          ? { name: form.name, email: form.email, password: form.password }
          : { email: form.email, password: form.password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success(mode === 'register' ? 'Account created!' : 'Welcome back!')
        onSuccess()
      } else {
        toast.error(data.error || 'Something went wrong')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-2">
            <Users className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl">SoloCRM</CardTitle>
          <CardDescription>
            {mode === 'register'
              ? needsSetup
                ? 'Create your owner account to get started'
                : 'Create an account'
              : 'Sign in to your dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  required
                />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                required
                minLength={mode === 'register' ? 8 : undefined}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'register' ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {!needsSetup && (
            <p className="text-center text-sm text-slate-500 mt-4">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                className="text-blue-600 font-medium hover:underline"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
