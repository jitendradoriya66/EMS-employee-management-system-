import React from 'react'
import { motion } from 'framer-motion'
import { Megaphone, BellRing, CalendarDays, Pin, CheckCircle2, Users2 } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'

import { useAnnouncements } from '@/hooks/useAnnouncements'
import { Alert } from '@/components/common/Alert'
import { Input } from '@/components/common/Input'
import apiClient from '@/utils/apiClient'
import { useAuth } from '@/contexts/AuthContext'

export const AnnouncementsPage: React.FC = () => {
  const { announcements, loading, fetchAnnouncements, broadcastAnnouncement } = useAnnouncements()
  const { user } = useAuth()
  const isAdmin = user?.role !== 'employee'
  
  const [toast, setToast] = React.useState<{ message: string, variant: 'success' | 'warning' } | null>(null)
  const [isBroadcasting, setIsBroadcasting] = React.useState(false)
  const [newAnnouncement, setNewAnnouncement] = React.useState({ title: '', message: '' })
  const [broadcastingLoading, setBroadcastingLoading] = React.useState(false)

  const showToast = (message: string, variant: 'success' | 'warning' = 'success') => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 3000)
  }

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.post('/api/v1/notifications/mark-read/')
      await fetchAnnouncements()
      showToast('All announcements marked as read.')
    } catch {
      showToast('Failed to mark as read', 'warning')
    }
  }

  if (loading) {
    return <div className="p-xl text-center text-text-secondary">Loading announcements...</div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
      <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Employee workspace</p>
          <h1 className="section-title mt-xs">Announcements</h1>
          <p className="section-subtitle mt-xs">Company-wide updates and notices visible to approved employees.</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Button variant="secondary" className="gap-sm" onClick={handleMarkAllAsRead}>
            <BellRing className="h-4 w-4" />
            Mark all as read
          </Button>
          {isAdmin && (
            <Button variant="primary" className="gap-sm" onClick={() => setIsBroadcasting(true)}>
              <Megaphone className="h-4 w-4" />
              Broadcast Update
            </Button>
          )}
        </div>
      </div>

      {isBroadcasting && (
        <div className="card p-lg border-primary-500/30 bg-primary-50/50 dark:bg-primary-900/10 mb-lg">
          <h2 className="text-lg font-bold text-text-primary mb-md">Broadcast Company Update</h2>
          <div className="flex flex-col gap-md">
            <Input
              label="Announcement Title"
              placeholder="e.g. Q3 Townhall Scheduled"
              value={newAnnouncement.title}
              onChange={e => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
            />
            <Input
              label="Message Body"
              placeholder="Detailed announcement content..."
              value={newAnnouncement.message}
              onChange={e => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
            />
            <div className="flex justify-end gap-sm mt-sm">
              <Button variant="secondary" onClick={() => setIsBroadcasting(false)}>Cancel</Button>
              <Button
                variant="primary"
                isLoading={broadcastingLoading}
                onClick={async () => {
                  if (!newAnnouncement.title || !newAnnouncement.message) return;
                  setBroadcastingLoading(true);
                  try {
                    await broadcastAnnouncement(newAnnouncement);
                    setIsBroadcasting(false);
                    setNewAnnouncement({ title: '', message: '' });
                    showToast('Update broadcasted successfully!');
                  } catch {
                    showToast('Failed to broadcast update.', 'warning');
                  } finally {
                    setBroadcastingLoading(false);
                  }
                }}
              >
                Send to All Employees
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Alert variant={toast.variant} title="Notice">
          {toast.message}
        </Alert>
      )}

      <div className="grid gap-md md:grid-cols-3">
        {[
          { label: 'Unread', value: announcements.filter(a => a.status === 'New').length.toString(), icon: Megaphone },
          { label: 'Pinned', value: announcements.filter(a => a.status === 'Pinned').length.toString(), icon: Pin },
          { label: 'Audience', value: 'All Employees', icon: Users2 },
        ].map(metric => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="card p-lg flex items-center justify-between gap-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{metric.label}</p>
                <p className="mt-sm text-2xl font-extrabold text-text-primary">{metric.value}</p>
              </div>
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )
        })}
      </div>

      <div className="grid gap-lg xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-md">
          {announcements.length === 0 && (
            <div className="card p-lg text-center text-text-secondary">No announcements found.</div>
          )}
          {announcements.map(item => (
            <div key={item.id} className="card p-lg sm:p-xl">
              <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-sm">
                  <div className="flex flex-wrap items-center gap-sm">
                    <Badge variant={item.status === 'Pinned' ? 'primary' : item.status === 'New' ? 'warning' : 'neutral'}>{item.status}</Badge>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">{item.category}</span>
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">{item.title}</h2>
                  <p className="text-sm leading-6 text-text-secondary">{item.body}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-md py-sm text-sm text-text-secondary">
                  <p className="font-semibold text-text-primary">{item.date}</p>
                  <p className="mt-xs">{item.audience}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-md">
          <div className="card p-lg">
            <div className="flex items-center gap-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-cyan-200">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">Upcoming reminders</h2>
                <p className="text-sm text-text-secondary">Simple employee-facing feed for announcements and deadlines.</p>
              </div>
            </div>
            <div className="mt-md space-y-sm text-sm text-text-secondary">
              <p>• Submit leave requests before payroll cutoff.</p>
              <p>• Review your profile and emergency contact information.</p>
              <p>• Watch for team-specific updates from HR.</p>
            </div>
          </div>

          <div className="card p-lg bg-slate-950 text-white border-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Why this page exists</p>
            <p className="mt-sm text-sm leading-6 text-slate-300">
              Employees should only see their own workspace modules. This announcements view keeps the experience clean, focused, and separate from the admin tooling.
            </p>
            <div className="mt-md flex items-center gap-sm text-xs text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Approved employee access only
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
