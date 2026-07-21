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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
    setErrorMessage(null)
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
    } catch (e: any) {
      console.error("Failed to update profile", e)
      setErrorMessage(e.response?.data?.detail || e.message || "Failed to update profile.")
    } finally {
      setIsSaving(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (!employeeProfile) {
    return <div className="p-xl text-center text-text-secondary">Employee profile not found</div>
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-lg">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-md no-print">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="section-subtitle mt-xs">View and manage your profile information</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Button variant="secondary" onClick={handleExportCsv} className="gap-sm">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handlePrintPdf} className="gap-sm">
            <Printer className="h-4 w-4" />
            Save as PDF
          </Button>
          <Button
            variant={isEditing ? 'secondary' : 'primary'}
            onClick={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
            className="gap-sm"
          >
            {isEditing ? (
              <>
                <X className="h-5 w-5" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="h-5 w-5" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-md text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200 no-print">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md no-print">
        {[
          { label: 'Department', value: formData.department, icon: Building2 },
          { label: 'Performance', value: employeeProfile ? `${employeeProfile.performanceScore ?? 'N/A'}%` : 'N/A', icon: FileText },
          { label: 'Attendance Hours', value: attendanceSummary.totalHours.toFixed(1), icon: Clock3 },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-md flex items-center justify-between gap-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{card.label}</p>
                <p className="mt-sm text-2xl font-extrabold text-text-primary">{card.value}</p>
              </div>
              <Icon className="h-5 w-5 text-primary flex-shrink-0" />
            </div>
          )
        })}
      </div>

      <motion.div variants={itemVariants} className="card p-lg space-y-lg report-sheet">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-md border-b border-border pb-lg">
          <div>
            <div className="inline-flex items-center gap-sm rounded-full border border-border bg-background px-md py-xs text-xs font-semibold text-text-secondary">
              <FileText className="h-4 w-4 text-primary" />
              Employee Profile Report
            </div>
            <h2 className="mt-md text-2xl font-bold text-text-primary">{formData.firstName} {formData.lastName}</h2>
            <p className="mt-xs text-sm text-text-secondary">Printable employee summary for leadership review.</p>
          </div>

          <div className="rounded-xl border border-border bg-background px-md py-sm text-sm text-text-secondary">
            <p className="font-semibold text-text-primary">Current role</p>
            <p>{formData.designation}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          <div className="rounded-xl border border-border bg-background p-lg space-y-md">
            <h3 className="text-lg font-bold text-text-primary">Employee Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md text-sm">
              <div className="rounded-lg border border-border p-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Email</p>
                <p className="mt-xs text-text-primary">{formData.email}</p>
              </div>
              <div className="rounded-lg border border-border p-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Phone</p>
                <p className="mt-xs text-text-primary">{formData.phone}</p>
              </div>
              <div className="rounded-lg border border-border p-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Department</p>
                <p className="mt-xs text-text-primary">{formData.department}</p>
              </div>
              <div className="rounded-lg border border-border p-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Join Date</p>
                <p className="mt-xs text-text-primary">{new Date(formData.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-lg space-y-md">
            <h3 className="text-lg font-bold text-text-primary">Attendance & Performance</h3>
            <div className="grid grid-cols-3 gap-sm text-center text-sm">
              <div className="rounded-lg border border-border p-md">
                <p className="text-xs text-text-secondary">Present</p>
                <p className="mt-xs text-xl font-extrabold text-text-primary">{attendanceSummary.present}</p>
              </div>
              <div className="rounded-lg border border-border p-md">
                <p className="text-xs text-text-secondary">Late</p>
                <p className="mt-xs text-xl font-extrabold text-text-primary">{attendanceSummary.late}</p>
              </div>
              <div className="rounded-lg border border-border p-md">
                <p className="text-xs text-text-secondary">Leave</p>
                <p className="mt-xs text-xl font-extrabold text-text-primary">{attendanceSummary.leave}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Performance score</p>
              <p className="mt-xs text-2xl font-extrabold text-text-primary">{employeeProfile?.performanceScore ?? 'N/A'}%</p>
            </div>
            <div className="rounded-lg border border-border p-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Salary</p>
              <p className="mt-xs text-2xl font-extrabold text-text-primary">
                {employeeProfile?.salary ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(employeeProfile.salary) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-lg space-y-md">
          <h3 className="text-lg font-bold text-text-primary">Notes</h3>
          <p className="text-sm text-text-secondary leading-6">
            This profile report can be printed or saved as a PDF for management review. It includes contact details, department, attendance, salary, and performance details in a clean shareable format.
          </p>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Avatar Section */}
        <div className="card p-lg flex flex-col items-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold mb-md">
            {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-text-primary text-center">
            {formData.firstName} {formData.lastName}
          </h2>
          <p className="text-sm text-text-secondary text-center mt-sm">{formData.designation}</p>
          <div className="mt-lg w-full pt-lg border-t border-border">
            <p className="text-xs text-text-secondary text-center">Member since {new Date(formData.joinDate).getFullYear()}</p>
          </div>
        </div>

        {/* Information Section */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Contact Information */}
          <motion.div variants={itemVariants} className="card p-lg space-y-md">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-sm">
              <Mail className="h-5 w-5 text-primary-500" />
              Contact Information
            </h3>

            {isEditing ? (
              <div className="space-y-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            ) : (
              <div className="space-y-md">
                <div className="flex items-center justify-between p-md bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-md">
                    <Mail className="h-5 w-5 text-text-secondary" />
                    <div>
                      <p className="text-xs text-text-secondary">Email</p>
                      <p className="text-sm font-medium text-text-primary">{formData.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-md bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-md">
                    <Phone className="h-5 w-5 text-text-secondary" />
                    <div>
                      <p className="text-xs text-text-secondary">Phone</p>
                      <p className="text-sm font-medium text-text-primary">{formData.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Work Information */}
          <motion.div variants={itemVariants} className="card p-lg space-y-md">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-sm">
              <Briefcase className="h-5 w-5 text-primary-500" />
              Work Information
            </h3>

            {isEditing ? (
              <div className="space-y-md">
                <Input
                  label="Department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                />
                <Input
                  label="Designation"
                  value={formData.designation}
                  onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                />
                <Input
                  label="Join Date"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                />
              </div>
            ) : (
              <div className="space-y-md">
                <div className="flex items-center justify-between p-md bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-md">
                    <Building2 className="h-5 w-5 text-text-secondary" />
                    <div>
                      <p className="text-xs text-text-secondary">Department</p>
                      <p className="text-sm font-medium text-text-primary">{formData.department}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-md bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-md">
                    <Briefcase className="h-5 w-5 text-text-secondary" />
                    <div>
                      <p className="text-xs text-text-secondary">Designation</p>
                      <p className="text-sm font-medium text-text-primary">{formData.designation}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-md bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-md">
                    <Calendar className="h-5 w-5 text-text-secondary" />
                    <div>
                      <p className="text-xs text-text-secondary">Join Date</p>
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(formData.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

        </div>
      </motion.div>

      {/* Action Buttons */}
      {isEditing && (
        <motion.div variants={itemVariants} className="flex items-center justify-end gap-md pt-md border-t border-border">
          <Button variant="secondary" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            <Save className="h-5 w-5" />
            Save Changes
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
