'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast, Toaster } from 'sonner'
import { Users, CheckCircle2, Loader2 } from 'lucide-react'

export default function CapturePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    budget: '',
    serviceType: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to submit. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-10">
      <Toaster position="top-right" richColors />
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Get in Touch</h1>
        </div>

        <Card>
          {submitted ? (
            <CardContent className="py-16 text-center">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Thank you!</h2>
              <p className="text-slate-500">
                Your information has been received. We&apos;ll be in touch shortly.
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Tell us about your project</CardTitle>
                <CardDescription>Fill out the form and we&apos;ll get back to you.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <Label>Service Type</Label>
                    <Input
                      value={form.serviceType}
                      onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                      placeholder="Web Design, Consulting, etc."
                    />
                  </div>
                  <div>
                    <Label>Budget</Label>
                    <Input
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      placeholder="$5000-$10000"
                    />
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your project..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
