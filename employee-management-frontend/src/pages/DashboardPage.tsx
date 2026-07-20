import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, Bell, CalendarDays, CheckCircle2, Clock3, Download, DollarSign, Filter, Layers3, Sparkles, Target, Users, BarChart3, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate, getDepartmentColor } from '@/utils/helpers'
import { useEmployees } from '@/hooks/useEmployees'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useTasks } from '@/hooks/useTasks'
import { useHolidays } from '@/hooks/useHolidays'

type RangeKey = '7d' | '30d' | '90d' | 'all'

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

interface EventItem {
  title: string
  when: string
  type: string
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

function getRangeCutoff(range: RangeKey) {
  if (range === 'all') {
    return null
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return cutoff
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
  const total = sum(data.map(item => item.count)) || 1

  return (
    <div className="flex flex-col gap-lg xl:flex-row xl:items-center">
      <div className="relative mx-auto h-44 w-44 shrink-0 sm:h-56 sm:w-56 xl:mx-0">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="28" className="text-slate-200/70 dark:text-slate-800/80" />
          {segments.map((segment, index) => (
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
          ))}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Employees</p>
            <p className="mt-xs text-4xl font-black text-text-primary">{total}</p>
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
            <p className="mt-xs text-lg font-black text-text-primary">{point.value}</p>
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
  const { announcements, loading: announcementsLoading } = useAnnouncements()
  const { tasks, loading: tasksLoading } = useTasks()
  const { holidays, loading: holidaysLoading } = useHolidays()
  
  // ensure we have a fallback for employees to prevent crash before data loads
  const mockEmployees = realEmployees || []
  
  const currentEmployee = useMemo(() => {
    const byEmail = mockEmployees.find(employee => employee.email.toLowerCase() === user?.email?.toLowerCase())
    const byName = mockEmployees.find(employee => `${employee.firstName} ${employee.lastName}`.toLowerCase() === user?.name?.toLowerCase())
    return byEmail ?? byName ?? (mockEmployees.length > 0 ? mockEmployees[0] : { id: 'temp', department: 'Unassigned', firstName: 'Temp', lastName: 'User', startDate: '' })
  }, [user?.email, user?.name, mockEmployees])

  const departments = useMemo(
    () => ['all', ...Array.from(new Set(mockEmployees.map(employee => employee.department)))],
    []
  )

  const effectiveEmployeeFilter = isEmployee ? currentEmployee.id : employeeFilter
  const effectiveDepartmentFilter = isEmployee ? currentEmployee.department : departmentFilter

  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter(employee => {
      const matchesEmployee = effectiveEmployeeFilter === 'all' || employee.id === effectiveEmployeeFilter
      const matchesDepartment = effectiveDepartmentFilter === 'all' || employee.department === effectiveDepartmentFilter
      return matchesEmployee && matchesDepartment
    })
  }, [effectiveDepartmentFilter, effectiveEmployeeFilter])

  const filteredLogs = useMemo(() => {
    const cutoff = getRangeCutoff(rangeFilter)
    return filteredEmployees.flatMap(employee => {
      return (employee.attendanceLog || [])
        .filter(log => {
          if (!cutoff) return true
          return new Date(log.date) >= cutoff
        })
        .map(log => ({
          ...log,
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department,
        }))
    })
  }, [filteredEmployees, rangeFilter])

  const stats = useMemo<DashboardMetric[]>(() => {
    const activeEmployees = filteredEmployees.filter(employee => employee.status === 'active').length
    const onLeaveEmployees = filteredEmployees.filter(employee => employee.status === 'on-leave').length
    const totalAttendance = filteredLogs.length || 1
    const presentCount = filteredLogs.filter(log => log.status === 'present').length
    const payrollTotal = filteredEmployees.reduce((total, employee) => total + (employee.salary || 0), 0)
    const avgPerformance = filteredEmployees.filter(employee => typeof employee.performanceScore === 'number')
      .reduce((total, employee) => total + (employee.performanceScore || 0), 0)

    return [
      {
        label: 'Total Employees',
        value: formatNumber(filteredEmployees.length),
        delta: '+8.4% MoM',
        icon: Users,
        tone: 'from-primary-500 to-indigo-500',
      },
      {
        label: 'Active Workforce',
        value: formatNumber(activeEmployees),
        delta: `${Math.round((activeEmployees / Math.max(filteredEmployees.length, 1)) * 100)}% utilization`,
        icon: CheckCircle2,
        tone: 'from-emerald-500 to-teal-500',
      },
      {
        label: 'Attendance Rate',
        value: `${Math.round((presentCount / totalAttendance) * 100)}%`,
        delta: `${filteredLogs.filter(log => log.status === 'late').length} late check-ins`,
        icon: Clock3,
        tone: 'from-cyan-500 to-sky-500',
      },
      {
        label: 'On Leave',
        value: formatNumber(onLeaveEmployees),
        delta: 'Approved and pending requests',
        icon: CalendarDays,
        tone: 'from-amber-500 to-orange-500',
      },
      {
        label: 'Payroll / Month',
        value: formatCurrency(payrollTotal / 12),
        delta: 'Forecasted recurring cost',
        icon: DollarSign,
        tone: 'from-violet-500 to-fuchsia-500',
      },
      {
        label: 'Avg. Performance',
        value: `${filteredEmployees.length ? Math.round(avgPerformance / filteredEmployees.length) : 0}%`,
        delta: '1:1 review readiness',
        icon: Target,
        tone: 'from-slate-500 to-slate-700',
      },
    ]
  }, [filteredEmployees, filteredLogs])

  const departmentStats = useMemo<DepartmentStat[]>(() => {
    const total = Math.max(filteredEmployees.length, 1)
    const buckets = filteredEmployees.reduce<Record<string, number>>((accumulator, employee) => {
      accumulator[employee.department] = (accumulator[employee.department] || 0) + 1
      return accumulator
    }, {})

    return Object.entries(buckets)
      .map(([department, count]) => ({
        department,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [filteredEmployees])

  const trendData = useMemo<ChartPoint[]>(() => {
    const byDate = filteredLogs.reduce<Record<string, number>>((accumulator, log) => {
      accumulator[log.date] = (accumulator[log.date] || 0) + 1
      return accumulator
    }, {})

    return Object.entries(byDate)
      .map(([label, value]) => ({ label: formatDate(label), value }))
      .slice(-7)
  }, [filteredLogs])

  const recentActivities = useMemo<ActivityItem[]>(() => {
    const latestEmployees = [...filteredEmployees]
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .slice(0, 4)
      .map(employee => ({
        title: `${employee.firstName} ${employee.lastName} joined ${employee.department}`,
        description: `${employee.position} on ${formatDate(employee.startDate)}`,
        time: 'New hire update',
      }))

    const latestAttendance = [...filteredLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map(log => ({
        title: `${log.employeeName} logged ${log.status}`,
        description: `${log.department} • ${log.checkIn || 'No check-in recorded'}`,
        time: formatDate(log.date),
      }))

    return [...latestEmployees, ...latestAttendance].slice(0, 6)
  }, [filteredEmployees, filteredLogs])

  const notifications: ActivityItem[] = announcements.slice(0, 3).map(a => ({
    title: a.title,
    description: a.body,
    time: a.date
  }))

  const upcomingEvents: EventItem[] = tasks.slice(0, 3).map(t => ({
    title: t.title,
    when: t.dueDate ? formatDate(t.dueDate) : 'No due date',
    type: t.projectName || 'Task'
  }))

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
      ]

  const dashboardTitle = isEmployee ? 'My HRMS Dashboard' : 'Enterprise HRMS Dashboard'
  const dashboardDescription = isEmployee
    ? 'Review your attendance, leave, payroll, and company announcements from one personal workspace.'
    : 'Monitor headcount, attendance, payroll, leave, and hiring activity from a single premium control center.'

  const downloadDashboardPdf = () => {
    window.print()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-lg"
    >
      {(employeesLoading || announcementsLoading || tasksLoading || holidaysLoading) && <div className="p-xl text-center text-text-secondary">Loading dashboard data...</div>}
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
          <Button variant="secondary" onClick={downloadDashboardPdf} className="gap-sm no-print">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
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
                  <p className="mt-md text-sm font-semibold text-text-primary">{action.label}</p>
                  <p className="mt-xs text-xs text-text-secondary group-hover:text-primary-600">Open module</p>
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
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="group rounded-3xl border border-border bg-card p-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
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
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-lg">
          {isEmployee ? (
            <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
              <div className="flex items-center justify-between gap-md mb-md">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">My Upcoming Tasks</h3>
                  <p className="text-sm text-text-secondary">Assigned tasks and deadlines.</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-primary-600" />
              </div>
              <div className="space-y-sm">
                {tasks.slice(0, 4).map(task => (
                  <div key={task.id} className="rounded-2xl border border-border bg-background p-md">
                    <p className="font-semibold text-text-primary">{task.title}</p>
                    <p className="text-sm text-text-secondary mt-xs">{task.description}</p>
                    <div className="mt-md flex justify-between items-center text-xs">
                      <span className="font-semibold text-primary-600">{task.projectName || 'General Task'}</span>
                      <span className="text-text-secondary font-medium">{task.status}</span>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-sm text-text-secondary">No tasks assigned to you right now.</p>}
              </div>
            </div>
          ) : (
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
            <div className="flex items-center justify-between gap-md">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Notifications</h3>
                <p className="text-sm text-text-secondary">Real-world admin reminders and approvals.</p>
              </div>
              <Bell className="h-5 w-5 text-primary-600" />
            </div>
            <div className="mt-md space-y-sm">
              {notifications.map(notification => (
                <div key={notification.title} className="rounded-2xl border border-border bg-background p-md">
                  <p className="font-semibold text-text-primary">{notification.title}</p>
                  <p className="mt-xs text-sm text-text-secondary">{notification.description}</p>
                  <p className="mt-xs text-xs font-semibold text-text-secondary">{notification.time}</p>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-sm text-text-secondary">No recent announcements.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
            <div className="flex items-center justify-between gap-md">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Upcoming Events</h3>
                <p className="text-sm text-text-secondary">Meetings, approvals, and onboarding milestones.</p>
              </div>
              <CalendarDays className="h-5 w-5 text-primary-600" />
            </div>
            <div className="mt-md space-y-sm">
              {upcomingEvents.map(event => (
                <div key={event.title} className="rounded-2xl border border-border bg-background p-md">
                  <p className="font-semibold text-text-primary">{event.title}</p>
                  <p className="mt-xs text-sm text-text-secondary">{event.when}</p>
                  <p className="mt-xs text-xs font-semibold text-primary-600">{event.type}</p>
                </div>
              ))}
              {upcomingEvents.length === 0 && <p className="text-sm text-text-secondary">No upcoming tasks or events.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-lg shadow-sm">
            <div className="flex items-center justify-between gap-md">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Indian Holidays</h3>
                <p className="text-sm text-text-secondary">Upcoming national and regional holidays.</p>
              </div>
              <CalendarDays className="h-5 w-5 text-primary-600" />
            </div>
            <div className="mt-md space-y-sm">
              {holidays.map(holiday => (
                <div key={`${holiday.date}-${holiday.name}`} className="rounded-2xl border border-border bg-background p-md">
                  <p className="font-semibold text-text-primary">{holiday.name}</p>
                  <p className="mt-xs text-sm text-text-secondary">{formatDate(holiday.date)}</p>
                  <p className="mt-xs text-xs font-semibold text-primary-600">{holiday.type}</p>
                </div>
              ))}
              {holidays.length === 0 && <p className="text-sm text-text-secondary">No upcoming holidays.</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
