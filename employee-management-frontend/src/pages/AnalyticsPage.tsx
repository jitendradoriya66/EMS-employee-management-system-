import React, { useMemo, useState } from 'react'
import { Users, Activity, Award, Filter, X, Eye, UserX, TrendingUp, UserCheck, ChevronDown } from 'lucide-react'
import { useEmployees } from '@/hooks/useEmployees'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getStatusColor, getStatusLabel, getDepartmentColor, formatDate } from '@/utils/helpers'

interface StatCard {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  change: string
  trend: 'up' | 'down'
  color: 'primary' | 'success' | 'warning' | 'danger'
}

interface ChartDataPoint {
  name: string
  value: number
  percentage?: number
}

interface InsightCard {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

// ----------------------------------------------------
// INTERACTIVE DONUT (PIE) CHART COMPONENT
// ----------------------------------------------------
interface PieChartProps {
  data: ChartDataPoint[]
  colors: string[]
  selectedStatus: string | null
  onSelectStatus: (status: string | null) => void
  totalCount: number
}

const PieChart: React.FC<PieChartProps> = ({ data, colors, selectedStatus, onSelectStatus, totalCount }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])
  const radius = 50
  const circumference = 2 * Math.PI * radius
  
  // Calculate offsets dynamically
  const slices = useMemo(() => {
    let offset = 0
    return data.map((item, idx) => {
      const sliceOffset = offset
      const ratio = total > 0 ? item.value / total : 0
      offset += ratio * circumference
      return {
        offset: sliceOffset,
        length: ratio * circumference,
        color: colors[idx % colors.length],
        percentage: Math.round(ratio * 100),
      }
    })
  }, [data, colors, total, circumference])

  const getStatusValue = (name: string) => {
    if (name === 'Active') return 'active'
    if (name === 'On Leave') return 'on-leave'
    if (name === 'Inactive') return 'inactive'
    return null
  }

  const selectedItem = selectedStatus
    ? data.find(item => getStatusValue(item.name) === selectedStatus) ?? null
    : null

  return (
    <div className="flex items-center justify-center relative">
      <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="32"
          className="opacity-20 dark:opacity-10"
        />
        {slices.map((slice, idx) => {
          const item = data[idx]
          if (item.value === 0) return null

          const statusVal = getStatusValue(item.name)
          const isSelected = selectedStatus === statusVal
          const isAnySelected = selectedStatus !== null
          const isHovered = hoveredIdx === idx

          let opacity = 1
          if (isAnySelected && !isSelected) {
            opacity = 0.35
          }
          if (hoveredIdx !== null && !isHovered) {
            opacity = isSelected ? 1 : 0.6
          }

          const strokeWidth = isHovered ? 40 : (isSelected ? 36 : 28)

          return (
            <circle
              key={idx}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${slice.length} ${circumference}`}
              strokeDashoffset={-slice.offset}
              className="cursor-pointer transition-all duration-300 origin-center"
              style={{
                opacity,
                transition: 'stroke-width 0.2s ease, stroke-dashoffset 0.6s ease, opacity 0.2s ease',
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                const newVal = getStatusValue(item.name)
                onSelectStatus(selectedStatus === newVal ? null : newVal)
              }}
            />
          )
        })}

        <g className="pointer-events-none transform rotate-90 origin-center">
          <text
            x="110"
            y="100"
            textAnchor="middle"
            className="text-[10px] uppercase tracking-widest font-bold fill-slate-400 dark:fill-slate-500"
          >
            {hoveredIdx !== null ? data[hoveredIdx].name : (selectedStatus ? 'Status Filter' : 'Total')}
          </text>
          <text
            x="110"
            y="122"
            textAnchor="middle"
            className="text-2xl font-extrabold fill-slate-800 dark:fill-slate-100"
          >
            {hoveredIdx !== null ? `${data[hoveredIdx].value}` : (selectedItem ? `${selectedItem.value}` : `${total}`)}
          </text>
          <text
            x="110"
            y="136"
            textAnchor="middle"
            className="text-[10px] font-semibold fill-primary-500 dark:fill-primary-400"
          >
            {hoveredIdx !== null
              ? `${slices[hoveredIdx].percentage}%`
              : (selectedItem
                  ? `${totalCount > 0 ? Math.round((selectedItem.value / totalCount) * 100) : 0}%`
                  : 'Employees')}
          </text>
        </g>
      </svg>
    </div>
  )
}

// ----------------------------------------------------
// INTERACTIVE BAR CHART COMPONENT
// ----------------------------------------------------
interface BarChartProps {
  data: ChartDataPoint[]
  selectedDept: string | null
  onSelectDept: (dept: string | null) => void
  totalCount: number
}

const BarChart: React.FC<BarChartProps> = ({ data, selectedDept, onSelectDept, totalCount }) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (totalCount === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-background/60 px-md text-center text-sm text-text-secondary">
        No department data available for the current filters.
      </div>
    )
  }

  return (
    <div className="grid h-64 grid-cols-5 gap-sm sm:gap-md px-0 sm:px-sm md:px-md items-end">
      {data.map((item, idx) => {
        const isSelected = selectedDept === item.name
        const isAnySelected = selectedDept !== null
        const isHovered = hoveredIdx === idx
        const height = Math.max(12, (item.value / maxValue) * 176)
        
        let opacity = 1
        if (isAnySelected && !isSelected) {
          opacity = 0.35
        }
        if (hoveredIdx !== null && !isHovered) {
          opacity = isSelected ? 1 : 0.6
        }

        return (
          <div
            key={idx}
            className="flex h-full flex-col items-center justify-end gap-xs cursor-pointer group relative"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => onSelectDept(selectedDept === item.name ? null : item.name)}
            style={{ opacity, transition: 'opacity 0.2s ease' }}
          >
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.9 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-xs px-sm py-xs bg-card text-text-primary text-[10px] font-bold rounded-lg border border-border shadow-xl pointer-events-none whitespace-nowrap z-30"
                >
                  {item.value} ({totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0}%)
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex w-full flex-col items-center gap-xs">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}px` }}
                transition={{ delay: idx * 0.05, duration: 0.5 }}
                className={`relative w-full overflow-hidden rounded-t-xl rounded-b-md border border-border/60 shadow-sm transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-t from-primary-600 via-primary-500 to-primary-400 ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900'
                    : isHovered
                    ? 'bg-gradient-to-t from-primary-500 via-primary-400 to-primary-300 shadow-md'
                    : 'bg-gradient-to-t from-primary-400 via-primary-400 to-primary-300/90'
                }`}
              >
                <div className="absolute inset-x-0 top-0 flex items-center justify-center pt-xs">
                  <span className="rounded-full bg-card/90 px-xs py-[2px] text-[10px] font-bold text-text-primary shadow-sm">
                    {item.value}
                  </span>
                </div>
              </motion.div>

              <div className="text-[10px] font-semibold text-text-secondary text-center truncate w-full max-w-[72px]" title={item.name}>
              {item.name}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ----------------------------------------------------
// MAIN ANALYTICS PAGE MODULE
// ----------------------------------------------------
export const AnalyticsPage: React.FC = () => {
  const { employees } = useEmployees()
  const [dateRange, setDateRange] = useState('all')
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const filterByDateRange = (startDateStr: string, range: string): boolean => {
    if (range === 'all') return true
    const startDate = new Date(startDateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (range === 'week') return diffDays <= 7
    if (range === 'month') return diffDays <= 30
    if (range === 'quarter') return diffDays <= 90
    if (range === 'year') return diffDays <= 365
    return true
  }

  const stats: StatCard[] = useMemo(() => {
    if (!employees) return []
    const baseList = employees.filter(emp => {
      if (!filterByDateRange(emp.startDate, dateRange)) return false
      if (selectedDept && selectedDept !== 'all' && emp.department !== selectedDept) return false
      if (selectedStatus && emp.status !== selectedStatus) return false
      return true
    })

    const total = baseList.length
    const active = baseList.filter(e => e.status === 'active').length
    const onLeave = baseList.filter(e => e.status === 'on-leave').length
    const inactive = baseList.filter(e => e.status === 'inactive').length

    return [
      { title: 'Total Employees', value: total, icon: Users, change: '+2.5%', trend: 'up', color: 'primary' },
      { title: 'Active Status', value: active, icon: Activity, change: '+1.2%', trend: 'up', color: 'success' },
      { title: 'On Leave', value: onLeave, icon: Award, change: '-0.5%', trend: 'down', color: 'warning' },
      { title: 'Inactive', value: inactive, icon: UserX, change: '0%', trend: 'up', color: 'danger' },
    ]
  }, [dateRange, selectedDept, selectedStatus, employees])

  const departmentData = useMemo(() => {
    if (!employees) return []
    const baseList = employees.filter(emp => {
      if (!filterByDateRange(emp.startDate, dateRange)) return false
      if (selectedStatus && emp.status !== selectedStatus) return false
      return true
    })
    
    const depts: Record<string, number> = {}
    const defaultDepts = ['Engineering', 'Product', 'Sales', 'HR', 'Finance']
    defaultDepts.forEach(d => { depts[d] = 0 })

    baseList.forEach(emp => {
      depts[emp.department] = (depts[emp.department] || 0) + 1
    })

    return Object.entries(depts).map(([dept, count]) => ({ name: dept, value: count }))
  }, [dateRange, selectedStatus, employees])

  const departmentTotal = useMemo(() => departmentData.reduce((sum, item) => sum + item.value, 0), [departmentData])

  const statusData = useMemo(() => {
    if (!employees) return []
    const baseList = employees.filter(emp => {
      if (!filterByDateRange(emp.startDate, dateRange)) return false
      if (selectedDept && selectedDept !== 'all' && emp.department !== selectedDept) return false
      return true
    })

    const total = baseList.length
    const statuses = {
      'Active': baseList.filter(e => e.status === 'active').length,
      'On Leave': baseList.filter(e => e.status === 'on-leave').length,
      'Inactive': baseList.filter(e => e.status === 'inactive').length,
    }

    return Object.entries(statuses).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
  }, [dateRange, selectedDept, employees])

  const statusTotal = useMemo(() => statusData.reduce((sum, item) => sum + item.value, 0), [statusData])

  const filteredEmployeesList = useMemo(() => {
    if (!employees) return []
    return employees.filter(emp => {
      if (!filterByDateRange(emp.startDate, dateRange)) return false
      if (selectedDept && emp.department !== selectedDept) return false
      if (selectedStatus && emp.status !== selectedStatus) return false
      return true
    })
  }, [dateRange, selectedDept, selectedStatus, employees])

  const insights: InsightCard[] = useMemo(() => {
    if (!employees) return []
    const totalEmployees = employees.length
    const avgTenureDays = totalEmployees > 0
      ? Math.round(
          employees.reduce((sum, emp) => {
            const joined = new Date(emp.startDate)
            return sum + Math.max(0, Math.floor((Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24)))
          }, 0) / totalEmployees
        )
      : 0

    const attendanceSummary = employees.reduce(
      (summary, emp) => {
        emp.attendanceLog?.forEach(entry => {
          if (entry.status === 'present') summary.present += 1
          if (entry.status === 'late') summary.late += 1
          if (entry.status === 'leave') summary.leave += 1
        })
        return summary
      },
      { present: 0, late: 0, leave: 0 }
    )

    const topPerformer = [...employees]
      .filter(emp => typeof emp.performanceScore === 'number')
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))[0]

    return [
      {
        title: 'Average Tenure',
        value: `${avgTenureDays} days`,
        description: 'Average time the current team has spent with the company.',
        icon: TrendingUp,
      },
      {
        title: 'Attendance Mix',
        value: `${attendanceSummary.present} / ${attendanceSummary.late} / ${attendanceSummary.leave}`,
        description: 'Present, late, and leave entries in the attendance logs.',
        icon: UserCheck,
      },
      {
        title: 'Top Performer',
        value: topPerformer ? `${topPerformer.firstName} ${topPerformer.lastName}` : 'N/A',
        description: topPerformer ? `Performance score ${topPerformer.performanceScore}%` : 'No performance data available.',
        icon: Award,
      },
    ]
  }, [employees])

  const clearAllFilters = () => {
    setDateRange('all')
    setSelectedDept(null)
    setSelectedStatus(null)
  }

  const hasActiveFilters = dateRange !== 'all' || selectedDept !== null || selectedStatus !== null

  const colorMap = {
    primary: { bg: 'bg-primary-50 dark:bg-primary-950/30', text: 'text-primary dark:text-primary-400', border: 'border-primary-100 dark:border-primary-900/30' },
    success: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-100 dark:border-green-900/30' },
    warning: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-100 dark:border-yellow-900/30' },
    danger: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-100 dark:border-red-900/30' },
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-lg flex-1 flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="section-title">Analytics & Reports</h1>
          <p className="section-subtitle mt-xs">Interactive breakdown of organization metrics</p>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="self-start sm:self-center inline-flex items-center gap-sm px-md py-sm rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold transition-all duration-200"
          >
            <X className="h-4 w-4" />
            Clear Active Filters
          </button>
        )}
      </div>

      <motion.div variants={itemVariants} className="card p-md flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-start gap-md flex-wrap">
          <Filter className="h-5 w-5 text-text-secondary" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md flex-1">
            <div className="flex flex-col relative">
              <label className="text-[10px] font-bold text-text-secondary uppercase mb-xs">Filter by Start Date</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="theme-select text-xs text-text-primary"
              >
                <option value="all">All Time</option>
                <option value="week">Joined this Week</option>
                <option value="month">Joined this Month</option>
                <option value="quarter">Joined this Quarter</option>
                <option value="year">Joined this Year</option>
              </select>
            </div>

            <div className="flex flex-col relative">
              <label className="text-[10px] font-bold text-text-secondary uppercase mb-xs">Select Department</label>
              <select
                value={selectedDept || 'all'}
                onChange={(e) => setSelectedDept(e.target.value === 'all' ? null : e.target.value)}
                className="theme-select text-xs text-text-primary"
              >
                <option value="all">All Departments</option>
                {['Engineering', 'Product', 'Sales', 'HR', 'Finance'].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="hidden xl:flex items-end text-xs text-text-secondary">
              <span className="inline-flex items-center gap-xs px-md py-sm rounded-lg border border-border bg-background">
                <ChevronDown className="h-4 w-4 text-text-secondary" />
                Filter cards stay aligned to the active theme
              </span>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-sm items-center">
            <span className="text-xs text-text-secondary">Filtering by:</span>
            {dateRange !== 'all' && (
              <span className="inline-flex items-center gap-xs px-sm py-[2px] rounded-full text-xs font-semibold bg-primary-50 text-primary border border-primary-200">
                Range: {dateRange}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setDateRange('all')} />
              </span>
            )}
            {selectedDept && (
              <span className="inline-flex items-center gap-xs px-sm py-[2px] rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Dept: {selectedDept}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDept(null)} />
              </span>
            )}
            {selectedStatus && (
              <span className="inline-flex items-center gap-xs px-sm py-[2px] rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                Status: {getStatusLabel(selectedStatus)}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStatus(null)} />
              </span>
            )}
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="card p-md sm:p-lg">
        <div className="flex items-center justify-between gap-md mb-md">
          <div>
            <h2 className="section-title text-base sm:text-lg">Workforce Insights</h2>
            <p className="text-xs text-text-secondary mt-xs">Additional operational context that complements the charts.</p>
          </div>
          <span className="text-xs font-semibold text-primary">Updated live</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {insights.map((insight) => {
            const Icon = insight.icon
            return (
              <div key={insight.title} className="rounded-lg border border-border bg-background/60 p-md">
                <div className="flex items-start justify-between gap-md">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{insight.title}</p>
                    <p className="text-xs text-text-secondary mt-xs">{insight.description}</p>
                  </div>
                  <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <p className="mt-md text-lg font-extrabold text-text-primary break-words">{insight.value}</p>
              </div>
            )
          })}
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          const colors = colorMap[stat.color]
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className={`card p-md sm:p-lg border-2 ${colors.border} hover:shadow-lg transition-all duration-300 min-h-[156px] flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between mb-md">
                <div className={`p-md rounded-lg ${colors.bg}`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <span className={`text-xs font-semibold ${colors.text}`}>
                  {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                </span>
              </div>
              <p className="text-text-secondary text-xs sm:text-sm font-medium mb-xs">{stat.title}</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-text-primary leading-tight">{stat.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <motion.div variants={itemVariants} className="card p-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-sm">
              <h2 className="section-title text-base sm:text-lg">Department Distribution</h2>
              {selectedDept && (
                <span className="text-xs font-semibold text-primary">Click bar again to deselect</span>
              )}
            </div>
            <p className="text-xs text-text-secondary mb-lg">
              Click on a department bar to filter the records below by that department.
            </p>
          </div>
          <BarChart
            data={departmentData}
            selectedDept={selectedDept}
            onSelectDept={setSelectedDept}
            totalCount={departmentTotal}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="card p-lg">
          <div className="flex items-center justify-between mb-sm">
            <h2 className="section-title text-base sm:text-lg">Employment Status</h2>
            {selectedStatus && (
              <span className="text-xs font-semibold text-primary">Click slice again to deselect</span>
            )}
          </div>
          <p className="text-xs text-text-secondary mb-lg">
            Hover over wedges to see absolute counts. Click a wedge to filter the records below.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-lg">
            <PieChart
              data={statusData}
              colors={['#10B981', '#F59E0B', '#EF4444']}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              totalCount={statusTotal}
            />
            <div className="space-y-xs w-full sm:max-w-[180px]">
              {statusData.map((item, idx) => {
                const colors = ['bg-green-500', 'bg-yellow-500', 'bg-red-500']
                const isSelected = selectedStatus === getStatusLabel(item.name).toLowerCase().replace(' ', '-')
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const value = getStatusLabel(item.name).toLowerCase().replace(' ', '-')
                      setSelectedStatus(selectedStatus === value ? null : value)
                    }}
                    className={`w-full flex items-center justify-between p-sm rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary-50 dark:bg-primary-950/20'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-sm">
                      <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                      <span className="text-xs font-semibold text-text-primary">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-text-secondary">{item.value}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="card p-lg flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm mb-lg">
          <div>
            <h2 className="section-title text-base sm:text-lg">Filtered Employee Records</h2>
            <p className="text-xs text-text-secondary mt-xs">
              Matches your active chart and date-range filters ({filteredEmployeesList.length} of {employees?.length ?? 0} found)
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-primary hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Department</th>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Status</th>
                <th className="text-left py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Start Date</th>
                <th className="text-right py-md px-md text-text-secondary font-bold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredEmployeesList.length > 0 ? (
                  filteredEmployeesList.map((emp) => (
                    <motion.tr
                      key={emp.id}
                      layoutId={`row-${emp.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-md px-md">
                        <div className="flex items-center gap-md">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-border flex-shrink-0 bg-slate-100 flex items-center justify-center font-bold text-xs text-text-secondary">
                            {emp.avatar ? (
                              <img src={emp.avatar} alt={`${emp.firstName} ${emp.lastName}`} className="h-full w-full object-cover" />
                            ) : (
                              `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary text-xs sm:text-sm">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[10px] text-text-secondary">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-md px-md">
                        <span className={`px-sm py-xs rounded text-[10px] font-bold ${getDepartmentColor(emp.department)}`}>
                          {emp.department}
                        </span>
                      </td>
                      <td className="py-md px-md">
                        <span className={`badge ${getStatusColor(emp.status)} text-[10px] font-bold`}>
                          {getStatusLabel(emp.status)}
                        </span>
                      </td>
                      <td className="py-md px-md text-xs text-text-primary">{formatDate(emp.startDate)}</td>
                      <td className="py-md px-md text-right">
                        <Link
                          to={`/employees/${emp.id}`}
                          className="inline-flex items-center gap-xs text-xs font-bold text-primary hover:text-primary-600 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          View Profile
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-xl text-center text-text-secondary text-xs sm:text-sm">
                      No employee records match the active criteria. Click Reset Filters to view all.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
