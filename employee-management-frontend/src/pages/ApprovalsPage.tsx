import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, CircleCheck, CircleX, Clock3, Search, ShieldCheck, Sparkles, X, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { UserAccount, UserRole } from '@/types'

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin_hr: 'Admin / HR',
  employee: 'Employee',
}

const roleSelectOptions = [
  { value: 'employee', label: 'Employee' },
  { value: 'admin_hr', label: 'Admin / HR' },
  { value: 'super_admin', label: 'Super Admin' },
]

function formatDate(value: string | null) {
  if (!value) {
    return 'Never'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export const ApprovalsPage: React.FC = () => {
  const { users, fetchUsers, approveUser, rejectUser } = useAuth()
  const [search, setSearch] = useState('')
  const [roleSelection, setRoleSelection] = useState<Record<string, UserRole>>({})
  const [focusedUser, setFocusedUser] = useState<UserAccount | null>(null)
  
  const [confirmApprove, setConfirmApprove] = useState<UserAccount | null>(null)
  const [confirmReject, setConfirmReject] = useState<UserAccount | null>(null)

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const pendingUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter(user => user.approvalStatus === 'pending' && (!query || [user.name, user.email, user.department].some(field => (field || '').toLowerCase().includes(query))))
  }, [search, users])

  const stats = useMemo(() => ({
    pending: pendingUsers.length,
    reviewed: users.filter(user => user.approvalStatus === 'approved').length,
    rejected: users.filter(user => user.approvalStatus === 'rejected').length,
  }), [pendingUsers.length, users])

  const approve = (user: UserAccount) => {
    approveUser(user.id, roleSelection[user.id] || 'employee')
    setConfirmApprove(null)
    setFocusedUser(null)
  }

  const reject = (user: UserAccount) => {
    rejectUser(user.id)
    setConfirmReject(null)
    setFocusedUser(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
      {confirmApprove && (
        <ConfirmDialog
          isOpen={true}
          title="Approve User Registration"
          message={`Are you sure you want to approve ${confirmApprove.name} as ${roleLabels[roleSelection[confirmApprove.id] || 'employee']}? They will gain access to the system.`}
          confirmText="Approve"
          variant="info"
          onConfirm={() => approve(confirmApprove)}
          onCancel={() => setConfirmApprove(null)}
        />
      )}
      
      {confirmReject && (
        <ConfirmDialog
          isOpen={true}
          title="Reject User Registration"
          message={`Are you sure you want to reject ${confirmReject.name}? Their registration details will be permanently deleted.`}
          confirmText="Reject"
          variant="danger"
          onConfirm={() => reject(confirmReject)}
          onCancel={() => setConfirmReject(null)}
        />
      )}

      <div className="rounded-3xl border border-border bg-card p-lg shadow-xl shadow-slate-900/5">
        <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Access control</p>
            <h1 className="section-title mt-xs">Approval Queue</h1>
            <p className="section-subtitle mt-xs">Review registrations, assign roles, and approve or reject requests from a dedicated screen.</p>
          </div>
          <Link to="/users" className="button-secondary inline-flex items-center gap-sm self-start">
            Back to user management
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-lg grid gap-md md:grid-cols-3">
          {[
            { label: 'Pending', value: stats.pending, icon: Clock3 },
            { label: 'Approved', value: stats.reviewed, icon: BadgeCheck },
            { label: 'Rejected', value: stats.rejected, icon: CircleX },
          ].map(metric => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="rounded-2xl border border-border bg-background p-md">
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{metric.label}</p>
                    <p className="mt-sm text-3xl font-black text-text-primary">{metric.value}</p>
                  </div>
                  <Icon className="h-5 w-5 text-primary-600" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-lg">
        <div className="space-y-lg">
          <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-md top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <Input
                placeholder="Search pending users by name, email, or department"
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="pl-3xl"
              />
            </div>
          </div>

          <div className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
            {pendingUsers.length > 0 ? pendingUsers.map(user => (
              <article
                key={user.id}
                className="rounded-3xl border border-border bg-card p-lg text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex w-full items-start justify-between gap-md text-left">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-text-primary">{user.name}</p>
                    <p className="truncate text-sm text-text-secondary">{user.email}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
                <div className="mt-md grid gap-sm text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background p-md">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Department</p>
                    <p className="mt-xs font-semibold text-text-primary">{user.department || 'Unassigned'}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-md">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Registered</p>
                    <p className="mt-xs font-semibold text-text-primary">{formatDate(user.registrationDate)}</p>
                  </div>
                </div>
                <div className="mt-md">
                  <Select
                    label="Approve as"
                    value={roleSelection[user.id] || 'employee'}
                    onChange={event => setRoleSelection(previous => ({ ...previous, [user.id]: event.target.value as UserRole }))}
                    options={roleSelectOptions}
                  />
                </div>
                <div className="mt-md flex flex-wrap gap-sm">
                  <Button variant="secondary" className="px-md" onClick={() => setFocusedUser(user)} aria-label="View details">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="primary" className="flex-1 gap-sm" onClick={() => setConfirmApprove(user)}>
                    <CircleCheck className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button variant="secondary" className="px-md text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/30" onClick={() => setConfirmReject(user)} aria-label="Reject">
                    <CircleX className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            )) : (
              <div className="rounded-3xl border border-dashed border-border bg-card p-xl text-center shadow-sm lg:col-span-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-cyan-200">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="mt-md text-xl font-bold text-text-primary">No pending approvals</h2>
                <p className="mt-sm text-sm text-text-secondary">New user registrations will show up here for role assignment and approval.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {focusedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-md backdrop-blur-sm"
            onClick={() => setFocusedUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]"
              onClick={event => event.stopPropagation()}
            >
              <div className="flex-shrink-0 flex items-start justify-between gap-md border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-lg py-md text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Approval details</p>
                  <h3 className="mt-xs text-2xl font-bold">{focusedUser.name}</h3>
                  <p className="text-sm text-slate-300">{focusedUser.email}</p>
                </div>
                <button onClick={() => setFocusedUser(null)} className="rounded-full border border-white/10 bg-white/10 p-sm text-white transition-colors hover:bg-white/15" aria-label="Close approval details">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto">
                <div className="grid gap-md p-lg sm:grid-cols-2">
                {[
                  { label: 'Department', value: focusedUser.department || 'Unassigned' },
                  { label: 'Registered', value: formatDate(focusedUser.registrationDate) },
                  { label: 'Assigned role', value: roleLabels[roleSelection[focusedUser.id] || 'employee'] },
                  { label: 'Status', value: 'Pending approval' },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl border border-border bg-background px-md py-sm text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{item.label}</p>
                    <p className="mt-xs font-semibold text-text-primary">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="p-lg border-t border-border bg-slate-950 text-white">
                <div className="flex items-center gap-sm text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.24em]">Approvals</span>
                </div>
                <p className="mt-md text-sm leading-6 text-slate-300">
                  Review the registration details, assign the correct role on the card if needed, and finalize the workflow.
                </p>
                <div className="mt-lg flex flex-col gap-sm sm:flex-row">
                  <Button variant="primary" className="flex-1 gap-sm" onClick={() => setConfirmApprove(focusedUser)}>
                    <CircleCheck className="h-4 w-4" />
                    Approve request
                  </Button>
                  <Button variant="secondary" className="flex-1 gap-sm border-white/20 text-white hover:bg-white/10" onClick={() => setConfirmReject(focusedUser)}>
                    <CircleX className="h-4 w-4" />
                    Reject request
                  </Button>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}