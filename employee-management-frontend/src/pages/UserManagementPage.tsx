import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search,
  Filter,
  ShieldCheck,
  Users,
  Clock3,
  CircleCheck,
  CircleX,
  MoreVertical,
  Eye,
  Pencil,
  UserCog,
  Power,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  CalendarDays,
  Activity,
  Sparkles,
  Layers3,
  X,
  Save,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Alert } from '@/components/common/Alert'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { useAuth } from '@/contexts/AuthContext'
import type { UserAccount, UserRole } from '@/types'

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin_hr: 'Admin / HR',
  employee: 'Employee',
}

const roleOptions = [
  { value: 'all', label: 'All roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin_hr', label: 'Admin / HR' },
  { value: 'employee', label: 'Employee' },
]

const approvalOptions = [
  { value: 'all', label: 'All reviewed' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const accountOptions = [
  { value: 'all', label: 'All account states' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const roleSelectOptions = [
  { value: 'employee', label: 'Employee' },
  { value: 'admin_hr', label: 'Admin / HR' },
  { value: 'super_admin', label: 'Super Admin' },
]

function formatDate(value: string | null) {
  if (!value) {
    return 'Never'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function approvalBadgeVariant(status: UserAccount['approvalStatus']) {
  if (status === 'approved') {
    return 'success'
  }

  if (status === 'rejected') {
    return 'danger'
  }

  return 'warning'
}

function accountBadgeVariant(status: UserAccount['accountStatus']) {
  return status === 'active' ? 'success' : 'danger'
}

export const UserManagementPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [detailRoleSelection, setDetailRoleSelection] = useState<UserRole>('employee')
  const [toast, setToast] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null)
  const [userToChangeRole, setUserToChangeRole] = useState<UserAccount | null>(null)
  const [userToEdit, setUserToEdit] = useState<UserAccount | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', email: '', department: '' })
  
  const { users, fetchUsers, approveUser, rejectUser, toggleUserStatus, deleteUser, updateUserRole, updateUserDetails } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const pageSize = 8

  const orderedUsers = useMemo(() => {
    // Only show users that are NOT pending
    const reviewedUsers = users.filter(u => u.approvalStatus !== 'pending');
    return reviewedUsers.sort((left, right) => {
      return new Date(right.registrationDate || 0).getTime() - new Date(left.registrationDate || 0).getTime()
    })
  }, [users])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orderedUsers.filter(user => {
      const matchesSearch = !query || [user.name, user.email, user.department].some(field => field.toLowerCase().includes(query))
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesApproval = approvalFilter === 'all' || user.approvalStatus === approvalFilter
      const matchesAccount = accountFilter === 'all' || user.accountStatus === accountFilter
      return matchesSearch && matchesRole && matchesApproval && matchesAccount
    })
  }, [accountFilter, approvalFilter, orderedUsers, roleFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, approvalFilter, accountFilter])

  useEffect(() => {
    if (selectedUserId && !users.some(user => user.id === selectedUserId)) {
      setSelectedUserId(null)
    }
  }, [selectedUserId, users])

  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [currentPage, filteredUsers])

  const selectedUser = users.find(user => user.id === selectedUserId) ?? null
  useEffect(() => {
    if (selectedUser) {
      setDetailRoleSelection(selectedUser.role || 'employee')
    }
  }, [selectedUser])

  useEffect(() => {
    if (userToChangeRole) {
      setDetailRoleSelection(userToChangeRole.role || 'employee')
    }
  }, [userToChangeRole])

  const pendingUsers = users.filter(user => user.approvalStatus === 'pending')
  const stats = {
    total: users.length,
    pending: pendingUsers.length,
    approved: users.filter(user => user.approvalStatus === 'approved').length,
    inactive: users.filter(user => user.accountStatus === 'inactive').length,
  }

  const selectedUserMetrics = selectedUser
    ? [
        { label: 'Department', value: selectedUser.department || 'Unassigned' },
        { label: 'Role', value: selectedUser.role ? roleLabels[selectedUser.role] : 'Unassigned' },
        { label: 'Account', value: selectedUser.accountStatus === 'active' ? 'Active' : 'Inactive' },
      ]
    : []

  const handleDelete = (user: UserAccount) => {
    setUserToDelete(user)
    setOpenMenuId(null)
  }

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id)
      setUserToDelete(null)
      setSelectedUserId(null)
    }
  }

  const handleRowAction = (user: UserAccount, action: 'view' | 'edit' | 'role' | 'toggle' | 'delete' | 'approve' | 'reject') => {
    if (action === 'view') {
      setSelectedUserId(user.id)
      setOpenMenuId(null)
      return
    }

    if (action === 'edit') {
      setUserToEdit(user)
      setEditFormData({ name: user.name, email: user.email, department: user.department || 'Unassigned' })
      setOpenMenuId(null)
      return
    }

    if (action === 'role') {
      setUserToChangeRole(user)
      setOpenMenuId(null)
      return
    }

    if (action === 'toggle') {
      toggleUserStatus(user.id)
      setOpenMenuId(null)
      return
    }

    if (action === 'delete') {
      handleDelete(user)
      return
    }

    if (action === 'approve' || action === 'reject') {
      setSelectedUserId(user.id)
      setOpenMenuId(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-lg">
      <div className="flex flex-col gap-md lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">Security & access</p>
          <h1 className="section-title mt-xs">User Management</h1>
          <p className="section-subtitle mt-xs">Approve accounts, assign roles, and control access from one clean enterprise interface.</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Button variant="secondary" className="gap-sm" onClick={() => showToast('Filter presets are saved automatically.')}>
            <Filter className="h-4 w-4" />
            Saved filters
          </Button>
          <Button variant="primary" className="gap-sm" onClick={() => showToast('Copied invite link to clipboard!')}>
            <ShieldCheck className="h-4 w-4" />
            Invite administrator
          </Button>
        </div>
      </div>

      {toast && (
        <Alert variant="success" title="Notice" className="mb-md">
          {toast}
        </Alert>
      )}

      <div className="grid gap-md md:grid-cols-4">
        {[
          { label: 'Total users', value: stats.total, icon: Users },
          { label: 'Pending approval', value: stats.pending, icon: Clock3 },
          { label: 'Approved accounts', value: stats.approved, icon: CircleCheck },
          { label: 'Inactive accounts', value: stats.inactive, icon: CircleX },
        ].map(metric => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="card p-lg flex items-center justify-between gap-md">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{metric.label}</p>
                <p className="mt-sm text-2xl font-extrabold text-text-primary">{metric.value}</p>
              </div>
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )
        })}
      </div>

      <div className="space-y-lg">
        <div className="card p-lg space-y-md shadow-xl shadow-slate-900/5">
          <div className="flex flex-col gap-sm lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">All registered users</h2>
              <p className="text-sm text-text-secondary">Search, filter, and manage every account from one table.</p>
            </div>
            <Button variant="secondary" className="gap-sm" onClick={() => (window.location.href = '/approvals')}>
              <CircleCheck className="h-4 w-4" />
              Open approval queue
            </Button>
          </div>

            <div className="grid gap-md lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-md top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                <Input
                  placeholder="Search users by name, email, or department"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="pl-3xl"
                />
              </div>

              <Select
                value={roleFilter}
                onChange={event => setRoleFilter(event.target.value)}
                options={roleOptions}
                aria-label="Filter by role"
              />

              <Select
                value={approvalFilter}
                onChange={event => setApprovalFilter(event.target.value)}
                options={approvalOptions}
                aria-label="Filter by approval status"
              />

              <Select
                value={accountFilter}
                onChange={event => setAccountFilter(event.target.value)}
                options={accountOptions}
                aria-label="Filter by account status"
              />
            </div>
          </div>

        <div className="card overflow-hidden shadow-xl shadow-slate-900/5">
            <div className="border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-lg py-md text-white">
              <div className="flex items-center justify-between gap-md">
                <div>
                  <h2 className="text-xl font-bold">All registered users</h2>
                  <p className="text-sm text-slate-300">Search, filter, and manage every account from one table.</p>
                </div>
                <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-sm text-cyan-200 md:flex">
                  <Layers3 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-visible scrollbar-soft min-h-[350px] pb-16">
              <table className="min-w-[1080px] w-full divide-y divide-border text-left">
                <thead className="bg-background/80">
                  <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                    <th className="px-lg py-md">User</th>
                    <th className="px-lg py-md">Department</th>
                    <th className="px-lg py-md">Role</th>
                    <th className="px-lg py-md">Status</th>
                    <th className="px-lg py-md">Account</th>
                    <th className="px-lg py-md">Registration</th>
                    <th className="px-lg py-md">Last login</th>
                    <th className="px-lg py-md text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {visibleUsers.map(user => (
                    <tr key={user.id} className={`group transition-colors hover:bg-background/60 ${selectedUserId === user.id ? 'bg-primary-50/70 dark:bg-primary-500/10' : ''}`}>
                      <td className="px-lg py-md align-top">
                        <button className="flex items-center gap-sm text-left" onClick={() => setSelectedUserId(user.id)}>
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-sm font-bold text-primary-700 dark:bg-primary-500/15 dark:text-cyan-200">
                            {user.name
                              .split(' ')
                              .map(part => part.charAt(0))
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{user.name}</p>
                            <p className="mt-xs text-xs text-text-secondary">{user.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-lg py-md align-top">
                        <span className={`inline-flex items-center gap-xs rounded-full px-sm py-xs text-xs font-semibold ${user.department === 'HR' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' : user.department === 'Engineering' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                          <Building2 className="h-3.5 w-3.5" />
                          {user.department}
                        </span>
                      </td>
                      <td className="px-lg py-md align-top">
                        <Badge variant={user.role ? 'primary' : 'neutral'}>{user.role ? roleLabels[user.role] : 'Unassigned'}</Badge>
                      </td>
                      <td className="px-lg py-md align-top">
                        <Badge variant={approvalBadgeVariant(user.approvalStatus)}>
                          {user.approvalStatus === 'pending' ? 'Pending Approval' : user.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                        </Badge>
                      </td>
                      <td className="px-lg py-md align-top">
                        <Badge variant={accountBadgeVariant(user.accountStatus)}>
                          {user.accountStatus === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-lg py-md align-top text-sm text-text-secondary">
                        <div className="flex items-center gap-xs">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(user.registrationDate)}
                        </div>
                      </td>
                      <td className="px-lg py-md align-top text-sm text-text-secondary">
                        <div className="flex items-center gap-xs">
                          <Activity className="h-4 w-4" />
                          {formatDate(user.lastLogin)}
                        </div>
                      </td>
                      <td className="px-lg py-md align-top text-right">
                        <div className="relative inline-flex">
                          <Button variant="secondary" size="sm" className="gap-xs" onClick={() => setOpenMenuId(previous => previous === user.id ? null : user.id)}>
                            <MoreVertical className="h-4 w-4" />
                            Menu
                          </Button>
                          <AnimatePresence>
                            {openMenuId === user.id && (
                              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="relative z-10 w-full max-w-sm rounded-[32px] border border-border bg-card p-6 shadow-2xl"
                                >
                                  <div className="mb-4 pb-4 border-b border-border">
                                    <h3 className="text-lg font-semibold text-text-primary">Manage User</h3>
                                    <p className="text-sm text-text-secondary">{user.name}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <button onClick={() => handleRowAction(user, 'view')} className="flex w-full items-center gap-md rounded-2xl px-md py-md text-sm font-medium text-text-primary hover:bg-background transition-colors">
                                      <Eye className="h-5 w-5 text-text-secondary" /> View Profile
                                    </button>
                                    <button onClick={() => handleRowAction(user, 'edit')} className="flex w-full items-center gap-md rounded-2xl px-md py-md text-sm font-medium text-text-primary hover:bg-background transition-colors">
                                      <Pencil className="h-5 w-5 text-text-secondary" /> Edit User
                                    </button>
                                    <button onClick={() => handleRowAction(user, 'role')} className="flex w-full items-center gap-md rounded-2xl px-md py-md text-sm font-medium text-text-primary hover:bg-background transition-colors">
                                      <UserCog className="h-5 w-5 text-text-secondary" /> Change Role
                                    </button>
                                    <button onClick={() => handleRowAction(user, 'toggle')} className="flex w-full items-center gap-md rounded-2xl px-md py-md text-sm font-medium text-text-primary hover:bg-background transition-colors">
                                      <Power className="h-5 w-5 text-text-secondary" /> {user.accountStatus === 'active' ? 'Deactivate Account' : 'Activate Account'}
                                    </button>
                                    <button onClick={() => handleRowAction(user, 'delete')} className="flex w-full items-center gap-md rounded-2xl px-md py-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                      <Trash2 className="h-5 w-5" /> Delete User
                                    </button>
                                  </div>
                                  <div className="mt-6 pt-4 border-t border-border flex justify-end">
                                    <Button variant="secondary" onClick={() => setOpenMenuId(null)}>Close</Button>
                                  </div>
                                </motion.div>
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {visibleUsers.length === 0 && (
                    <tr>
                      <td className="px-lg py-xl text-center text-sm text-text-secondary" colSpan={8}>
                        No users match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-md border-t border-border px-lg py-md sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary">
                Showing <span className="font-semibold text-text-primary">{visibleUsers.length}</span> of <span className="font-semibold text-text-primary">{filteredUsers.length}</span> users
              </p>
              <div className="flex items-center gap-sm">
                <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setPage(previous => Math.max(1, previous - 1))} className="gap-xs">
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="rounded-full border border-border bg-background px-md py-xs text-sm font-semibold text-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>
                <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(previous => Math.min(totalPages, previous + 1))} className="gap-xs">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-md backdrop-blur-sm"
            onClick={() => setSelectedUserId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]"
              onClick={event => event.stopPropagation()}
            >
              <div className="flex-shrink-0 flex items-start justify-between gap-md border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-lg py-md text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">User details</p>
                  <h3 className="mt-xs text-2xl font-bold">{selectedUser.name}</h3>
                  <p className="text-sm text-slate-300">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="rounded-full border border-white/10 bg-white/10 p-sm text-white transition-colors hover:bg-white/15"
                  aria-label="Close user details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto">
                <div className="grid gap-lg p-lg lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-md">
                  <div className="rounded-3xl border border-border bg-background p-lg shadow-sm">
                    <div className="flex items-center gap-md">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-primary-700 text-lg font-bold text-white shadow-lg">
                        {selectedUser.name
                          .split(' ')
                          .map(part => part.charAt(0))
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold text-text-primary">{selectedUser.name}</p>
                        <p className="truncate text-sm text-text-secondary">{selectedUser.department || 'Unassigned department'}</p>
                      </div>
                    </div>

                    <div className="mt-md flex flex-wrap gap-sm">
                      <Badge variant={approvalBadgeVariant(selectedUser.approvalStatus)}>
                        {selectedUser.approvalStatus === 'pending' ? 'Pending' : selectedUser.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                      <Badge variant={accountBadgeVariant(selectedUser.accountStatus)}>
                        {selectedUser.accountStatus === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant={selectedUser.role ? 'primary' : 'neutral'}>
                        {selectedUser.role ? roleLabels[selectedUser.role] : 'Unassigned'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-sm sm:grid-cols-3">
                    {selectedUserMetrics.map(metric => (
                      <div key={metric.label} className="rounded-2xl border border-border bg-background px-md py-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{metric.label}</p>
                        <p className="mt-xs text-sm font-bold text-text-primary">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-md">
                  <div className="rounded-3xl border border-border bg-background p-lg shadow-sm">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-text-secondary">Activity details</h4>
                    <div className="mt-md grid gap-sm text-sm">
                      {[
                        { label: 'Registered', value: formatDate(selectedUser.registrationDate) },
                        { label: 'Last login', value: formatDate(selectedUser.lastLogin) },
                        { label: 'Role', value: selectedUser.role ? roleLabels[selectedUser.role] : 'Unassigned' },
                        { label: 'Department', value: selectedUser.department || 'Unassigned' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between gap-md rounded-2xl border border-border bg-card px-md py-sm">
                          <span className="text-text-secondary">{item.label}</span>
                          <span className="font-semibold text-text-primary text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border bg-slate-950 p-lg text-white shadow-lg">
                    <div className="flex items-center gap-sm text-cyan-300">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">Action summary</span>
                    </div>
                    <div className="mt-md space-y-sm text-sm text-slate-300">
                      <p>This modal replaces the inline details pane so the main table stays focused and scroll-free.</p>
                      <p>Use the action menu on the row to change role, activate, deactivate, or delete the account.</p>
                    </div>
                  </div>

                  {selectedUser.approvalStatus === 'pending' && (
  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-lg shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
    <div className="flex items-center gap-sm text-amber-700 dark:text-amber-300">
      <CircleCheck className="h-4 w-4" />
      <span className="text-xs font-semibold uppercase tracking-[0.24em]">
        Approve or Reject
      </span>
    </div>

    {/* Select Role */}
    <div className="mt-md">
      <label className="mb-2 block text-sm font-semibold text-text-primary">
        Assign Role
      </label>

      <Select
        value={detailRoleSelection}
        onChange={(event) =>
          setDetailRoleSelection(event.target.value as UserRole)
        }
        options={roleSelectOptions}
        aria-label="Assign Role"
      />
    </div>

    {/* Buttons */}
    <div className="mt-md grid gap-sm sm:grid-cols-2">
      <Button
        variant="primary"
        className="gap-sm"
        onClick={() =>
          approveUser(selectedUser.id, detailRoleSelection)
        }
      >
        <CircleCheck className="h-4 w-4" />
        Approve Request
      </Button>

      <Button
        variant="secondary"
        className="gap-sm"
        onClick={() => rejectUser(selectedUser.id)}
      >
        <CircleX className="h-4 w-4" />
        Reject Request
      </Button>
    </div>
  </div>
)}
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {userToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-md backdrop-blur-sm"
              onClick={() => setUserToDelete(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                className="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card p-xl shadow-2xl"
                onClick={event => event.stopPropagation()}
              >
                <div className="flex items-center gap-md text-red-500">
                  <Trash2 className="h-6 w-6" />
                  <h3 className="text-xl font-bold">Delete User</h3>
                </div>
                <p className="mt-md text-text-secondary">
                  Are you sure you want to delete <strong>{userToDelete.name}</strong>? This action cannot be undone.
                </p>
                <div className="mt-xl flex justify-end gap-sm">
                  <Button variant="secondary" onClick={() => setUserToDelete(null)}>Cancel</Button>
                  <Button variant="primary" className="bg-red-500 hover:bg-red-600 border-red-500 text-white" onClick={confirmDelete}>Delete</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Change Role Modal */}
        <AnimatePresence>
          {userToChangeRole && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-md backdrop-blur-sm"
              onClick={() => setUserToChangeRole(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                className="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card p-xl shadow-2xl"
                onClick={event => event.stopPropagation()}
              >
                <div className="flex items-center gap-md text-cyan-400">
                  <UserCog className="h-6 w-6" />
                  <h3 className="text-xl font-bold">Change Role</h3>
                </div>
                <p className="mt-sm text-text-secondary">Select a new role for <strong>{userToChangeRole.name}</strong>.</p>
                <div className="mt-lg">
                  <Select
                    value={detailRoleSelection}
                    onChange={event => setDetailRoleSelection(event.target.value as UserRole)}
                    options={roleSelectOptions}
                    aria-label="Assign Role"
                  />
                </div>
                <div className="mt-xl flex justify-end gap-sm">
                  <Button variant="secondary" onClick={() => setUserToChangeRole(null)}>Cancel</Button>
                  <Button variant="primary" onClick={() => {
                    updateUserRole(userToChangeRole.id, detailRoleSelection)
                    setUserToChangeRole(null)
                    showToast(`Role updated successfully.`)
                  }}>Save Role</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit User Modal */}
        <AnimatePresence>
          {userToEdit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-md backdrop-blur-sm"
              onClick={() => setUserToEdit(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                className="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card p-xl shadow-2xl"
                onClick={event => event.stopPropagation()}
              >
                <div className="flex items-center gap-md text-primary-500 mb-lg">
                  <Pencil className="h-6 w-6" />
                  <h3 className="text-xl font-bold">Edit User Details</h3>
                </div>
                
                <div className="space-y-md">
                  <Input
                    label="Full Name"
                    value={editFormData.name}
                    onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={editFormData.email}
                    onChange={e => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    label="Department"
                    value={editFormData.department}
                    onChange={e => setEditFormData(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>

                <div className="mt-xl flex justify-end gap-sm">
                  <Button variant="secondary" onClick={() => setUserToEdit(null)}>Cancel</Button>
                  <Button variant="primary" className="gap-sm" onClick={() => {
                    updateUserDetails(userToEdit.id, editFormData)
                    setUserToEdit(null)
                    showToast('User details updated successfully.')
                  }}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.div>
  )
}
