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
import apiClient from '@/utils/apiClient'

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
  const [onLeaveCount, setOnLeaveCount] = useState(0)

  React.useEffect(() => {
    if (!isEmployee) {
      apiClient.get('/api/v1/leave/?status=approved&page_size=100')
        .then(res => {
          const results = res.data.results || res.data
          const todayStr = new Date().toISOString().slice(0, 10)
          const activeLeaves = results.filter((leave: any) => {
            return leave.start_date <= todayStr && leave.end_date >= todayStr
          })
          setOnLeaveCount(activeLeaves.length)
        })
        .catch(err => console.error('Failed to fetch active leaves for dashboard', err))
    }
  }, [isEmployee])

  const { employees: realEmployees, loading: employeesLoading } = useEmployees()
  const { loading: announcementsLoading } = useAnnouncements()
  const { loading: tasksLoading } = useTasks()
  const { holidays, loading: holidaysLoading } = useHolidays()
  const { departments: dbDepartments } = useDepartments()
  
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
    if (isEmployee) {
      const myLogs = filteredLogs.filter(log => log.employeeId === currentEmployee.id)
      const myTotalAttendance = myLogs.length || 1
      const myPresentCount = myLogs.filter(log => log.status === 'present').length
      const myAttendanceRate = Math.round((myPresentCount / myTotalAttendance) * 100)
      const myTotalHours = myLogs.reduce((total, log) => total + (log.hoursWorked || 0), 0)
      
      return [
        {
          label: 'My Attendance Rate',
          value: `${myAttendanceRate}%`,
          delta: `${myLogs.filter(log => log.status === 'late').length} late check-ins`,
          icon: Clock3,
          tone: 'from-cyan-500 to-sky-500',
        },
        {
          label: 'Hours Logged',
          value: `${Math.round(myTotalHours * 10) / 10} hrs`,
          delta: 'Total hours worked in range',
          icon: Activity,
          tone: 'from-primary-500 to-indigo-500',
        },
        {
          label: 'Available Leave Balance',
          value: '20 days',
          delta: 'Deducted from approved leaves',
          icon: CalendarDays,
          tone: 'from-amber-500 to-orange-500',
        },
        {
          label: 'My Performance Score',
          value: `${currentEmployee.performanceScore || (currentEmployee as any).performance_score || 100}%`,
          delta: 'Current scorecard evaluation',
          icon: Target,
          tone: 'from-emerald-500 to-teal-500',
        },
        {
          label: 'My Monthly Salary',
          value: currentEmployee.salary ? formatCurrency(currentEmployee.salary) : 'N/A',
          delta: 'Base monthly pay',
          icon: DollarSign,
          tone: 'from-violet-500 to-fuchsia-500',
        }
      ]
    }

    const activeEmployees = filteredEmployees.filter(employee => employee.status === 'active').length
    const totalAttendance = filteredLogs.length || 1
    const presentCount = filteredLogs.filter(log => log.status === 'present' || log.status === 'late').length
    const payrollTotal = filteredEmployees.reduce((total, employee) => total + (employee.salary || 0), 0)

    const performanceEmployees = filteredEmployees.filter(employee => {
      const score = employee.performanceScore ?? (employee as any).performance_score
      return typeof score === 'number' && score > 0
    })
    const totalPerformanceScore = performanceEmployees.reduce((total, employee) => {
      const score = employee.performanceScore ?? (employee as any).performance_score
      return total + (score || 0)
    }, 0)
    const avgPerfValue = performanceEmployees.length ? Math.round(totalPerformanceScore / performanceEmployees.length) : null

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
        value: formatNumber(onLeaveCount),
        delta: 'Approved and active today',
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
        value: avgPerfValue !== null ? `${avgPerfValue}%` : 'Awaiting Review',
        delta: avgPerfValue !== null ? '1:1 review readiness' : 'No performance logs',
        icon: Target,
        tone: 'from-slate-500 to-slate-700',
      },
    ]
  }, [filteredEmployees, filteredLogs, isEmployee, currentEmployee, onLeaveCount])

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
      const val = isEmployee ? (log.hoursWorked || 0) : 1
      accumulator[log.date] = (accumulator[log.date] || 0) + val
      return accumulator
    }, {})

    const sortedEntries = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]))

    if (sortedEntries.length === 0) {
      const points = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        points.push({
          label: formatDate(d.toISOString().split('T')[0]),
          value: isEmployee ? 8 : 4 + Math.round(Math.random() * 4)
        })
      }
      return points
    }

    return sortedEntries
      .map(([label, value]) => ({ label: formatDate(label), value }))
      .slice(-10)
  }, [filteredLogs, isEmployee])

  const recentActivities = useMemo<ActivityItem[]>(() => {
    const employeeActivities = [...mockEmployees]
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
      .slice(0, 5)
      .map((employee, idx) => {
        const name = `${employee.firstName} ${employee.lastName}`
        const dept = employee.department || 'Unassigned'
        const dateStr = employee.startDate ? formatDate(employee.startDate) : 'recently'
        
        let title = `Super User approved request for ${name}`
        let description = `Assigned role: Employee in ${dept} Team on ${dateStr}`
        let time = 'Just now'

        if (idx === 1) {
          title = `Admin / HR added new Employee ${name}`
          description = `Position: ${employee.position || 'Specialist'} • Started ${dateStr}`
          time = '1 hour ago'
        } else if (idx === 2) {
          title = `Super User accepted registration request`
          description = `Approved ${name} with role: Employee`
          time = '1 day ago'
        } else if (idx === 3 && employee.manager) {
          title = `Supervisor assigned by Admin`
          description = `${employee.manager} designated as supervisor for ${name}`
          time = '2 days ago'
        } else if (idx >= 4) {
          title = `Super User added new Administrator ${name}`
          description = `Granted HR/Admin credentials to control workspace`
          time = '3 days ago'
        }

        return {
          title,
          description,
          time,
          date: employee.startDate || ''
        }
      })

    const latestAttendance = [...filteredLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map(log => ({
        title: `${log.employeeName} checked in`,
        description: `Status: ${log.status.toUpperCase()} • Department: ${log.department} • Time: ${log.checkIn || '09:00'}`,
        time: formatDate(log.date),
        date: log.date,
      }))

    return [...latestAttendance, ...employeeActivities]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 6)
  }, [mockEmployees, filteredLogs])



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

  if (employeesLoading || announcementsLoading || tasksLoading || holidaysLoading) {
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
