import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, DollarSign, Download, FileText, Layers3, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { usePayslips } from '@/hooks/usePayslips'
import { formatCurrency } from '@/utils/helpers'
import { useAuth } from '@/contexts/AuthContext'

export const PayrollPage: React.FC = () => {
  const { payslips, loading } = usePayslips();
  const { user } = useAuth()
  const isEmployee = (user?.role ?? 'employee') === 'employee'

  const myPayslips = useMemo(() => {
    if (!isEmployee || !user?.name) return payslips;
    return payslips.filter(p => p.employeeName.toLowerCase() === user.name.toLowerCase());
  }, [payslips, isEmployee, user?.name]);

  const currentPayslip = useMemo(() => {
    return myPayslips.length > 0 ? myPayslips[0] : null;
  }, [myPayslips]);

  const payroll = useMemo(() => {
    const byDepartment = payslips.reduce<Record<string, number>>((accumulator, slip) => {
      const dept = slip.department || 'Unknown'
      accumulator[dept] = (accumulator[dept] || 0) + (parseFloat(slip.gross_pay) || 0)
      return accumulator
    }, {})

    const totalAnnual = payslips.reduce((total, slip) => total + (parseFloat(slip.gross_pay) || 0), 0)

    return {
      totalMonthly: totalAnnual / 12,
      totalAnnual,
      byDepartment: Object.entries(byDepartment)
        .map(([department, value]) => ({ department, value }))
        .sort((a, b) => b.value - a.value),
    }
  }, [payslips])

  if (loading) return <div className="p-xl text-center text-text-secondary">Loading...</div>;

  if (isEmployee) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
        <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
          <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="section-title">My Payslips</h1>
              <p className="section-subtitle mt-xs">Review your current pay snapshot and download a clean payslip view.</p>
            </div>
            <button onClick={() => window.print()} className="button-secondary inline-flex items-center gap-sm self-start">
              Download PDF
              <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-3">
            {[
              { label: 'Annual salary', value: formatCurrency((currentPayslip?.gross_pay ? parseFloat(currentPayslip.gross_pay) : 0) * 12), icon: DollarSign },
              { label: 'Monthly estimate', value: formatCurrency(currentPayslip?.gross_pay ? parseFloat(currentPayslip.gross_pay) : 0), icon: TrendingUp },
              { label: 'Department', value: currentPayslip?.department || 'N/A', icon: Users },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-border bg-background p-md">
                  <div className="flex items-start justify-between gap-md">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{item.label}</p>
                      <p className="mt-sm text-2xl font-black text-text-primary">{item.value}</p>
                    </div>
                    <Icon className="h-5 w-5 text-primary-600" />
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
                <h2 className="text-lg font-bold text-text-primary">Payslip preview</h2>
                <p className="text-sm text-text-secondary">This layout mirrors a downloadable employee payroll summary.</p>
              </div>
              <FileText className="h-5 w-5 text-primary-600" />
            </div>

            <div className="mt-md rounded-3xl border border-border bg-background p-lg space-y-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Current employee</p>
              <p className="text-2xl font-black text-text-primary">{currentPayslip?.employeeName || user?.name || 'Employee'}</p>
              <p className="text-sm text-text-secondary">{currentPayslip?.department || 'N/A'}</p>
              <div className="mt-md grid gap-sm sm:grid-cols-2 text-sm">
                <div className="rounded-2xl border border-border p-md">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Gross Pay</p>
                  <p className="mt-xs text-lg font-bold text-text-primary">{formatCurrency(currentPayslip?.gross_pay ? parseFloat(currentPayslip.gross_pay) : 0)}</p>
                </div>
                <div className="rounded-2xl border border-border p-md">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Net Pay</p>
                  <p className="mt-xs text-lg font-bold text-text-primary">{formatCurrency(currentPayslip?.net_pay ? parseFloat(currentPayslip.net_pay) : 0)}</p>
                </div>
              </div>
            </div>

            <div className="mt-md flex flex-col gap-sm sm:flex-row">
              <Button variant="primary" className="flex-1" onClick={() => window.print()}>Download PDF</Button>
              <Button variant="secondary" className="flex-1" onClick={() => window.location.href = 'mailto:hr@company.com'}>Request payroll support</Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
            <h2 className="text-lg font-bold text-text-primary">Recent payroll notes</h2>
            <div className="mt-md space-y-sm text-sm text-text-secondary">
              <p>• Net pay reflects salary, deductions, and benefits from the current pay cycle.</p>
              <p>• Access is limited to your own payroll information.</p>
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
            <h1 className="section-title">Payroll Operations</h1>
            <p className="section-subtitle mt-xs">A lightweight payroll cockpit for compensation visibility and finance handoff.</p>
          </div>
          <Link to="/reports" className="button-secondary inline-flex items-center gap-sm self-start">
            View reports
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-3">
          {[
            { label: 'Monthly payroll', value: formatCurrency(payroll.totalMonthly), icon: DollarSign },
            { label: 'Annual payroll', value: formatCurrency(payroll.totalAnnual), icon: TrendingUp },
            { label: 'Compensation bands', value: String(payroll.byDepartment.length), icon: Users },
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
        <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Department payroll mix</h2>
              <p className="text-sm text-text-secondary">Use this view to review cost concentration by team.</p>
            </div>
            <Layers3 className="h-5 w-5 text-primary-600" />
          </div>

          <div className="mt-md space-y-sm">
            {payroll.byDepartment.map(item => (
              <div key={item.department} className="rounded-2xl border border-border bg-background p-md">
                <div className="flex items-center justify-between gap-md">
                  <span className="text-sm font-semibold text-text-primary">{item.department}</span>
                  <span className="text-sm font-bold text-text-secondary">{formatCurrency(item.value)}</span>
                </div>
                <div className="mt-md h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-400" style={{ width: `${Math.min(100, (item.value / payroll.totalAnnual) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Payroll run checklist</h2>
              <p className="text-sm text-text-secondary">Core steps that usually appear in a real enterprise payroll flow.</p>
            </div>
            <FileText className="h-5 w-5 text-primary-600" />
          </div>

          <div className="mt-md space-y-sm">
            {[
              'Validate time and attendance inputs',
              'Review leave deductions and approvals',
              'Apply allowances, bonuses, and adjustments',
              'Generate finance-ready export',
              'Notify managers of final approval status',
            ].map(step => (
              <div key={step} className="flex items-start gap-sm rounded-2xl border border-border bg-background p-md">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />
                <p className="text-sm text-text-primary">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
