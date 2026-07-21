import React, { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, CalendarX2, Clock3, Filter, Search, TrendingUp, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAttendance } from '@/hooks/useAttendance'
import { useAuth } from '@/contexts/AuthContext'

type AttendanceStatus = 'present' | 'late' | 'leave'

const statusStyles: Record<AttendanceStatus, string> = {
  present: 'bg-green-50 text-green-700 border-green-200',
  late: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  leave: 'bg-red-50 text-red-700 border-red-200',
}

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-center space-y-xs">
      <div className="text-4xl sm:text-6xl font-black tracking-tight text-text-primary font-mono">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
        {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
    </div>
  )
}

export const AttendancePage: React.FC = () => {
  const { user } = useAuth()
  const { records, checkIn, checkOut } = useAttendance()
  const isEmployee = (user?.role ?? 'employee') === 'employee'
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)
  const [actionError, setActionError] = useState<string | null>(null)
  
  const handleCheckIn = async () => {
    try {
      setActionError(null)
      await checkIn()
    } catch (e: any) {
      setActionError(e.message)
    }
  }

  const handleCheckOut = async () => {
    try {
      setActionError(null)
      await checkOut()
    } catch (e: any) {
      setActionError(e.message)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  // Find if there is a currently active check-in (no check out yet)
  const activeRecord = records.find(r => r.date === today && (isEmployee ? r.employeeId === user?.id : true) && !r.checkOut)
  const todaysRecords = records.filter(r => r.date === today && (isEmployee ? r.employeeId === user?.id : true))
  
  const hasCheckedIn = !!activeRecord // True if currently in a session
  const hasCompletedSession = todaysRecords.some(r => r.checkIn && r.checkOut)
  const isShiftComplete = !hasCheckedIn && hasCompletedSession

  const departments = useMemo(() => ['all', ...new Set(records.map(record => record.department))], [records])

  const filteredRecords = useMemo(() => {
    let baseRecords = records;
    if (isEmployee && user?.name) {
      baseRecords = records.filter(r => r.employeeName.toLowerCase() === user.name.toLowerCase());
    }

    return baseRecords
      .filter(record => departmentFilter === 'all' || record.department === departmentFilter)
      .filter(record => statusFilter === 'all' || record.status === statusFilter)
      .filter(record => {
        if (!search.trim()) return true
        const query = search.toLowerCase()
        return record.employeeName.toLowerCase().includes(query) || record.department.toLowerCase().includes(query)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [departmentFilter, records, search, statusFilter, isEmployee, user?.name])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage)), [filteredRecords.length, itemsPerPage])

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRecords.slice(start, start + itemsPerPage)
  }, [currentPage, filteredRecords, itemsPerPage])

  useEffect(() => {
    setCurrentPage(prev => Math.min(prev, totalPages))
  }, [totalPages])

  const stats = useMemo(() => {
    const total = filteredRecords.length
    const present = filteredRecords.filter(record => record.status === 'present').length
    const late = filteredRecords.filter(record => record.status === 'late').length
    const leave = filteredRecords.filter(record => record.status === 'leave').length
    const averageHours = total > 0 ? filteredRecords.reduce((sum, record) => sum + record.hoursWorked, 0) / total : 0

    return [
      { label: 'Attendance Rate', value: total > 0 ? `${Math.round((present / total) * 100)}%` : '0%', icon: CalendarCheck2, tone: 'text-green-600' },
      { label: 'Late Check-ins', value: late, icon: Clock3, tone: 'text-yellow-600' },
      { label: 'Approved Leave', value: leave, icon: CalendarX2, tone: 'text-red-600' },
      { label: 'Avg. Hours', value: averageHours.toFixed(1), icon: TrendingUp, tone: 'text-primary' },
    ]
  }, [filteredRecords])

  const dailySummary = useMemo(() => {
    const byDate = filteredRecords.reduce<Record<string, { present: number; late: number; leave: number }>>((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = { present: 0, late: 0, leave: 0 }
      }

      acc[record.date][record.status] += 1
      return acc
    }, {})

    // Ensure today's date always exists in the summary
    const today = new Date().toISOString().split('T')[0]
    if (!byDate[today]) {
      byDate[today] = { present: 0, late: 0, leave: 0 }
    }

    return Object.entries(byDate)
      .map(([date, counts]) => ({ date, total: counts.present + counts.late + counts.leave, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredRecords])

  return (
    <motion.div className="space-y-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-md">
        <div>
          <h1 className="section-title">Attendance Center</h1>
          <p className="section-subtitle mt-xs">Track presence, late arrivals, and leave patterns across the team.</p>
        </div>

        <div className="flex flex-wrap gap-sm">
          <div className="flex items-center gap-sm px-md py-sm rounded-lg border border-border bg-card shadow-sm">
            <Search className="h-4 w-4 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or department"
              className="bg-transparent border-0 outline-none text-sm text-text-primary placeholder:text-text-secondary w-56 max-w-full"
            />
          </div>

          {!isEmployee && (
            <div className="relative min-w-[180px] flex items-center gap-sm px-md py-sm rounded-lg border border-border bg-card shadow-sm">
              <Filter className="h-4 w-4 text-text-secondary flex-shrink-0" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="theme-select bg-transparent border-0 outline-none text-sm text-text-primary w-full"
              >
                {departments.map(department => (
                  <option key={department} value={department}>
                    {department === 'all' ? 'All Departments' : department}
                  </option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-md h-4 w-4 -rotate-90 text-text-secondary" />
            </div>
          )}

          <div className="relative min-w-[160px] flex items-center gap-sm px-md py-sm rounded-lg border border-border bg-card shadow-sm">
            <Users className="h-4 w-4 text-text-secondary flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AttendanceStatus)}
              className="theme-select bg-transparent border-0 outline-none text-sm text-text-primary w-full"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="leave">Leave</option>
            </select>
            <ChevronRight className="pointer-events-none absolute right-md h-4 w-4 -rotate-90 text-text-secondary" />
          </div>
        </div>
      </div>

      {isEmployee && (
        <div className="rounded-3xl border border-border bg-card p-xl shadow-sm relative overflow-hidden">
          {actionError && (
            <div className="absolute top-md left-md right-md z-50">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-md text-sm text-rose-800 shadow-lg dark:border-rose-900/40 dark:bg-rose-950/90 dark:text-rose-200 flex justify-between items-center backdrop-blur-sm">
                <span>{actionError}</span>
                <button onClick={() => setActionError(null)} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>
          )}
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary-500/5 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-xl relative z-10">
            <div className="flex-1 space-y-md text-center lg:text-left">
              <h2 className="text-xl font-bold text-text-primary">Your Time Clock</h2>
              <p className="text-sm text-text-secondary max-w-md mx-auto lg:mx-0">
                Ensure you check in when you arrive and check out before leaving. Time entries are logged automatically with your profile timestamp.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-md pt-sm">
                {!hasCheckedIn && !isShiftComplete && (
                  <button 
                    onClick={handleCheckIn} 
                    className="w-full sm:w-auto min-w-[140px] px-xl py-lg rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    Check In
                  </button>
                )}
                {hasCheckedIn && (
                  <button 
                    onClick={handleCheckOut} 
                    className="w-full sm:w-auto min-w-[140px] px-xl py-lg rounded-2xl font-bold tracking-wide shadow-sm transition-all active:scale-95 bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    Check Out
                  </button>
                )}
              </div>

              {isShiftComplete && (
                <div className="inline-flex items-center gap-xs px-md py-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400">
                  <CalendarCheck2 className="h-4 w-4" />
                  Your shift is complete for today. Great work!
                </div>
              )}
            </div>

            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="p-xl rounded-[2.5rem] bg-background border border-border shadow-inner">
                <LiveClock />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-lg flex items-start justify-between gap-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{stat.label}</p>
                <p className="mt-sm text-3xl font-extrabold text-text-primary">{stat.value}</p>
              </div>
              <div className={`p-md rounded-lg bg-background ${stat.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="card p-lg lg:col-span-2 space-y-lg">
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="section-title text-base sm:text-lg">Daily Summary</h2>
              <p className="text-xs text-text-secondary mt-xs">A quick overview of attendance balance by day.</p>
            </div>
            <span className="text-xs font-semibold text-text-secondary">{records.length} total log entries</span>
          </div>

          <div className="space-y-sm">
            {dailySummary.map(day => {
              const max = Math.max(...dailySummary.map(item => item.total), 1)
              return (
                <div key={day.date} className="grid grid-cols-[96px_1fr_64px] gap-md items-center">
                  <div className="text-xs font-semibold text-text-secondary">{day.date}</div>
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                    <div className="bg-green-500" style={{ width: `${(day.present / max) * 100}%` }} />
                    <div className="bg-yellow-500" style={{ width: `${(day.late / max) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(day.leave / max) * 100}%` }} />
                  </div>
                  <div className="text-right text-xs font-bold text-text-primary">{day.total}</div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-md text-xs text-text-secondary">
            <span className="inline-flex items-center gap-xs"><span className="h-2 w-2 rounded-full bg-green-500" />Present</span>
            <span className="inline-flex items-center gap-xs"><span className="h-2 w-2 rounded-full bg-yellow-500" />Late</span>
            <span className="inline-flex items-center gap-xs"><span className="h-2 w-2 rounded-full bg-red-500" />Leave</span>
          </div>
        </div>

        <div className="card p-lg space-y-md">
          <div>
            <h2 className="section-title text-base sm:text-lg">Operational Notes</h2>
            <p className="text-xs text-text-secondary mt-xs">Useful context for reviewing the current attendance snapshot.</p>
          </div>

          <div className="space-y-sm text-sm">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-md shadow-sm">
              <p className="font-semibold text-cyan-300">What stands out</p>
              <p className="mt-xs text-slate-200">Late arrivals are concentrated in engineering and are easy to isolate by department.</p>
            </div>

            <div className="p-md rounded-2xl bg-background border border-border">
              <p className="font-semibold text-text-primary">Recommended follow-up</p>
              <p className="text-text-secondary mt-xs">Use the filters before approvals or check-ins to review attendance trends in context.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-lg space-y-lg">
        <div>
          <h2 className="section-title text-base sm:text-lg">Recent Attendance Records</h2>
          <p className="text-xs text-text-secondary mt-xs">Showing {paginatedRecords.length} of {filteredRecords.length} matching records.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Department</th>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Date</th>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Check In</th>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Check Out</th>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Hours</th>
                <th className="text-right py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map(record => (
                <tr key={`${record.employeeId}-${record.date}`} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-md px-md font-semibold text-text-primary">{record.employeeName}</td>
                  <td className="py-md px-md text-text-secondary">{record.department}</td>
                  <td className="py-md px-md text-text-secondary">{record.date}</td>
                  <td className="py-md px-md text-text-secondary">{record.checkIn || '—'}</td>
                  <td className="py-md px-md text-text-secondary">{record.checkOut || '—'}</td>
                  <td className="py-md px-md text-text-secondary">{record.hoursWorked.toFixed(1)}</td>
                  <td className="py-md px-md text-right">
                    <span className={`inline-flex items-center px-sm py-xs rounded-full border text-xs font-bold ${statusStyles[record.status]}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-xl text-center text-text-secondary">No attendance records match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredRecords.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md pt-md border-t border-border">
            <div className="flex items-center gap-sm text-sm text-text-secondary">
              <span>Rows per page</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="theme-select text-sm"
              >
                {[6, 8, 12, 16].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-sm">
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-xs px-md py-sm rounded-lg border border-border bg-background text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm font-semibold text-text-secondary">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-xs px-md py-sm rounded-lg border border-border bg-background text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}