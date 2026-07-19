import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Employee, CreateEmployeeInput } from '@/types'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { getDepartments } from '@/utils/helpers'
import { motion } from 'framer-motion'

interface EmployeeFormProps {
  employee?: Employee
  onSubmit: (data: CreateEmployeeInput | Employee) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateEmployeeInput | Employee>(
    employee || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      startDate: new Date().toISOString().split('T')[0],
      manager: '',
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const departments = getDepartments()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.department) newErrors.department = 'Department is required'
    if (!formData.position.trim()) newErrors.position = 'Position is required'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md"
    >
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card flex items-center justify-between p-lg border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button
            onClick={onCancel}
            className="p-xs hover:bg-slate-100 rounded transition-colors"
            aria-label="Close form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-lg space-y-md">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
              disabled={isLoading}
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
              disabled={isLoading}
            />
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              disabled={isLoading}
            />
            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
              disabled={isLoading}
            />
          </div>

          {/* Job Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <Select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              error={errors.department}
              options={departments.map(dept => ({ value: dept, label: dept }))}
              required
              disabled={isLoading}
            />
            <Input
              label="Position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              error={errors.position}
              required
              disabled={isLoading}
            />
          </div>

          {/* Dates and Manager */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              error={errors.startDate}
              required
              disabled={isLoading}
            />
            <Input
              label="Manager (Optional)"
              name="manager"
              value={formData.manager || ''}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-md justify-end pt-md border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              {employee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
