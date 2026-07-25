import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, Printer, Mail, CalendarClock, ShieldCheck, Clock3, Users, TrendingUp } from 'lucide-react'
import { useEmployees } from '@/hooks/useEmployees'
import { Button } from '@/components/common/Button'
import { UnifiedLoader } from '@/components/common/UnifiedLoader'

interface ReportMetric {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  tone: 'primary' | 'success' | 'warning' | 'danger'
}

export const ReportsPage: React.FC = () => {
  const { employees, loading } = useEmployees();
  const reportDate = useMemo(() => new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }), [])

  const summary = useMemo(() => {
    const totalEmployees = employees.length
    const active = employees.filter(employee => employee.status === 'active').length
    const onLeave = employees.filter(employee => employee.status === 'on-leave').length
    const inactive = employees.filter(employee => employee.status === 'inactive').length

    const attendance = employees.reduce(
      (result, employee) => {
        const logs = employee.attendanceLog || [];
        logs.forEach(entry => {
          result.total += 1
          if (entry.status === 'present') result.present += 1
          if (entry.status === 'late') result.late += 1
          if (entry.status === 'leave') result.leave += 1
        })
        return result
      },
      { total: 0, present: 0, late: 0, leave: 0 }
    )

    const avgPerformance = employees.filter(employee => typeof employee.performanceScore === 'number')
      .reduce((sum, employee) => sum + (employee.performanceScore || 0), 0)

    const performanceCount = employees.filter(employee => typeof employee.performanceScore === 'number').length

    return {
      totalEmployees,
      active,
      onLeave,
      inactive,
      attendance,
      avgPerformance: performanceCount > 0 ? Math.round(avgPerformance / performanceCount) : 0,
    }
  }, [employees])

  const topAbsences = useMemo(() => {
    return employees
      .map(employee => {
        const logs = employee.attendanceLog || [];
        const leaves = logs.filter(entry => entry.status === 'leave').length || 0
        const late = logs.filter(entry => entry.status === 'late').length || 0
        return {
          name: `${employee.firstName} ${employee.lastName}`,
          department: employee.department,
          leaves,
          late,
          total: leaves + late,
        }
      })
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [employees])

  const metrics: ReportMetric[] = [
    { label: 'Total Employees', value: String(summary.totalEmployees), icon: Users, tone: 'primary' },
    { label: 'Attendance Entries', value: String(summary.attendance.total), icon: Clock3, tone: 'success' },
    { label: 'On Leave', value: String(summary.onLeave), icon: CalendarClock, tone: 'warning' },
    { label: 'Inactive', value: String(summary.inactive), icon: ShieldCheck, tone: 'danger' },
  ]

  const toneClasses = {
    primary: 'bg-slate-950 text-white border-white/10 shadow-sm',
    success: 'bg-emerald-950 text-emerald-100 border-emerald-900/40 shadow-sm',
    warning: 'bg-amber-950 text-amber-100 border-amber-900/40 shadow-sm',
    danger: 'bg-rose-950 text-rose-100 border-rose-900/40 shadow-sm',
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <UnifiedLoader message="Loading reports..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-lg report-page"
    >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-md no-print">
        <div>
          <h1 className="section-title">Employee Reports</h1>
          <p className="section-subtitle mt-xs">Print-ready attendance, leave, and workforce summary for admin review.</p>
        </div>

        <div className="flex flex-wrap gap-sm">
          <Button variant="secondary" onClick={handlePrint} className="gap-sm">
            <Printer className="h-4 w-4" />
            Save as PDF
          </Button>
          <Button variant="primary" onClick={handlePrint} className="gap-sm">
            <Download className="h-4 w-4" />
            Share with Admin
          </Button>
        </div>
      </div>

      <div className="card p-lg sm:p-xl space-y-lg report-sheet">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-md border-b border-border pb-lg">
          <div>
            <div className="inline-flex items-center gap-sm rounded-full border border-border bg-background px-md py-xs text-xs font-semibold text-text-secondary">
              <FileText className="h-4 w-4 text-primary" />
              Workforce Hub Report
            </div>
            <h2 className="mt-md text-2xl font-bold text-text-primary">Attendance and Leave Overview</h2>
            <p className="mt-xs text-sm text-text-secondary">Generated on {reportDate} for People Operations Admin.</p>
          </div>

          <div className="rounded-xl border border-border bg-background px-md py-sm text-sm text-text-secondary">
            <p className="font-semibold text-text-primary">Role</p>
            <p>People Operations Admin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
          {metrics.map(metric => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className={`rounded-xl border p-md ${toneClasses[metric.tone]}`}>
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-current/80">{metric.label}</p>
                    <p className="mt-sm text-3xl font-extrabold text-current">{metric.value}</p>
                  </div>
                  <Icon className="h-5 w-5 flex-shrink-0 text-current/90" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-2 rounded-xl border border-border bg-background p-lg">
            <div className="flex items-center justify-between gap-md mb-md">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Attendance Summary</h3>
                <p className="text-sm text-text-secondary mt-xs">Present, late, and leave counts across all logs.</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              {[
                { label: 'Present', value: summary.attendance.present, tone: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300' },
                { label: 'Late', value: summary.attendance.late, tone: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300' },
                { label: 'Leave', value: summary.attendance.leave, tone: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl border border-border p-md ${item.tone}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider">{item.label}</p>
                  <p className="mt-sm text-2xl font-extrabold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-lg">
            <h3 className="text-lg font-bold text-text-primary">Key Notes</h3>
            <ul className="mt-md space-y-sm text-sm text-text-secondary">
              <li>Average performance score: <span className="font-semibold text-text-primary">{summary.avgPerformance}%</span></li>
              <li>Current active workforce: <span className="font-semibold text-text-primary">{summary.active}</span></li>
              <li>Reports are print-ready for PDF export or admin sharing.</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          <div className="rounded-xl border border-border bg-background p-lg">
            <h3 className="text-lg font-bold text-text-primary">Department & Role Mix</h3>
            <div className="mt-md grid grid-cols-1 sm:grid-cols-2 gap-sm text-sm">
              {['Engineering', 'Product', 'Sales', 'HR', 'Finance'].map(department => {
                const count = employees.filter(employee => employee.department === department).length
                return (
                  <div key={department} className="flex items-center justify-between rounded-lg border border-border px-md py-sm">
                    <span className="text-text-secondary">{department}</span>
                    <span className="font-semibold text-text-primary">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-lg">
            <h3 className="text-lg font-bold text-text-primary">Employees Needing Review</h3>
            <div className="mt-md space-y-sm">
              {topAbsences.length > 0 ? topAbsences.map(person => (
                <div key={person.name} className="flex items-center justify-between gap-md rounded-lg border border-border px-md py-sm">
                  <div>
                    <p className="font-semibold text-text-primary">{person.name}</p>
                    <p className="text-xs text-text-secondary">{person.department}</p>
                  </div>
                  <div className="text-right text-xs text-text-secondary">
                    <p>{person.late} late</p>
                    <p>{person.leaves} leave</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-text-secondary">No leave or late trends to flag right now.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm mb-md">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Admin Summary</h3>
              <p className="text-sm text-text-secondary mt-xs">This section is intended to be saved as a PDF and sent directly to leadership.</p>
            </div>
            <span className="inline-flex items-center gap-xs text-xs font-semibold text-primary">
              <Mail className="h-4 w-4" />
              Ready to share
            </span>
          </div>

          <p className="text-sm text-text-secondary leading-6">
            Workforce Hub consolidates employee attendance, leave, and performance signals into a print-friendly admin report. Use the buttons above to save the current view as PDF or share it during review meetings.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
