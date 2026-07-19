import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, Clock3, AlertCircle, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { formatDate } from '@/utils/helpers'
import { useAuth } from '@/contexts/AuthContext'
import { submitLeaveRequest } from '@/utils/api'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { CircleCheck, CircleX } from 'lucide-react'

export const LeavePage: React.FC = () => {
  const { user } = useAuth()
  const { leaveRequests, approveLeave, rejectLeave } = useLeaveRequests()
  const isEmployee = (user?.role ?? 'employee') === 'employee'
  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: '',
  })
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle')

  const myLeaveRequests = useMemo(() => {
    if (!isEmployee || !user?.name) return leaveRequests;
    return leaveRequests.filter(r => r.employeeName.toLowerCase() === user.name.toLowerCase());
  }, [isEmployee, user?.name, leaveRequests]);

  const leaveBalance = useMemo(() => {
    const totalAllowance = 20;
    const approvedDays = myLeaveRequests
      .filter(r => r.status === 'approved')
      .reduce((total, r) => {
        const start = new Date(r.start_date);
        const end = new Date(r.end_date);
        const diffTime = end.getTime() - start.getTime();
        if (diffTime < 0) throw new Error("End date cannot be before start date");
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return total + diffDays;
      }, 0);
    return Math.max(0, totalAllowance - approvedDays);
  }, [myLeaveRequests]);

  const handleLeaveSubmit = async () => {
    try {
      setSubmissionState('submitting')
      await submitLeaveRequest({
        start_date: leaveForm.startDate,
        end_date: leaveForm.endDate,
        reason: leaveForm.reason
      })
      setSubmissionState('submitted')
    } catch (error) {
      console.error('Failed to submit leave', error)
      setSubmissionState('error')
    }
  }

  const leaveSummary = useMemo(() => {
    const totalRequests = leaveRequests.length
    const byDepartment = leaveRequests.reduce<Record<string, number>>((accumulator, req) => {
      const dept = req.department || 'Unknown'
      accumulator[dept] = (accumulator[dept] || 0) + 1
      return accumulator
    }, {})

    return {
      totalRequests,
      departments: Object.entries(byDepartment).sort((a, b) => b[1] - a[1]),
      approved: leaveRequests.filter(r => r.status === 'approved').length,
      rejected: leaveRequests.filter(r => r.status === 'rejected').length,
    }
  }, [leaveRequests])

  if (isEmployee) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
        <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
          <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="section-title">My Leave</h1>
              <p className="section-subtitle mt-xs">Apply for leave and review your recent leave activity.</p>
            </div>
            <Link to="/attendance" className="button-secondary inline-flex items-center gap-sm self-start">
              Check attendance
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-3">
            {[
              { label: 'Available balance', value: `${leaveBalance} days`, icon: CalendarDays },
              { label: 'Pending requests', value: String(myLeaveRequests.filter(r => r.status === 'pending').length), icon: Clock3 },
              { label: 'Approved leaves', value: String(myLeaveRequests.filter(r => r.status === 'approved').length), icon: CheckCircle2 },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-border bg-background p-md">
                  <div className="flex items-start justify-between gap-md">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{item.label}</p>
                      <p className="mt-sm text-3xl font-black text-text-primary">{item.value}</p>
                    </div>
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-lg xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-border bg-card p-lg shadow-sm space-y-md">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Apply for leave</h2>
              <p className="text-sm text-text-secondary">This is a UI-only request form for the employee workspace.</p>
            </div>
            {submissionState === 'submitted' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-md text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
                Your leave request has been queued for manager review.
              </div>
            )}
            <div className="grid gap-md">
              <Input label="Start date" type="date" value={leaveForm.startDate} onChange={event => setLeaveForm(previous => ({ ...previous, startDate: event.target.value }))} />
              <Input label="End date" type="date" value={leaveForm.endDate} onChange={event => setLeaveForm(previous => ({ ...previous, endDate: event.target.value }))} />
              <Input label="Reason" value={leaveForm.reason} onChange={event => setLeaveForm(previous => ({ ...previous, reason: event.target.value }))} placeholder="Vacation, illness, family matter..." />
            </div>
            <Button variant="primary" className="w-full" onClick={handleLeaveSubmit} disabled={submissionState === 'submitting'}>
              {submissionState === 'submitting' ? 'Submitting...' : 'Submit leave request'}
            </Button>
          </div>

          <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
            <div className="flex items-center justify-between gap-md">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Leave history</h2>
                <p className="text-sm text-text-secondary">Your recent approved and used leave entries.</p>
              </div>
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div className="mt-md space-y-sm">
              {myLeaveRequests.slice(0, 6).map(request => (
                <div key={request.id} className="rounded-2xl border border-border bg-background p-md">
                  <div className="flex items-center justify-between gap-md">
                    <div>
                      <p className="font-semibold text-text-primary">{request.employeeName}</p>
                      <p className="text-sm text-text-secondary">{request.department}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-semibold text-text-secondary">{formatDate(request.start_date)}</span>
                      <span className={`text-xs font-bold uppercase tracking-widest ${request.status === 'approved' ? 'text-emerald-600' : request.status === 'pending' ? 'text-amber-500' : 'text-rose-600'}`}>{request.status}</span>
                    </div>
                  </div>
                  <p className="mt-sm text-sm text-text-secondary">{request.reason}</p>
                </div>
              ))}
              {myLeaveRequests.length === 0 && <p className="text-sm text-text-secondary">No leave history is available yet.</p>}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
      <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
        <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="section-title">Leave Management</h1>
            <p className="section-subtitle mt-xs">Track balances, approvals, and leave trends without leaving the admin shell.</p>
          </div>
          <Link to="/dashboard" className="button-secondary inline-flex items-center gap-sm self-start">
            Back to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-3">
          {[
            { label: 'Pending requests', value: leaveRequests.filter(r => r.status === 'pending').length, icon: CalendarDays, tone: 'text-primary-600' },
            { label: 'Approved leaves', value: leaveSummary.approved, icon: CheckCircle2, tone: 'text-emerald-600' },
            { label: 'Rejected leaves', value: leaveSummary.rejected, icon: AlertCircle, tone: 'text-rose-600' },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-border bg-background p-md">
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{item.label}</p>
                    <p className="mt-sm text-3xl font-black text-text-primary">{item.value}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${item.tone}`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Leave by department</h2>
              <p className="text-sm text-text-secondary">Teams with the highest leave load.</p>
            </div>
            <Users className="h-5 w-5 text-primary-600" />
          </div>

          <div className="mt-md space-y-sm">
            {leaveSummary.departments.map(([department, count]) => (
              <div key={department} className="flex items-center justify-between rounded-2xl border border-border bg-background px-md py-sm">
                <span className="text-sm font-semibold text-text-primary">{department}</span>
                <span className="text-sm font-bold text-text-secondary">{count} leave days</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Pending Requests</h2>
              <p className="text-sm text-text-secondary">Needs admin or HR review.</p>
            </div>
            <Clock3 className="h-5 w-5 text-amber-600" />
          </div>

          <div className="mt-md space-y-sm">
            {leaveRequests.filter(r => r.status === 'pending').map(request => (
              <div key={request.id} className="rounded-2xl border border-border bg-amber-50/50 p-md dark:bg-amber-950/20">
                <div className="flex items-center justify-between gap-md">
                  <div>
                    <p className="font-semibold text-text-primary">{request.employeeName}</p>
                    <p className="text-sm text-text-secondary">{request.department}</p>
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">{formatDate(request.start_date)}</span>
                </div>
                <p className="mt-sm text-sm text-text-secondary">{request.reason}</p>
                <div className="mt-md flex gap-sm">
                  <Button variant="primary" className="flex-1 gap-sm" onClick={() => approveLeave(request.id)}>
                    <CircleCheck className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button variant="secondary" className="flex-1 gap-sm" onClick={() => rejectLeave(request.id)}>
                    <CircleX className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {leaveRequests.filter(r => r.status === 'pending').length === 0 && <p className="text-sm text-text-secondary">No pending leave requests.</p>}
          </div>
        </div>
      </div>

      <div className="mt-lg rounded-3xl border border-border bg-card p-lg shadow-sm">
        <div className="flex items-center justify-between gap-md">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Recent request history</h2>
            <p className="text-sm text-text-secondary">Recently reviewed leave entries.</p>
          </div>
          <Clock3 className="h-5 w-5 text-primary-600" />
        </div>

        <div className="mt-md grid grid-cols-1 gap-sm sm:grid-cols-2 xl:grid-cols-3">
          {leaveRequests.filter(r => r.status !== 'pending').slice(0, 6).map(request => (
            <div key={request.id} className="rounded-2xl border border-border bg-background p-md">
              <div className="flex items-center justify-between gap-md">
                <div>
                  <p className="font-semibold text-text-primary">{request.employeeName}</p>
                  <p className="text-sm text-text-secondary">{request.department}</p>
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${request.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {request.status}
                </span>
              </div>
              <p className="mt-sm text-sm text-text-secondary">{request.reason}</p>
            </div>
          ))}
          {leaveRequests.filter(r => r.status !== 'pending').length === 0 && <p className="text-sm text-text-secondary col-span-full">No reviewed requests found.</p>}
        </div>
      </div>
    </motion.div>
  )
}