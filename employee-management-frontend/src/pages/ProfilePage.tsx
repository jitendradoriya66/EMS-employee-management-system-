import React, { useMemo, useState } from 'react'
import { Mail, Phone, Building2, Briefcase, Calendar, Edit2, Save, X, Download, Printer, FileText, Clock3 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { useEmployees } from '@/hooks/useEmployees'
import { updateEmployee } from '@/utils/api'

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    designation: 'Senior Developer',
    joinDate: '2022-01-15',
  })

  const { employees } = useEmployees()

  const employeeProfile = useMemo(() => {
    if (!employees.length) return null
    return employees.find(employee => employee.email === user?.email) ?? null
  }, [user?.email, employees])

  React.useEffect(() => {
    if (employeeProfile) {
      setFormData({
        firstName: employeeProfile.firstName,
        lastName: employeeProfile.lastName,
        email: employeeProfile.email || user?.email || '',
        phone: employeeProfile.phone || '',
        department: employeeProfile.department || 'Unassigned',
        designation: employeeProfile.position || 'Employee',
        joinDate: employeeProfile.startDate || '',
      })
    }
  }, [employeeProfile, user?.email])

  const attendanceSummary = useMemo(() => {
    const logs = employeeProfile?.attendanceLog || []
    return {
      present: logs.filter(entry => entry.status === 'present').length,
      late: logs.filter(entry => entry.status === 'late').length,
      leave: logs.filter(entry => entry.status === 'leave').length,
      totalHours: logs.reduce((sum, entry) => sum + entry.hoursWorked, 0),
    }
  }, [employeeProfile])

  const handlePrintPdf = () => {
    window.print()
  }

  const handleExportCsv = () => {
    const rows = [
      ['Field', 'Value'],
      ['Name', `${formData.firstName} ${formData.lastName}`],
      ['Email', formData.email],
      ['Phone', formData.phone],
      ['Department', formData.department],
      ['Designation', formData.designation],
      ['Join Date', formData.joinDate],
      ['Attendance Present', String(attendanceSummary.present)],
      ['Attendance Late', String(attendanceSummary.late)],
      ['Attendance Leave', String(attendanceSummary.leave)],
      ['Total Attendance Hours', attendanceSummary.totalHours.toFixed(2)],
    ]

    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `employee-profile-${formData.firstName.toLowerCase()}-${formData.lastName.toLowerCase()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (employeeProfile) {
        await updateEmployee(employeeProfile.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          position: formData.designation,
        });
      }
      setIsEditing(false)
    } catch (e) {
}
