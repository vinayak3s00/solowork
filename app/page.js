'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast, Toaster } from 'sonner'
import { Users, TrendingUp, DollarSign, Bell, Plus, Search, Settings, Edit, Trash2, Calendar, Mail, MessageSquare, Save, Key } from 'lucide-react'

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [reminders, setReminders] = useState([])
  const [payments, setPayments] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)
  const [loading, setLoading] = useState(false)

  // Lead form state
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    budget: '',
    serviceType: ''
  })

  // Reminder form state
  const [reminderForm, setReminderForm] = useState({
    leadId: '',
    title: '',
    description: '',
    dueDate: '',
    type: 'follow-up'
  })

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    leadId: '',
    amount: '',
    mode: 'Cash',
    status: 'Completed',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // API Key form state
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    apiKey: '',
    provider: 'openai',
    baseUrl: ''
  })

  // Load data
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'leads') {
      fetchLeads()
      fetchAnalytics()
    }
    if (activeTab === 'reminders') {
      fetchReminders()
    }
    if (activeTab === 'settings') {
      fetchApiKeys()
    }
  }, [activeTab])

  // Filter leads
  useEffect(() => {
    let filtered = leads
    
    if (searchQuery) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }
    
    setFilteredLeads(filtered)
  }, [leads, searchQuery, statusFilter])

  // Fetch functions
  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      const data = await response.json()
      setLeads(data)
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to fetch leads')
    }
  }

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders')
      const data = await response.json()
      setReminders(data)
    } catch (error) {
      console.error('Error fetching reminders:', error)
    }
  }

  const fetchPayments = async (leadId) => {
    try {
      const response = await fetch(`/api/payments?leadId=${leadId}`)
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys')
      const data = await response.json()
      setApiKeys(data)
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  // Create lead
  const handleCreateLead = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm)
      })
      if (response.ok) {
        toast.success('Lead created successfully!')
        setLeadForm({ name: '', email: '', phone: '', message: '', budget: '', serviceType: '' })
        fetchLeads()
        fetchAnalytics()
      } else {
        toast.error('Failed to create lead')
      }
    } catch (error) {
      console.error('Error creating lead:', error)
      toast.error('Error creating lead')
    } finally {
      setLoading(false)
    }
  }

  // Update lead status
  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        toast.success('Status updated!')
        fetchLeads()
        fetchAnalytics()
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  // Add note to lead
  const handleAddNote = async (leadId, note) => {
    if (!note.trim()) return
    try {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      })
      if (response.ok) {
        toast.success('Note added!')
        fetchLeads()
        // Update selected lead
        const updatedLead = await fetch(`/api/leads/${leadId}`).then(r => r.json())
        setSelectedLead(updatedLead)
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Failed to add note')
    }
  }

  // Delete lead
  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Lead deleted!')
        fetchLeads()
        fetchAnalytics()
        setSelectedLead(null)
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Failed to delete lead')
    }
  }

  // Create reminder
  const handleCreateReminder = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderForm)
      })
      if (response.ok) {
        toast.success('Reminder created!')
        setReminderForm({ leadId: '', title: '', description: '', dueDate: '', type: 'follow-up' })
        fetchReminders()
      } else {
        toast.error('Failed to create reminder')
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
      toast.error('Error creating reminder')
    } finally {
      setLoading(false)
    }
  }

  // Mark reminder complete
  const handleCompleteReminder = async (reminderId) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      })
      if (response.ok) {
        toast.success('Reminder completed!')
        fetchReminders()
      }
    } catch (error) {
      console.error('Error completing reminder:', error)
      toast.error('Failed to complete reminder')
    }
  }

  // Send reminder
  const handleSendReminder = async (reminderId, channel) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      })
      if (response.ok) {
        const result = await response.json()
        toast.success('Reminder sent!')
        console.log('Send result:', result)
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast.error('Failed to send reminder')
    }
  }

  // Create payment
  const handleCreatePayment = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      })
      if (response.ok) {
        toast.success('Payment recorded!')
        setPaymentForm({ leadId: '', amount: '', mode: 'Cash', status: 'Completed', date: new Date().toISOString().split('T')[0], notes: '' })
        fetchPayments(paymentForm.leadId)
        fetchAnalytics()
      } else {
        toast.error('Failed to record payment')
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      toast.error('Error recording payment')
    } finally {
      setLoading(false)
    }
  }

  // Add API key
  const handleAddApiKey = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKeyForm)
      })
      if (response.ok) {
        toast.success('API key added!')
        setApiKeyForm({ name: '', apiKey: '', provider: 'openai', baseUrl: '' })
        fetchApiKeys()
      } else {
        toast.error('Failed to add API key')
      }
    } catch (error) {
      console.error('Error adding API key:', error)
      toast.error('Error adding API key')
    } finally {
      setLoading(false)
    }
  }

  // Delete API key
  const handleDeleteApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key?')) return
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('API key deleted!')
        fetchApiKeys()
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-500'
      case 'In Progress': return 'bg-yellow-500'
      case 'Done': return 'bg-green-500'
      case 'Paid': return 'bg-emerald-600'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">SoloCRM</h1>
                <p className="text-sm text-slate-500">Micro CRM for Solopreneurs</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('settings')}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="w-4 h-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="capture" className="gap-2">
              <Plus className="w-4 h-4" />
              Capture Lead
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2">
              <Bell className="w-4 h-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Key className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Leads This Week</CardDescription>
                  <CardTitle className="text-3xl">{analytics?.leadsThisWeek || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Total: {analytics?.totalLeads || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Conversion Rate</CardDescription>
                  <CardTitle className="text-3xl">{analytics?.conversionRate || 0}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    Done/Paid vs Total
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Revenue</CardDescription>
                  <CardTitle className="text-3xl">${analytics?.totalRevenue?.toFixed(2) || '0.00'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    Completed payments
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending Reminders</CardDescription>
                  <CardTitle className="text-3xl">{analytics?.pendingReminders || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bell className="w-4 h-4" />
                    Needs attention
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Your latest client inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(filteredLeads) && filteredLeads.slice(0, 5).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => { setSelectedLead(lead); setActiveTab('leads'); }}>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                        <p className="text-sm text-slate-500">{lead.email}</p>
                      </div>
                      <Badge className={`${getStatusColor(lead.status)} text-white`}>
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leads List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>All Leads</CardTitle>
                    <CardDescription>Manage your client pipeline</CardDescription>
                    <div className="flex gap-4 mt-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search leads..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-3">
                        {Array.isArray(filteredLeads) && filteredLeads.map(lead => (
                          <div
                            key={lead.id}
                            className={`p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border-2 ${selectedLead?.id === lead.id ? 'border-blue-500' : 'border-transparent'}`}
                            onClick={() => {
                              setSelectedLead(lead)
                              fetchPayments(lead.id)
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                                <p className="text-sm text-slate-500">{lead.email}</p>
                                {lead.phone && <p className="text-sm text-slate-500">{lead.phone}</p>}
                              </div>
                              <Badge className={`${getStatusColor(lead.status)} text-white`}>
                                {lead.status}
                              </Badge>
                            </div>
                            {lead.serviceType && (
                              <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Service:</span> {lead.serviceType}</p>
                            )}
                            {lead.budget && (
                              <p className="text-sm text-slate-600"><span className="font-medium">Budget:</span> {lead.budget}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-2">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                        {(!filteredLeads || filteredLeads.length === 0) && (
                          <p className="text-center text-slate-500 py-8">No leads found</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Lead Details */}
              <div>
                {selectedLead ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedLead.name}</CardTitle>
                          <CardDescription>{selectedLead.email}</CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteLead(selectedLead.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={selectedLead.status}
                            onValueChange={(value) => handleUpdateLeadStatus(selectedLead.id, value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Done">Done</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedLead.message && (
                          <div>
                            <Label>Message</Label>
                            <p className="text-sm text-slate-600 mt-1 p-3 bg-slate-50 rounded">{selectedLead.message}</p>
                          </div>
                        )}

                        <Separator />

                        <div>
                          <Label className="mb-2 block">Notes</Label>
                          <ScrollArea className="h-[200px] mb-2">
                            <div className="space-y-2">
                              {selectedLead.notes?.map(note => (
                                <div key={note.id} className="p-2 bg-yellow-50 rounded text-sm border border-yellow-200">
                                  <p className="text-slate-700">{note.note}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {new Date(note.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <form onSubmit={(e) => {
                            e.preventDefault()
                            const noteInput = e.target.note
                            handleAddNote(selectedLead.id, noteInput.value)
                            noteInput.value = ''
                          }}>
                            <div className="flex gap-2">
                              <Input name="note" placeholder="Add a note..." />
                              <Button type="submit" size="sm">
                                <Save className="w-4 h-4" />
                              </Button>
                            </div>
                          </form>
                        </div>

                        <Separator />

                        <div>
                          <Label className="mb-2 block">Quick Actions</Label>
                          <div className="space-y-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full gap-2" onClick={() => setReminderForm({ ...reminderForm, leadId: selectedLead.id })}>
                                  <Bell className="w-4 h-4" />
                                  Create Reminder
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Create Reminder</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateReminder} className="space-y-4 mt-4">
                                  <div>
                                    <Label>Title *</Label>
                                    <Input
                                      value={reminderForm.title}
                                      onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                                      placeholder="Follow up with client"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <Textarea
                                      value={reminderForm.description}
                                      onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                                      placeholder="Additional details..."
                                    />
                                  </div>
                                  <div>
                                    <Label>Due Date *</Label>
                                    <Input
                                      type="datetime-local"
                                      value={reminderForm.dueDate}
                                      onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label>Type</Label>
                                    <Select value={reminderForm.type} onValueChange={(value) => setReminderForm({ ...reminderForm, type: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="follow-up">Follow-up</SelectItem>
                                        <SelectItem value="payment-due">Payment Due</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button type="submit" className="w-full" disabled={loading}>
                                    Create Reminder
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full gap-2" onClick={() => setPaymentForm({ ...paymentForm, leadId: selectedLead.id })}>
                                  <DollarSign className="w-4 h-4" />
                                  Record Payment
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Record Payment</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreatePayment} className="space-y-4 mt-4">
                                  <div>
                                    <Label>Amount *</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={paymentForm.amount}
                                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                      placeholder="1000.00"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label>Payment Mode</Label>
                                    <Select value={paymentForm.mode} onValueChange={(value) => setPaymentForm({ ...paymentForm, mode: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Card">Card</SelectItem>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <Select value={paymentForm.status} onValueChange={(value) => setPaymentForm({ ...paymentForm, status: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Failed">Failed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Date</Label>
                                    <Input
                                      type="date"
                                      value={paymentForm.date}
                                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                      value={paymentForm.notes}
                                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                      placeholder="Payment details..."
                                    />
                                  </div>
                                  <Button type="submit" className="w-full" disabled={loading}>
                                    Record Payment
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        {payments.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <Label className="mb-2 block">Payment History</Label>
                              <div className="space-y-2">
                                {Array.isArray(payments) && payments.map(payment => (
                                  <div key={payment.id} className="p-2 bg-green-50 rounded text-sm border border-green-200">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-semibold text-slate-700">${payment.amount.toFixed(2)}</p>
                                        <p className="text-xs text-slate-500">{payment.mode} - {payment.status}</p>
                                      </div>
                                      <p className="text-xs text-slate-400">
                                        {new Date(payment.date).toLocaleDateString()}
                                      </p>
                                    </div>
                                    {payment.notes && <p className="text-xs text-slate-600 mt-1">{payment.notes}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-[400px] text-slate-500">
                      <p>Select a lead to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Capture Lead Tab */}
          <TabsContent value="capture">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Capture New Lead</CardTitle>
                  <CardDescription>Add a new client or inquiry to your CRM</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateLead} className="space-y-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div>
                      <Label>Service Type</Label>
                      <Input
                        value={leadForm.serviceType}
                        onChange={(e) => setLeadForm({ ...leadForm, serviceType: e.target.value })}
                        placeholder="Web Design, Consulting, etc."
                      />
                    </div>
                    <div>
                      <Label>Budget</Label>
                      <Input
                        value={leadForm.budget}
                        onChange={(e) => setLeadForm({ ...leadForm, budget: e.target.value })}
                        placeholder="$5000-$10000"
                      />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <Textarea
                        value={leadForm.message}
                        onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                        placeholder="Tell us about your project..."
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Lead
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Shareable Lead Form</CardTitle>
                  <CardDescription>Share this link with potential clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <code className="text-sm text-slate-700">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/
                    </code>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Clients can visit this page and use the "Capture Lead" tab to submit their information.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Reminders & Tasks</CardTitle>
                  <CardDescription>Manage follow-ups and deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(reminders) && reminders.map(reminder => {
                      const lead = leads.find(l => l.id === reminder.leadId)
                      const isOverdue = new Date(reminder.dueDate) < new Date() && !reminder.completed
                      return (
                        <div
                          key={reminder.id}
                          className={`p-4 rounded-lg border-2 ${reminder.completed ? 'bg-slate-50 border-slate-200' : isOverdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{reminder.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {reminder.type}
                                </Badge>
                                {reminder.completed && (
                                  <Badge className="bg-green-600 text-white text-xs">
                                    Completed
                                  </Badge>
                                )}
                                {isOverdue && (
                                  <Badge className="bg-red-600 text-white text-xs">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              {lead && (
                                <p className="text-sm text-slate-600">For: {lead.name}</p>
                              )}
                              {reminder.description && (
                                <p className="text-sm text-slate-600 mt-1">{reminder.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <p className="text-sm text-slate-500">
                                  {new Date(reminder.dueDate).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!reminder.completed && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendReminder(reminder.id, 'email')}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendReminder(reminder.id, 'whatsapp')}
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleCompleteReminder(reminder.id)}
                                  >
                                    Complete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {reminders.length === 0 && (
                      <p className="text-center text-slate-500 py-8">No reminders yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="max-w-3xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys Management</CardTitle>
                  <CardDescription>Manage OpenAI-compatible API keys for AI features</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddApiKey} className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Key Name *</Label>
                        <Input
                          value={apiKeyForm.name}
                          onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                          placeholder="Production Key"
                          required
                        />
                      </div>
                      <div>
                        <Label>Provider *</Label>
                        <Select value={apiKeyForm.provider} onValueChange={(value) => setApiKeyForm({ ...apiKeyForm, provider: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="gemini">Google Gemini</SelectItem>
                            <SelectItem value="other">Other (OpenAI-compatible)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>API Key *</Label>
                      <Input
                        type="password"
                        value={apiKeyForm.apiKey}
                        onChange={(e) => setApiKeyForm({ ...apiKeyForm, apiKey: e.target.value })}
                        placeholder="sk-..."
                        required
                      />
                    </div>
                    <div>
                      <Label>Base URL (Optional)</Label>
                      <Input
                        value={apiKeyForm.baseUrl}
                        onChange={(e) => setApiKeyForm({ ...apiKeyForm, baseUrl: e.target.value })}
                        placeholder="https://api.openai.com/v1"
                      />
                      <p className="text-xs text-slate-500 mt-1">Only needed for custom/other providers</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add API Key
                    </Button>
                  </form>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="font-semibold mb-4">Saved API Keys</h3>
                    <div className="space-y-2">
                      {Array.isArray(apiKeys) && apiKeys.map(key => (
                        <div key={key.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-900">{key.name}</p>
                            <p className="text-sm text-slate-500">{key.provider} - {key.apiKey}</p>
                            {key.baseUrl && <p className="text-xs text-slate-400">{key.baseUrl}</p>}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteApiKey(key.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {apiKeys.length === 0 && (
                        <p className="text-center text-slate-500 py-4">No API keys added yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Communication Settings</CardTitle>
                  <CardDescription>Configure email and WhatsApp integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Email (SMTP)</h4>
                      <p className="text-sm text-blue-700 mb-2">
                        Configure these environment variables in your .env file:
                      </p>
                      <code className="text-xs bg-blue-100 p-2 rounded block">
                        SMTP_HOST=smtp.gmail.com<br />
                        SMTP_PORT=587<br />
                        SMTP_USER=your@email.com<br />
                        SMTP_PASS=your_password
                      </code>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">WhatsApp (Meta Cloud API)</h4>
                      <p className="text-sm text-green-700 mb-2">
                        Configure these environment variables in your .env file:
                      </p>
                      <code className="text-xs bg-green-100 p-2 rounded block">
                        WHATSAPP_API_KEY=your_api_key<br />
                        WHATSAPP_PHONE_ID=your_phone_id
                      </code>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> These integrations are optional. The app will work without them,
                        but reminder notifications won't be sent.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App