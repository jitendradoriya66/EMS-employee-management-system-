import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, DollarSign, Download, FileText, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { usePayslips } from '@/hooks/usePayslips'
import { formatCurrency } from '@/utils/helpers'
import { useAuth } from '@/contexts/AuthContext'

export const PayrollPage: React.FC = () => {
  const { payslips, loading, generate, approve } = usePayslips();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = React.useState(false);

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
            <h2 className="text-lg font-bold text-text-primary">Payslip History</h2>
            <div className="mt-md space-y-sm text-sm text-text-secondary overflow-y-auto max-h-[300px]">
              {myPayslips.length === 0 ? (
                <p>No payslips found.</p>
              ) : (
                myPayslips.map(slip => (
                  <div key={slip.id} className="flex justify-between items-center p-sm border-b border-border last:border-0">
                    <div>
                      <p className="font-semibold text-text-primary">{slip.period_start} to {slip.period_end}</p>
                      <p className="text-xs">{slip.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary">{formatCurrency(parseFloat(slip.net_pay || '0'))}</p>
                      <Button variant="secondary" className="py-1 px-2 text-xs mt-1" onClick={() => window.print()}>
                        View
                      </Button>
                    </div>
                  </div>
                ))
              )}
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

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-[1fr]">
        <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
          <div className="flex items-center justify-between gap-md mb-md">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Manage Payroll Runs</h2>
              <p className="text-sm text-text-secondary">Generate and approve monthly payrolls.</p>
            </div>
            <div className="flex gap-sm">
              <select className="input-field max-w-[120px]" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <input type="number" className="input-field max-w-[100px]" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} />
              <Button 
                variant="primary" 
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    await generate(selectedMonth, selectedYear);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Payroll'}
              </Button>
            </div>
          </div>

          <div className="mt-md">
            {payslips.length === 0 ? (
              <p className="text-sm text-text-secondary">No payslips found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-secondary">
                  <thead className="bg-background text-xs uppercase text-text-primary">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Gross Pay</th>
                      <th className="px-4 py-3">Net Pay</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(slip => (
                      <tr key={slip.id} className="border-b border-border">
                        <td className="px-4 py-3 font-medium text-text-primary">{slip.employeeName}</td>
                        <td className="px-4 py-3">{slip.period_start} to {slip.period_end}</td>
                        <td className="px-4 py-3">{formatCurrency(parseFloat(slip.gross_pay || '0'))}</td>
                        <td className="px-4 py-3">{formatCurrency(parseFloat(slip.net_pay || '0'))}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${slip.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                            {slip.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {slip.status === 'draft' && (
                            <Button variant="secondary" className="py-1 px-3 text-xs" onClick={() => approve(slip.id)}>
                              Approve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
