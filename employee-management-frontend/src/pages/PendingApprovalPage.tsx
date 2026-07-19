import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock3, ShieldAlert, LogOut, RefreshCw, Mail, BadgeAlert } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'

export const PendingApprovalPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (user?.approvalStatus === 'approved' && user.accountStatus === 'active') {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, user?.accountStatus, user?.approvalStatus])

  const statusTone = user?.approvalStatus === 'rejected'
    ? 'danger'
    : user?.accountStatus === 'inactive'
      ? 'neutral'
      : 'warning'

  const title = user?.approvalStatus === 'rejected'
    ? 'Your account was not approved'
    : 'Your account is waiting for administrator approval'

  const description = user?.approvalStatus === 'rejected'
    ? 'An administrator reviewed your registration and rejected access. You can contact your HR team for clarification or create a new request if instructed.'
    : 'Your registration has been received. An administrator will review your profile, assign a role, and unlock access to the appropriate modules.'

  const handleReturnToLogin = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-background p-md md:p-xl flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-60 pointer-events-none" aria-hidden="true">
        <div className="absolute -left-16 top-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div className="grid gap-lg lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card overflow-hidden border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl shadow-slate-950/30">
            <div className="border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-lg py-lg text-white sm:px-xl">
              <div className="flex flex-wrap items-center gap-sm">
                <Badge variant={statusTone as 'warning' | 'danger' | 'neutral'} className="bg-white/10 text-white border border-white/10">
                  {user?.approvalStatus === 'rejected' ? 'Access Rejected' : 'Pending Approval'}
                </Badge>
                <span className="inline-flex items-center gap-xs rounded-full border border-cyan-400/30 bg-cyan-400/10 px-sm py-xs text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Account Review
                </span>
              </div>

              <h1 className="mt-md text-3xl font-black tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
              <p className="mt-sm max-w-2xl text-sm text-slate-300 sm:text-base">
                {description}
              </p>
            </div>

            <div className="grid gap-lg px-lg py-lg sm:px-xl lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-lg">
                <div className="rounded-3xl border border-border bg-background/90 p-lg shadow-sm">
                  <div className="flex items-center gap-sm text-text-primary">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-cyan-200">
                      <Clock3 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Current status</p>
                      <p className="text-lg font-bold text-text-primary">
                        {user?.approvalStatus === 'rejected' ? 'Rejected' : 'Under review'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-lg space-y-sm text-sm text-text-secondary">
                    <p className="leading-6">
                      You can safely sign out and return later. When an administrator assigns a role, this screen will automatically unlock the main workspace.
                    </p>
                    <div className="flex flex-wrap gap-sm">
                      <Badge variant="neutral">Role assignment pending</Badge>
                      <Badge variant="primary">Secure workspace gating</Badge>
                      <Badge variant="success">Responsive approval flow</Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-background/90 p-lg shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-text-secondary">Account details</h2>
                  <div className="mt-md space-y-md">
                    {[
                      { label: 'Name', value: user?.name || 'New user' },
                      { label: 'Email', value: user?.email || 'Unknown' },
                      { label: 'Department', value: user?.department || 'Unassigned' },
                      { label: 'Assigned role', value: user?.role ? user.role.replace('_', ' ').toUpperCase() : 'Not assigned' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between gap-md rounded-2xl border border-border px-md py-sm">
                        <span className="text-sm text-text-secondary">{item.label}</span>
                        <span className="text-sm font-semibold text-text-primary text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-lg">
                <div className="rounded-3xl border border-border bg-background p-lg shadow-sm">
                  <div className="grid gap-sm sm:grid-cols-3">
                    {[
                      { label: 'Registration', value: 'Completed', icon: CheckCircle2, tone: 'text-emerald-600' },
                      { label: 'Manager review', value: user?.approvalStatus === 'rejected' ? 'Declined' : 'Pending', icon: BadgeAlert, tone: 'text-amber-600' },
                      { label: 'Access', value: user?.approvalStatus === 'rejected' ? 'Blocked' : 'Locked', icon: ShieldAlert, tone: 'text-primary-600' },
                    ].map(item => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="rounded-2xl border border-border bg-card p-md">
                          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background ${item.tone}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="mt-sm text-xs font-semibold uppercase tracking-wider text-text-secondary">{item.label}</p>
                          <p className="mt-xs text-base font-bold text-text-primary">{item.value}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-background p-lg shadow-sm">
                  <div className="flex items-start justify-between gap-md">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">What happens next</p>
                      <h2 className="mt-xs text-xl font-bold text-text-primary">Role assignment unlocks access</h2>
                    </div>
                    <div className="rounded-2xl bg-primary-50 p-sm text-primary-700 dark:bg-primary-500/15 dark:text-cyan-200">
                      <Mail className="h-5 w-5" />
                    </div>
                  </div>

                  <ul className="mt-md space-y-sm text-sm text-text-secondary">
                    <li className="flex items-start gap-sm">
                      <span className="mt-2 h-2 w-2 rounded-full bg-cyan-400" />
                      <span>An administrator reviews your registration details.</span>
                    </li>
                    <li className="flex items-start gap-sm">
                      <span className="mt-2 h-2 w-2 rounded-full bg-cyan-400" />
                      <span>Your role is assigned as Employee or Admin / HR.</span>
                    </li>
                    <li className="flex items-start gap-sm">
                      <span className="mt-2 h-2 w-2 rounded-full bg-cyan-400" />
                      <span>The dashboard and modules become available immediately.</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-border bg-slate-950 p-lg text-white shadow-lg">
                  <div className="flex items-center gap-sm text-sm text-slate-300">
                    <RefreshCw className="h-4 w-4 text-cyan-300" />
                    Live status updates
                  </div>
                  <p className="mt-md text-sm leading-6 text-slate-300">
                    When an administrator changes your role or activates your account, this session will unlock the correct navigation automatically.
                  </p>
                  <div className="mt-lg flex flex-col gap-sm sm:flex-row">
                    <Button variant="secondary" onClick={() => navigate('/login')} className="flex-1">
                      Return to Sign In
                    </Button>
                    <Button variant="primary" onClick={handleReturnToLogin} className="flex-1 gap-sm">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border border-border bg-card/95 p-lg shadow-xl shadow-slate-900/10 backdrop-blur-sm sm:p-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-text-secondary">Access model</p>
            <h2 className="mt-sm text-2xl font-black text-text-primary">Simple RBAC with scalable guardrails</h2>
            <p className="mt-sm text-sm leading-6 text-text-secondary">
              Super Admin and Admin / HR users can review pending accounts, assign roles, and control account status from a single management surface.
            </p>

            <div className="mt-lg space-y-sm">
              {[
                'Registration creates a pending account record.',
                'Login routes pending users to this approval screen.',
                'Only approved and active accounts can enter the main workspace.',
                'Employees only see their own modules and profile tools.',
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-sm rounded-2xl border border-border bg-background/70 p-md">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-500/15 dark:text-cyan-200">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-text-primary">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-lg rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-lg text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Recommendation</p>
              <p className="mt-sm text-sm leading-6 text-slate-300">
                Open the User Management page as a Super Admin or Admin / HR user to approve requests, assign roles, and activate the workspace.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
