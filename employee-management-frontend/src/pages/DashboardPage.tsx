import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, Bell, CalendarDays, CheckCircle2, Clock3, DollarSign, Filter, Layers3, Sparkles, Target, Users, BarChart3, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate, getDepartmentColor } from '@/utils/helpers'
import { useEmployees } from '@/hooks/useEmployees'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useTasks } from '@/hooks/useTasks'
import { useHolidays } from '@/hooks/useHolidays'
import { useDepartments } from '@/hooks/useDepartments'
import { UnifiedLoader } from '@/components/common/UnifiedLoader'
import { useDashboard } from '@/hooks/useDashboard'


type RangeKey = '7d' | '30d' | '90d' | 'all'

const HolidaysCalendar: React.FC<{ holidays: Array<{ date: string; name: string; type: string }> }> = ({ holidays }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedHoliday, setSelectedHoliday] = useState<{ date: string; name: string; type: string } | null>(null)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    setSelectedHoliday(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    setSelectedHoliday(null)
  }

  const days = []
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentYear, currentMonth, i))
  }

  const getHolidayForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return holidays.find(h => h.date === dateString)
  }

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-text-primary text-sm">{monthNames[currentMonth]} {currentYear}</h4>
        <div className="flex gap-xs">
          <button onClick={prevMonth} className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-text-secondary text-xs font-semibold">Prev</button>
          <button onClick={nextMonth} className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-text-secondary text-xs font-semibold">Next</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-xs text-center text-xs font-bold text-text-secondary border-b border-border pb-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-xs text-center text-sm">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const holiday = getHolidayForDate(day)
          const isToday = new Date().toDateString() === day.toDateString()
          return (
            <button
              key={day.toISOString()}
              disabled={!holiday}
              onClick={() => setSelectedHoliday(holiday || null)}
              className={`p-1.5 rounded-xl font-semibold transition-all ${
                holiday
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400 font-bold hover:scale-105'
                  : 'text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800'
              } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>

      {selectedHoliday && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-md rounded-2xl border border-rose-100 bg-rose-50/50 dark:border-rose-950/40 dark:bg-rose-950/10 text-xs">
          <p className="font-bold text-rose-700 dark:text-rose-400">{selectedHoliday.name}</p>
          <p className="text-text-secondary mt-1">{selectedHoliday.type}</p>
          <p className="text-text-secondary mt-0.5">{formatDate(selectedHoliday.date)}</p>
        </motion.div>
      )}
    </div>
  )
}

interface DashboardMetric {
  label: string
  value: string
  delta: string
  icon: React.ComponentType<{ className?: string }>
  tone: string
}

interface DepartmentStat {
  department: string
  count: number
  percentage: number
}

interface ActivityItem {
  title: string
  description: string
  time: string
}



interface ChartPoint {
  label: string
  value: number
}

const statColors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444']

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function donutSegments(data: DepartmentStat[]) {
  const total = sum(data.map(item => item.count)) || 1
  let offset = 0

  return data.map((item, index) => {
    const value = item.count / total
    const segment = {
      color: statColors[index % statColors.length],
      dashArray: `${value * 314} 314`,
      dashOffset: -offset,
      percentage: Math.round(value * 100),
    }
    offset += value * 314
    return segment
  })
}

function MiniDonutChart({ data }: { data: DepartmentStat[] }) {
  const segments = donutSegments(data)
  const displayTotal = sum(data.map(item => item.count))

  return (
    <div className="flex flex-col gap-lg xl:flex-row xl:items-center">
      <div className="relative mx-auto h-44 w-44 shrink-0 sm:h-56 sm:w-56 xl:mx-0">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="28" className="text-slate-200/70 dark:text-slate-800/80" />
          {displayTotal > 0 && segments.map((segment, index) => {
            const item = data[index]
            if (!item || item.count === 0) return null
            return (
              <circle
                key={index}
                cx="100"
                cy="100"
                r="50"
                fill="none"
                stroke={segment.color}
                strokeWidth="28"
                strokeLinecap="round"
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                className="transition-all duration-300"
              />
            )
          })}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Employees</p>
            <p className="mt-xs text-4xl font-black text-text-primary">{displayTotal}</p>
            <p className="text-xs font-semibold text-primary-600">Filtered view</p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 flex-1 gap-sm sm:grid-cols-2">
        {data.map((item, index) => (
          <div key={item.department} className="min-w-0 rounded-xl border border-border bg-background/70 p-md">
            <div className="flex items-center justify-between gap-md">
              <span className={`inline-flex items-center gap-xs rounded-full px-sm py-xs text-xs font-semibold ${getDepartmentColor(item.department)}`}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statColors[index % statColors.length] }} />
                <span className="truncate">{item.department}</span>
              </span>
              <span className="text-sm font-bold text-text-primary">{item.count}</span>
            </div>
            <div className="mt-md h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-400"
              />
            </div>
            <p className="mt-sm text-xs font-medium text-text-secondary">{item.percentage}% of the current workforce</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrendChart({ data }: { data: ChartPoint[] }) {
  const maxValue = Math.max(...data.map(item => item.value), 1)
  const width = 640
  const height = 280
  const padding = 28
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2
  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * plotWidth
    const y = padding + plotHeight - (item.value / maxValue) * plotHeight
    return `${x},${y}`
  })

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between gap-md">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Attendance Trend</h3>
          <p className="text-sm text-text-secondary">Presence, lateness, and leave activity across the selected range.</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(index => (
          <line
            key={index}
            x1={padding}
            x2={width - padding}
            y1={padding + (plotHeight / 3) * index}
            y2={padding + (plotHeight / 3) * index}
            stroke="currentColor"
            strokeWidth="1"
            className="text-border/60"
          />
        ))}
        <polyline
          fill="none"
          stroke="#4F46E5"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(' ')}
        />
        <polygon
          fill="url(#trendFill)"
          points={`${padding},${height - padding} ${points.join(' ')} ${width - padding},${height - padding}`}
        />
        {data.map((item, index) => {
          const x = padding + (index / Math.max(data.length - 1, 1)) * plotWidth
          const y = padding + plotHeight - (item.value / maxValue) * plotHeight
          return <circle key={item.label} cx={x} cy={y} r="5" fill="#4F46E5" />
        })}
      </svg>

      <div className="grid grid-cols-2 gap-sm sm:grid-cols-4">
        {data.map(point => (
          <div key={point.label} className="rounded-xl border border-border bg-background px-md py-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{point.label}</p>
            <p className="mt-xs text-lg font-black text-text-primary">
              {Number.isInteger(point.value) ? point.value : point.value.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PayrollBarChart({ data }: { data: DepartmentStat[] }) {
  const maxValue = Math.max(...data.map(item => item.count), 1)

  return (
    <div className="space-y-md">
      <div>
        <h3 className="text-lg font-bold text-text-primary">Department Payroll Mix</h3>
        <p className="text-sm text-text-secondary">Relative payroll weight by department, derived from the current workforce snapshot.</p>
      </div>
      <div className="space-y-sm">
        {data.map((item, index) => (
          <div key={item.department} className="grid grid-cols-[120px_1fr_80px] items-center gap-md">
            <div className="text-sm font-semibold text-text-primary">{item.department}</div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / maxValue) * 100}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-primary-500 to-indigo-500"
              />
            </div>
            <div className="text-right text-sm font-bold text-text-primary">{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const role = user?.role ?? 'employee'
  const isEmployee = role === 'employee'
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [rangeFilter, setRangeFilter] = useState<RangeKey>('30d')

  const { employees: realEmployees, loading: employeesLoading } = useEmployees()
  const { loading: announcementsLoading } = useAnnouncements()
  const { loading: tasksLoading } = useTasks()
  const { holidays, loading: holidaysLoading } = useHolidays()
  const { departments: dbDepartments } = useDepartments()

  const { metrics, loading: dashboardLoading } = useDashboard(
    isEmployee ? 'all' : employeeFilter,
    isEmployee ? 'all' : departmentFilter,
    rangeFilter
  )
  
  // ensure we have a fallback for employees to prevent crash before data loads
  const mockEmployees = realEmployees || []
  
  const currentEmployee = useMemo(() => {
    const byEmail = mockEmployees.find(employee => employee.email.toLowerCase() === user?.email?.toLowerCase())
    const byName = mockEmployees.find(employee => `${employee.firstName} ${employee.lastName}`.toLowerCase() === user?.name?.toLowerCase())
    return byEmail ?? byName ?? (mockEmployees.length > 0 ? mockEmployees[0] : { id: 'temp', department: 'Unassigned', firstName: 'Temp', lastName: 'User', startDate: '', performanceScore: 100, salary: 0 })
  }, [user?.email, user?.name, mockEmployees])

  const departments = useMemo(
    () => ['all', ...Array.from(new Set(dbDepartments.map(dept => dept.name)))],
    [dbDepartments]
  )

  const stats = useMemo<Array<DashboardMetric & { href?: string }>>(() => {
    if (isEmployee) {
      return [
        {
          label: 'My Attendance Rate',
          value: metrics?.my_attendance_rate !== undefined ? `${metrics.my_attendance_rate}%` : '0%',
          delta: 'Check-ins evaluation',
          icon: Clock3,
          tone: 'from-cyan-500 to-sky-500',
          href: '/attendance',
        },
        {
          label: 'Hours Logged',
          value: metrics?.hours_logged !== undefined ? `${metrics.hours_logged} hrs` : '0 hrs',
          delta: 'Total hours worked in range',
          icon: Activity,
          tone: 'from-primary-500 to-indigo-500',
          href: '/attendance',
        },
        {
          label: 'Available Leave Balance',
          value: metrics?.available_leave_balance !== undefined ? `${metrics.available_leave_balance} days` : '20 days',
          delta: 'Deducted from approved leaves',
          icon: CalendarDays,
          tone: 'from-amber-500 to-orange-500',
          href: '/leave',
        },
        {
          label: 'My Performance Score',
          value: metrics?.my_performance_score !== undefined ? `${metrics.my_performance_score}%` : '100%',
          delta: 'Current scorecard evaluation',
          icon: Target,
          tone: 'from-emerald-500 to-teal-500',
          href: '/profile',
        },
        {
          label: 'My Monthly Salary',
          value: metrics?.my_monthly_salary !== undefined ? formatCurrency(metrics.my_monthly_salary) : 'N/A',
          delta: 'Base monthly pay',
          icon: DollarSign,
          tone: 'from-violet-500 to-fuchsia-500',
          href: '/payroll',
        }
      ]
    }

    return [
      {
        label: 'Total Employees',
        value: metrics?.total_employees !== undefined ? formatNumber(metrics.total_employees) : '0',
        delta: 'Total headcount registered',
        icon: Users,
        tone: 'from-primary-500 to-indigo-500',
        href: '/employees',
      },
      {
        label: 'Active Workforce',
        value: metrics?.active_workforce !== undefined ? formatNumber(metrics.active_workforce) : '0',
        delta: 'Currently active contracts',
        icon: CheckCircle2,
        tone: 'from-emerald-500 to-teal-500',
        href: '/employees',
      },
      {
        label: 'Attendance Rate',
        value: metrics?.attendance_rate !== undefined ? `${metrics.attendance_rate}%` : '0%',
        delta: 'Overall presence in range',
        icon: Clock3,
        tone: 'from-cyan-500 to-sky-500',
        href: '/attendance',
      },
      {
        label: 'On Leave',
        value: metrics?.on_leave !== undefined ? formatNumber(metrics.on_leave) : '0',
        delta: 'Approved and active today',
        icon: CalendarDays,
        tone: 'from-amber-500 to-orange-500',
        href: '/leave',
      },
      {
        label: 'Payroll / Month',
        value: metrics?.payroll_total !== undefined ? formatCurrency(metrics.payroll_total / 12) : '$0.00',
        delta: 'Forecasted monthly recurring cost',
        icon: DollarSign,
        tone: 'from-violet-500 to-fuchsia-500',
        href: '/payroll',
      },
      {
        label: 'Avg. Performance',
        value: metrics?.avg_performance !== undefined && metrics.avg_performance !== null ? `${metrics.avg_performance}%` : 'Awaiting Review',
        delta: metrics?.avg_performance !== undefined && metrics.avg_performance !== null ? 'Evaluation standard' : 'No performance logs',
        icon: Target,
        tone: 'from-slate-500 to-slate-700',
        href: '/analytics',
      },
    ]
  }, [metrics, isEmployee, currentEmployee])

  const departmentStats = useMemo<DepartmentStat[]>(() => {
    return metrics?.department_stats || []
  }, [metrics])

  const trendData = useMemo<ChartPoint[]>(() => {
    if (metrics?.trend_data && metrics.trend_data.length > 0) {
      return metrics.trend_data.map(item => ({
        label: formatDate(item.label),
        value: item.value
      }))
    }
    const points = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      points.push({
        label: formatDate(d.toISOString().split('T')[0]),
        value: 0
      })
    }
    return points
  }, [metrics])

  const recentActivities = useMemo<ActivityItem[]>(() => {
    return metrics?.recent_activities || []
  }, [metrics])



  const quickActions = isEmployee
    ? [
        { label: 'My Profile', href: '/profile', icon: Users },
        { label: 'Mark Attendance', href: '/attendance', icon: CalendarDays },
        { label: 'My Leave', href: '/leave', icon: DollarSign },
        { label: 'My Payslips', href: '/payroll', icon: Layers3 },
        { label: 'Announcements', href: '/announcements', icon: Bell },
        { label: 'Settings', href: '/settings', icon: ShieldCheck },
      ]
    : [
        { label: 'Add Employee', href: '/employees', icon: Users },
        { label: 'Review Leave', href: '/leave', icon: CalendarDays },
        { label: 'Run Payroll', href: '/payroll', icon: DollarSign },
        { label: 'Analytics View', href: '/analytics', icon: BarChart3 },
        { label: 'Create Report', href: '/reports', icon: Layers3 },
        { label: 'User Approvals', href: '/approvals', icon: ShieldCheck },
      ]

  const dashboardTitle = isEmployee ? 'My HRMS Dashboard' : 'Enterprise HRMS Dashboard'
  const dashboardDescription = isEmployee
    ? 'Review your attendance, leave, payroll, and company announcements from one personal workspace.'
    : 'Monitor headcount, attendance, payroll, leave, and hiring activity from a single premium control center.'

  if (employeesLoading || announcementsLoading || tasksLoading || holidaysLoading || dashboardLoading) {
    if (isEmployee) {
      return <UnifiedLoader message="Loading your HRMS dashboard..." />
    }
    return (
      <div className="space-y-lg animate-pulse p-lg">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl mb-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-lg"
    >
      <div className="flex flex-col gap-md rounded-3xl border border-border bg-card p-lg shadow-lg shadow-slate-900/5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-md">
          <div className="inline-flex items-center gap-sm rounded-full border border-white/10 bg-slate-950 px-md py-xs text-xs font-semibold text-cyan-300 shadow-sm dark:border-white/10 dark:bg-slate-950">
            <Sparkles className="h-4 w-4" />
            Executive overview
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">{dashboardTitle}</h1>
            <p className="mt-sm max-w-2xl text-sm text-text-secondary sm:text-base">
              {dashboardDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-sm text-xs font-semibold text-text-secondary">
            <span className="inline-flex items-center gap-xs rounded-full border border-border bg-background px-sm py-xs text-text-primary">
              <Activity className="h-4 w-4 text-cyan-500" />
              Live workforce signals
            </span>
            <span className="inline-flex items-center gap-xs rounded-full border border-border bg-background px-sm py-xs text-text-primary">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Compliance-ready modules
            </span>
            <span className="inline-flex items-center gap-xs rounded-full border border-border bg-background px-sm py-xs text-text-primary">
              <CalendarDays className="h-4 w-4 text-primary-500" />
              Responsive across all screens
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-sm">
          <Link
            to="/reports"
            className="button-primary inline-flex items-center gap-sm"
          >
            Open reports
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className={isEmployee ? 'grid grid-cols-1 gap-sm' : 'grid grid-cols-1 gap-sm sm:grid-cols-2 xl:grid-cols-3'}>
        {!isEmployee ? (
          <div className="rounded-2xl border border-border bg-card p-md shadow-sm">
            <div className="flex items-center gap-sm text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="mt-md grid gap-sm sm:grid-cols-3">
              <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} className="theme-select w-full rounded-xl border border-border bg-background px-md py-sm text-sm text-text-primary">
                <option value="all">All employees</option>
                {mockEmployees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
              <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="theme-select w-full rounded-xl border border-border bg-background px-md py-sm text-sm text-text-primary">
                {departments.map(department => (
                  <option key={department} value={department}>
                    {department === 'all' ? 'All departments' : department}
                  </option>
                ))}
              </select>
              <select value={rangeFilter} onChange={e => setRangeFilter(e.target.value as RangeKey)} className="theme-select w-full rounded-xl border border-border bg-background px-md py-sm text-sm text-text-primary">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-md shadow-sm">
            <div className="flex items-center justify-between gap-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Personal snapshot</p>
                <p className="mt-xs text-sm text-text-secondary">Your dashboard is locked to your own profile and activity.</p>
              </div>
              <Link to="/profile" className="button-secondary inline-flex items-center gap-sm">
                Open profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        <div className={isEmployee ? 'rounded-2xl border border-border bg-card p-md shadow-sm' : 'rounded-2xl border border-border bg-card p-md shadow-sm sm:col-span-2'}>
          <div className="flex items-center justify-between gap-md">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-text-secondary">Quick access</h3>
              <p className="mt-xs text-sm text-text-secondary">{isEmployee ? 'Self-service actions for your account.' : 'Common HR actions for day-to-day operations.'}</p>
            </div>
            <Bell className="h-5 w-5 text-primary-600" />
          </div>
          <div className={isEmployee ? 'mt-md grid grid-cols-2 gap-sm sm:grid-cols-3' : 'mt-md grid grid-cols-2 gap-sm sm:grid-cols-3 xl:grid-cols-6'}>
            {quickActions.map(action => {
              const Icon = action.icon
              return (
                <Link
                  key={action.label}
                  to={action.href}
                  className="group rounded-2xl border border-border bg-background p-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-100 hover:shadow-lg"
                >
                  <Icon className="h-5 w-5 text-primary-600" />
                  <p className="mt-md text-xs sm:text-sm font-semibold text-text-primary truncate" title={action.label}>{action.label}</p>
                  <p className="mt-xs text-[10px] sm:text-xs text-text-secondary group-hover:text-primary-600">Open module</p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} to={stat.href || '#'}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="group rounded-3xl border border-border bg-card p-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full block cursor-pointer"
              >
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">{stat.label}</p>
                    <p className="mt-sm text-3xl font-black tracking-tight text-text-primary">{stat.value}</p>
                    <p className="mt-xs text-sm font-medium text-text-secondary">{stat.delta}</p>
                  </div>
                  <div className={`rounded-2xl bg-gradient-to-br ${stat.tone} p-3 text-white shadow-lg shadow-slate-900/10`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </motion.div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-lg">
          {!isEmployee && (
            <div className="rounded-3xl border border-border bg-card p-lg shadow-sm overflow-hidden">
              <MiniDonutChart data={departmentStats} />
            </div>
          )}

          <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
            <TrendChart data={trendData.length ? trendData : [{ label: 'No data', value: 0 }]} />
          </div>

          {!isEmployee && (
            <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
              <PayrollBarChart data={departmentStats.length ? departmentStats : [{ department: 'None', count: 0, percentage: 0 }]} />
            </div>
          )}
        </div>

        <div className="space-y-lg">
          <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
            <div className="flex items-center justify-between gap-md">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Recent Activity</h3>
                <p className="text-sm text-text-secondary">New hires, attendance events, and operational signals.</p>
              </div>
              <Activity className="h-5 w-5 text-primary-600" />
            </div>
            <div className="mt-md space-y-sm">
              {recentActivities.map(item => (
                <div key={`${item.title}-${item.time}`} className="rounded-2xl border border-border bg-background p-md">
                  <p className="font-semibold text-text-primary">{item.title}</p>
                  <p className="mt-xs text-sm text-text-secondary">{item.description}</p>
                  <p className="mt-xs text-xs font-semibold text-primary-600">{item.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
            <div className="flex items-center justify-between gap-md mb-md">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Indian Holidays</h3>
                <p className="text-sm text-text-secondary">Interactive holiday schedule and details.</p>
              </div>
              <CalendarDays className="h-5 w-5 text-primary-600" />
            </div>
            <HolidaysCalendar holidays={holidays} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
