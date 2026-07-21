import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, DollarSign, FileText, TrendingUp, Users, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePayslips } from '@/hooks/usePayslips'
import { formatCurrency } from '@/utils/helpers'
import { useAuth } from '@/contexts/AuthContext'
import { PayslipModal } from '@/components/payroll/PayslipModal'
import { ModernPagination } from '@/components/common/ModernPagination'

export const PayrollPage: React.FC = () => {
  const { payslips, loading, generate, approve } = usePayslips();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for the modal
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const { user } = useAuth()
  const isEmployee = (user?.role ?? 'employee') === 'employee'

  const myPayslips = useMemo(() => {
    if (!isEmployee || !user?.name) return payslips;
    return payslips.filter(p => p.employeeName.toLowerCase() === user.name.toLowerCase());
  }, [payslips, isEmployee, user?.name]);

  const currentPayslip = useMemo(() => {
    return myPayslips.length > 0 ? myPayslips[0] : null;
  }, [myPayslips]);

  const [employeePage, setEmployeePage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);
  const itemsPerPage = 6;

  const paginatedMyPayslips = useMemo(() => {
    const start = (employeePage - 1) * itemsPerPage;
    return myPayslips.slice(start, start + itemsPerPage);
  }, [employeePage, itemsPerPage, myPayslips]);

  const totalMyPayslipsPages = Math.max(1, Math.ceil(myPayslips.length / itemsPerPage));

  const paginatedPayslips = useMemo(() => {
    const start = (adminPage - 1) * itemsPerPage;
    return payslips.slice(start, start + itemsPerPage);
  }, [adminPage, itemsPerPage, payslips]);

  const totalPayslipsPages = Math.max(1, Math.ceil(payslips.length / itemsPerPage));

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

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );

  if (isEmployee) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
        {selectedPayslip && (
          <PayslipModal
            isOpen={!!selectedPayslip}
            onClose={() => setSelectedPayslip(null)}
            payslip={selectedPayslip}
          />
        )}
        
        <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-xl shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-lg lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Earnings & Statements</h1>
              <p className="text-slate-400 mt-2 max-w-md">Review your compensation history, download official statements, and track your net pay over time.</p>
            </div>
            
            {currentPayslip && (
              <button 
                onClick={() => setSelectedPayslip(currentPayslip)}
                className="inline-flex items-center justify-center gap-sm self-start lg:self-auto rounded-2xl bg-white px-xl py-lg font-bold text-slate-900 shadow-xl transition-all hover:scale-105 hover:bg-primary-50 active:scale-95"
              >
                View Latest Payslip
                <FileText className="h-5 w-5 text-primary-600" />
              </button>
            )}
          </div>

          <div className="mt-xl grid grid-cols-1 gap-md sm:grid-cols-3">
            {[
              { label: 'Current Base Salary', value: formatCurrency((currentPayslip?.gross_pay ? parseFloat(currentPayslip.gross_pay) : 0) * 12), icon: DollarSign, tone: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { label: 'Latest Net Pay', value: formatCurrency(currentPayslip?.net_pay ? parseFloat(currentPayslip.net_pay) : 0), icon: TrendingUp, tone: 'text-primary-400', bg: 'bg-primary-400/10' },
              { label: 'Department', value: currentPayslip?.department || 'N/A', icon: Users, tone: 'text-purple-400', bg: 'bg-purple-400/10' },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-lg backdrop-blur-md">
                  <div className="flex items-start justify-between gap-md">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                      <p className="mt-sm text-2xl font-black text-white">{item.value}</p>
                    </div>
                    <div className={`rounded-xl p-2 ${item.bg}`}>
                      <Icon className={`h-6 w-6 ${item.tone}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-xl shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-md mb-lg">
            <div className="rounded-xl bg-primary-100 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Calendar className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">Payslip History</h2>
          </div>
          
          <div className="space-y-sm text-sm">
            {myPayslips.length === 0 ? (
              <div className="py-xl text-center text-text-secondary flex flex-col items-center">
                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
                <p>No payslips have been generated for you yet.</p>
              </div>
            ) : (
              paginatedMyPayslips.map(slip => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={slip.id} 
                  className="flex flex-col sm:flex-row justify-between items-center p-md rounded-2xl border border-border bg-background hover:border-primary-200 dark:hover:border-primary-800 transition-colors gap-md"
                >
                  <div className="flex items-center gap-md w-full sm:w-auto">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary text-base">{new Date(slip.period_start).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {slip.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3" /> Processing
                          </span>
                        )}
                        <span className="text-text-secondary text-xs">•</span>
                        <span className="text-text-secondary text-xs">{slip.period_start} to {slip.period_end}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto gap-lg border-t border-border sm:border-0 pt-md sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Net Pay</p>
                      <p className="font-black text-text-primary text-lg">{formatCurrency(parseFloat(slip.net_pay || '0'))}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedPayslip(slip)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <FileText className="h-4 w-4" />
                      View
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          {myPayslips.length > 0 && (
            <div className="mt-md">
              <ModernPagination
                currentPage={employeePage}
                totalPages={totalMyPayslipsPages}
                onPageChange={setEmployeePage}
              />
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Admin / HR View
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
      
      {selectedPayslip && (
        <PayslipModal
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          payslip={selectedPayslip}
        />
      )}

      <div className="rounded-[2.5rem] border border-border bg-card p-xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-lg lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight">Payroll Operations</h1>
            <p className="text-text-secondary mt-2 max-w-lg">
              Manage compensation runs, approve pending slips, and gain visibility into the organization's financial obligations.
            </p>
          </div>
          <Link to="/reports" className="inline-flex items-center gap-sm rounded-full bg-slate-100 px-lg py-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
            View Analytics <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-xl grid grid-cols-1 gap-md md:grid-cols-3">
          {[
            { label: 'Total Payroll (Current)', value: formatCurrency(payroll.totalMonthly), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
            { label: 'Annual Projection', value: formatCurrency(payroll.totalAnnual), icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30' },
            { label: 'Active Payees', value: payslips.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-border bg-background p-lg">
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{item.label}</p>
                    <p className="mt-sm text-3xl font-black text-text-primary">{item.value}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${item.bg} ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-4">
        {/* Left Col: Generation Tools */}
        <div className="xl:col-span-1 space-y-lg">
          <div className="rounded-[2rem] border border-border bg-card p-xl shadow-sm">
            <h2 className="text-xl font-bold text-text-primary mb-2">Run Payroll</h2>
            <p className="text-sm text-text-secondary mb-lg">Select a period to dynamically generate payslips based on attendance.</p>
            
            <div className="space-y-md">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-2">Month</label>
                <select 
                  className="theme-select w-full py-3 px-4 bg-background border border-border rounded-xl font-medium" 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-2">Year</label>
                <input 
                  type="number" 
                  className="w-full py-3 px-4 bg-background border border-border rounded-xl font-medium outline-none focus:border-primary-500 transition-colors" 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(Number(e.target.value))} 
                />
              </div>

              <button 
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    await generate(selectedMonth, selectedYear);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-lg py-4 font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</>
                ) : (
                  <><Calendar className="h-5 w-5" /> Generate Run</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Ledger */}
        <div className="xl:col-span-3">
          <div className="rounded-[2.5rem] border border-border bg-card p-xl shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between gap-md mb-lg">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Payroll Ledger</h2>
                <p className="text-sm text-text-secondary mt-1">Review and approve generated payslips for all employees.</p>
              </div>
            </div>

            <div className="mt-md">
              {payslips.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-text-primary font-bold text-lg">No records found</p>
                  <p className="text-text-secondary text-sm mt-1">Generate a payroll run to populate this ledger.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
                      <tr>
                        <th className="px-4 py-4 font-bold">Employee</th>
                        <th className="px-4 py-4 font-bold">Period</th>
                        <th className="px-4 py-4 font-bold">Gross Pay</th>
                        <th className="px-4 py-4 font-bold">Net Pay</th>
                        <th className="px-4 py-4 font-bold">Status</th>
                        <th className="px-4 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedPayslips.map(slip => (
                        <tr key={slip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-4 font-bold text-text-primary">{slip.employeeName}</td>
                          <td className="px-4 py-4 text-text-secondary">{slip.period_start} <span className="text-slate-400">to</span> {slip.period_end}</td>
                          <td className="px-4 py-4 font-medium text-text-primary">{formatCurrency(parseFloat(slip.gross_pay || '0'))}</td>
                          <td className="px-4 py-4 font-bold text-text-primary">{formatCurrency(parseFloat(slip.net_pay || '0'))}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                              slip.status === 'paid' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200 dark:border-transparent dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {slip.status === 'paid' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                              {slip.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setSelectedPayslip(slip)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                              >
                                View
                              </button>
                              {slip.status === 'draft' && (
                                <button 
                                  onClick={() => approve(slip.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-700"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {payslips.length > 0 && (
              <div className="mt-md">
                <ModernPagination
                  currentPage={adminPage}
                  totalPages={totalPayslipsPages}
                  onPageChange={setAdminPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
