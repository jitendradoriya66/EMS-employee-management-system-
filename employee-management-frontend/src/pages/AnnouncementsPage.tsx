import React from 'react'
import { motion } from 'framer-motion'
import { Megaphone, BellRing, Pin, Users2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { Alert } from '@/components/common/Alert'
import { Input } from '@/components/common/Input'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { UnifiedLoader } from '@/components/common/UnifiedLoader'

export const AnnouncementsPage: React.FC = () => {
  const { announcements, loading, markAllAsRead, broadcastAnnouncement } = useAnnouncements()
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
      await markAllAsRead()
      showToast('All announcements marked as read.')
    } catch {
      showToast('Failed to mark as read', 'warning')
    }
  }

  if (loading) {
    return <UnifiedLoader message="Loading announcements..." />
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
      <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Announcements</h1>
          <p className="section-subtitle mt-xs">Company-wide updates and important notices.</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          {announcements.some(a => a.status === 'New') && (
            <Button variant="secondary" className="gap-sm" onClick={handleMarkAllAsRead}>
              <CheckCircle2 className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
          {isAdmin && (
            <Button variant="primary" className="gap-sm shadow-primary-500/20" onClick={() => setIsBroadcasting(true)}>
              <Megaphone className="h-4 w-4" />
              Broadcast Update
            </Button>
          )}
        </div>
      </div>

      {isBroadcasting && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-[2rem] border border-primary-500/30 bg-primary-50/50 dark:bg-primary-900/10 p-xl shadow-sm mb-lg">
          <h2 className="text-xl font-bold text-text-primary mb-md">Broadcast Company Update</h2>
          <div className="flex flex-col gap-md">
            <Input
              label="Announcement Title"
              placeholder="e.g. Q3 Townhall Scheduled"
              value={newAnnouncement.title}
              onChange={e => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
            />
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Message Body</label>
              <textarea
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors resize-none h-32"
                placeholder="Detailed announcement content..."
                value={newAnnouncement.message}
                onChange={e => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
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
        </motion.div>
      )}

      {toast && (
        <Alert variant={toast.variant} title="Notice">
          {toast.message}
        </Alert>
      )}

      <div className="grid gap-md md:grid-cols-3">
        {[
          { label: 'Unread', value: announcements.filter(a => a.status === 'New').length.toString(), icon: BellRing, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
          { label: 'Total Broadcasts', value: announcements.length.toString(), icon: Megaphone, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30' },
          { label: 'Audience', value: 'All Employees', icon: Users2, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        ].map(metric => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="rounded-2xl border border-border bg-card p-lg flex items-center justify-between gap-md shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{metric.label}</p>
                <p className="mt-sm text-3xl font-black text-text-primary">{metric.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${metric.bg}`}>
                <Icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-xl">
        <h2 className="text-lg font-bold text-text-primary mb-md flex items-center gap-2">
          <Pin className="h-5 w-5 text-primary-500" /> Recent Updates
        </h2>
        
        <div className="space-y-md">
          {announcements.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-background p-xl text-center flex flex-col items-center">
              <Megaphone className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-lg font-bold text-text-primary">No announcements yet</p>
              <p className="text-text-secondary text-sm mt-1">Company-wide updates will appear here.</p>
            </div>
          )}
          
          {announcements.map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={item.id} 
              className={`rounded-[2rem] border ${item.status === 'New' ? 'border-primary-500/30 bg-primary-50/10 dark:bg-primary-900/5' : 'border-border bg-card'} p-lg sm:p-xl shadow-sm transition-all hover:shadow-md relative overflow-hidden`}
            >
              {item.status === 'New' && (
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500" />
              )}
              <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-sm max-w-3xl">
                  <div className="flex flex-wrap items-center gap-sm">
                    {item.status === 'New' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        New
                      </span>
                    )}
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Update</span>
                    <span className="text-xs text-text-secondary">• {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{item.body}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-md py-sm text-sm text-text-secondary flex-shrink-0 text-center sm:text-right">
                  <p className="font-semibold text-text-primary">{item.date}</p>
                  <p className="mt-xs text-xs uppercase tracking-wider">{item.audience}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
