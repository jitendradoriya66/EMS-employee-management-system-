import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, Clock3, AlertCircle, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { formatDate } from '@/utils/helpers'
import { useAuth } from '@/contexts/AuthContext'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { CircleCheck, CircleX } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ModernPagination } from '@/components/common/ModernPagination'

export const LeavePage: React.FC = () => {
  const { user } = useAuth()
  const isEmployee = (user?.role ?? 'employee') === 'employee'
  
  const {
    employeeLeaves, employeeTotalCount,
    pendingLeaves, reviewedLeaves, reviewedTotalCount,
    stats, loading,
    fetchEmployeeLeaves, fetchAdminLeaves,
    approveLeave, rejectLeave, submitLeave
  } = useLeaveRequests()

  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: '',
  })
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [confirmApprove, setConfirmApprove] = useState<string | null>(null)
  const [confirmReject, setConfirmReject] = useState<string | null>(null)

  const [employeePage, setEmployeePage] = useState(1)
  const [adminPage, setAdminPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    if (isEmployee) {
      fetchEmployeeLeaves(employeePage, itemsPerPage)
    } else {
      fetchAdminLeaves(adminPage, itemsPerPage)
    }
  }, [isEmployee, employeePage, adminPage, itemsPerPage, fetchEmployeeLeaves, fetchAdminLeaves])

  const totalMyLeavesPages = Math.max(1, Math.ceil(employeeTotalCount / itemsPerPage))
  const totalAdminPages = Math.max(1, Math.ceil(reviewedTotalCount / itemsPerPage))
  
  const leaveBalance = stats?.leave_balance ?? 20

  const handleLeaveSubmit = async () => {
    try {
      setErrorMessage(null)
      
      if (!leaveForm.reason.trim()) {
        setErrorMessage("Please provide a reason for your leave.")
        return
      }

      const start = new Date(leaveForm.startDate)
      const end = new Date(leaveForm.endDate)
      
      if (end < start) {
        setErrorMessage("End date cannot be before start date.")
        return
      }
      
      const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      if (requestedDays > leaveBalance) {
        setErrorMessage(`Insufficient leave balance. You are requesting ${requestedDays} days but only have ${leaveBalance} days left.`)
        return
      }

      setSubmissionState('submitting')
      await submitLeave({
        start_date: leaveForm.startDate,
        end_date: leaveForm.endDate,
        reason: leaveForm.reason
      }, employeePage)
      
      setSubmissionState('submitted')
      setLeaveForm({
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        reason: '',
      })
    } catch (error: any) {
      console.error('Failed to submit leave', error)
      setSubmissionState('error')
      setErrorMessage(
        error.response?.data?.detail || 
        error.response?.data?.start_date?.[0] || 
        error.response?.data?.end_date?.[0] || 
        error.response?.data?.[0] || 
        'Failed to submit leave request.'
      )
    }
  }

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
              { label: 'Pending requests', value: String(stats?.pending || 0), icon: Clock3 },
              { label: 'Approved leaves', value: String(stats?.approved || 0), icon: CheckCircle2 },
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
            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-md text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
                {errorMessage}
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
              {employeeLeaves.map(request => (
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
              {!loading && employeeTotalCount === 0 && <p className="text-sm text-text-secondary">No leave history is available yet.</p>}
            </div>
            
            {employeeTotalCount > 0 && (
              <ModernPagination
                currentPage={employeePage}
                totalPages={totalMyLeavesPages}
                onPageChange={setEmployeePage}
              />
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
      <ConfirmDialog
        isOpen={!!confirmApprove}
        title="Approve Leave Request"
        message="Are you sure you want to approve this leave request? This will deduct from the employee's leave balance."
        confirmText="Approve"
        variant="info"
        onConfirm={() => {
          if (confirmApprove) approveLeave(confirmApprove, adminPage)
          setConfirmApprove(null)
        }}
        onCancel={() => setConfirmApprove(null)}
      />

      <ConfirmDialog
        isOpen={!!confirmReject}
        title="Reject Leave Request"
        message="Are you sure you want to reject this leave request? The employee will be notified."
        confirmText="Reject"
        variant="danger"
        onConfirm={() => {
          if (confirmReject) rejectLeave(confirmReject, adminPage)
          setConfirmReject(null)
        }}
        onCancel={() => setConfirmReject(null)}
      />

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
            { label: 'Pending requests', value: stats?.pending || 0, icon: CalendarDays, tone: 'text-primary-600' },
            { label: 'Approved leaves', value: stats?.approved || 0, icon: CheckCircle2, tone: 'text-emerald-600' },
            { label: 'Rejected leaves', value: stats?.rejected || 0, icon: AlertCircle, tone: 'text-rose-600' },
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
            {stats?.departments?.map((dept: any) => (
              <div key={dept.dept_name} className="flex items-center justify-between rounded-2xl border border-border bg-background px-md py-sm">
                <span className="text-sm font-semibold text-text-primary">{dept.dept_name || 'Unassigned'}</span>
                <span className="text-sm font-bold text-text-secondary">{dept.count} leave days</span>
              </div>
            ))}
            {!stats?.departments?.length && <p className="text-sm text-text-secondary">No leave records by department.</p>}
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
            {pendingLeaves.map(request => (
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
                  <Button variant="primary" className="flex-1 gap-sm" onClick={() => setConfirmApprove(request.id)}>
                    <CircleCheck className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button variant="secondary" className="flex-1 gap-sm" onClick={() => setConfirmReject(request.id)}>
                    <CircleX className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {!loading && pendingLeaves.length === 0 && (
              <div className="inline-flex items-center gap-xs px-md py-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                All caught up! Great work!
              </div>
            )}
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
          {reviewedLeaves.map(request => (
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
          {!loading && reviewedTotalCount === 0 && <p className="text-sm text-text-secondary col-span-full">No reviewed requests found.</p>}
        </div>
        
        {reviewedTotalCount > 0 && (
          <ModernPagination
            currentPage={adminPage}
            totalPages={totalAdminPages}
            onPageChange={setAdminPage}
          />
        )}
      </div>
    </motion.div>
  )
}