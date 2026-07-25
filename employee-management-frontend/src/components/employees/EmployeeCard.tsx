import React from 'react'
import { Mail, Phone, ExternalLink, Edit2, Trash2 } from 'lucide-react'
import { Employee } from '@/types'
import { formatDate, getStatusColor, getStatusLabel, getInitials } from '@/utils/helpers'
import { Badge } from '@/components/common/Badge'
import { motion } from 'framer-motion'

interface EmployeeCardProps {
  employee: Employee
  onClick?: () => void
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onClick,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="card group h-full overflow-visible hover:shadow-lg transition-all duration-300 cursor-pointer border border-border hover:border-primary-200 dark:hover:border-primary-700/40"
      onClick={onClick}
    >
      {/* Header with Status Badge */}
      <div className="relative h-20 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-slate-800 dark:to-slate-700 border-b border-primary-100 dark:border-slate-700 rounded-t-2xl">
        <div className="absolute top-md right-md z-10">
          <Badge variant={getStatusColor(employee.status).replace('badge-', '') as any}>
            {getStatusLabel(employee.status)}
          </Badge>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="px-md pt-0 pb-md relative">
        <div className="flex items-end gap-md mb-md -mt-8 relative z-20">
          {employee.avatar ? (
              <img
              src={employee.avatar}
              alt={`${employee.firstName} ${employee.lastName}`}
              className="h-16 w-16 rounded-xl object-cover flex-shrink-0 border-4 border-card shadow-md"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 border-4 border-card shadow-md">
              {getInitials(employee.firstName, employee.lastName)}
            </div>
          )}
          <div className="flex-1 min-w-0 pb-sm">
            <h3 className="font-bold text-lg text-text-primary truncate">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-primary-600 dark:text-primary-300 font-medium truncate">{employee.position}</p>
          </div>
        </div>

        {/* Department Tag */}
        <div className="mb-md">
          <span className="inline-flex items-center px-sm py-xs rounded-full text-xs font-semibold bg-background text-text-secondary border border-border">
            {employee.department}
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-sm mb-md">
          <a
            href={`mailto:${employee.email}`}
            className="flex items-center gap-sm text-sm text-text-secondary hover:text-primary-500 transition-colors group/link"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-4 w-4 flex-shrink-0 group-hover/link:scale-110 transition-transform" />
            <span className="truncate hover:underline">{employee.email}</span>
          </a>
          <a
            href={`tel:${employee.phone}`}
            className="flex items-center gap-sm text-sm text-text-secondary hover:text-primary-500 transition-colors group/link"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-4 w-4 flex-shrink-0 group-hover/link:scale-110 transition-transform" />
            <span className="truncate">{employee.phone}</span>
          </a>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-sm text-xs mb-md p-sm bg-background rounded-lg border border-border">
          <div className="flex flex-col gap-xs">
            <span className="text-text-secondary font-semibold">Department</span>
            <span className="text-text-primary font-medium">{employee.department}</span>
          </div>
          <div className="flex flex-col gap-xs">
            <span className="text-text-secondary font-semibold">Joined</span>
            <span className="text-text-primary font-medium">{formatDate(employee.startDate)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-sm">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView?.()
            }}
            className="flex-1 button-secondary text-sm gap-xs py-sm flex items-center justify-center hover:scale-105 transition-transform"
            title="View details"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">View</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
            className="flex-1 button-secondary text-sm gap-xs py-sm flex items-center justify-center hover:scale-105 transition-transform"
            title="Edit employee"
          >
            <Edit2 className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
            className="flex-1 button text-sm gap-xs py-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/40 flex items-center justify-center hover:scale-105 transition-transform"
            title="Delete employee"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
