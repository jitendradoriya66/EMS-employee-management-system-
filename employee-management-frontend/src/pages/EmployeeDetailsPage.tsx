import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, User, Edit2 } from 'lucide-react'
import { Employee } from '@/types'
import { getEmployeeById } from '@/utils/api'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { Alert } from '@/components/common/Alert'
import { formatDate, getStatusColor, getStatusLabel, getInitials, formatCurrency } from '@/utils/helpers'
import { motion } from 'framer-motion'

export const EmployeeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true)
        const data = await getEmployeeById(id || '')
        if (data) {
          setEmployee(data)
        } else {
          setError('Employee not found')
        }
      } catch (err) {
        setError('Failed to load employee details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEmployee()
    }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-lg">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-md">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <LoadingSkeleton rows={5} />
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="space-y-md">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-md">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Alert variant="error" title="Error">
          {error || 'Employee not found'}
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-lg">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-sm">
          <ArrowLeft className="h-5 w-5" />
          Back to Employees
        </Button>
        <Button variant="primary" className="gap-sm">
          <Edit2 className="h-4 w-4" />
          Edit Employee
        </Button>
      </motion.div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card overflow-hidden"
      >
        <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600" />
        <div className="px-lg pb-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-md -mt-16 mb-lg">
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="h-24 w-24 rounded-xl object-cover border-4 border-card shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-card shadow-lg">
                {getInitials(employee.firstName, employee.lastName)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-text-primary">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-lg text-primary-600 font-semibold">{employee.position}</p>
              <div className="mt-md flex flex-wrap gap-sm">
                <Badge variant={getStatusColor(employee.status).replace('badge-', '') as any}>
                  {getStatusLabel(employee.status)}
                </Badge>
                <Badge variant="neutral">{employee.department}</Badge>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg pt-lg border-t border-border">
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-md uppercase tracking-wider">
                Contact Information
              </h3>
              <div className="space-y-md">
                <a
                  href={`mailto:${employee.email}`}
                  className="flex items-center gap-md p-md bg-background rounded-lg hover:bg-card transition-colors border border-border"
                >
                  <Mail className="h-5 w-5 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary">Email</p>
                    <p className="text-sm font-medium text-text-primary truncate">{employee.email}</p>
                  </div>
                </a>
                <a
                  href={`tel:${employee.phone}`}
                  className="flex items-center gap-md p-md bg-background rounded-lg hover:bg-card transition-colors border border-border"
                >
                  <Phone className="h-5 w-5 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary">Phone</p>
                    <p className="text-sm font-medium text-text-primary">{employee.phone}</p>
                  </div>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-md uppercase tracking-wider">
                Employment Details
              </h3>
              <div className="space-y-md">
                <div className="flex items-center gap-md p-md bg-background rounded-lg border border-border">
                  <Briefcase className="h-5 w-5 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary">Position</p>
                    <p className="text-sm font-medium text-text-primary">{employee.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-md p-md bg-background rounded-lg border border-border">
                  <MapPin className="h-5 w-5 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary">Department</p>
                    <p className="text-sm font-medium text-text-primary">{employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-md p-md bg-background rounded-lg border border-border">
                  <Calendar className="h-5 w-5 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary">Start Date</p>
                    <p className="text-sm font-medium text-text-primary">{formatDate(employee.startDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {(employee.manager || employee.salary) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mt-lg pt-lg border-t border-border">
              {employee.manager && (
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-md uppercase tracking-wider">
                    Manager
                  </h3>
                  <div className="flex items-center gap-md p-md bg-background rounded-lg border border-border">
                    <User className="h-5 w-5 text-primary-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-text-primary">{employee.manager}</p>
                  </div>
                </div>
              )}
              {employee.salary && (
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-md uppercase tracking-wider">
                    Salary
                  </h3>
                  <div className="p-md bg-background rounded-lg border border-border">
                    <p className="text-sm font-medium text-text-primary">{formatCurrency(employee.salary)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Team Section */}
      {employee.team && employee.team.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-lg"
        >
          <h2 className="section-title mb-md">Team Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {employee.team.map((member, idx) => (
              <div key={idx} className="flex items-center gap-md p-md bg-background rounded-lg border border-border">
                <div className="h-10 w-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {member.split(' ').map(n => n[0]).join('')}
                </div>
                <p className="text-sm font-medium text-text-primary">{member}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
