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
}
