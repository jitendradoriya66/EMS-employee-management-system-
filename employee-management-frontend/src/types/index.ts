export type UserRole = 'super_admin' | 'admin_hr' | 'employee'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type AccountStatus = 'active' | 'inactive'

export interface UserAccount {
  id: string
  name: string
  email: string
  password: string
  department: string
  role: UserRole | null
  approvalStatus: ApprovalStatus
  accountStatus: AccountStatus
  registrationDate: string
  lastLogin: string | null
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
  startDate: string
  status: 'active' | 'inactive' | 'on-leave'
  avatar?: string
  salary?: number
  manager?: string
  team?: string[]
  performanceScore?: number
  projects?: Array<{ name: string; progress: number; role: string }>
  attendanceLog?: Array<{
    date: string
    checkIn: string
    checkOut: string
    hoursWorked: number
    status: 'present' | 'late' | 'leave'
  }>
}

export interface EmployeeFilters {
  search: string
  department: string
  status: 'active' | 'inactive' | 'on-leave' | 'all'
  sortBy: 'name' | 'date' | 'department'
  sortOrder: 'asc' | 'desc'
}

export interface CreateEmployeeInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
  startDate: string
  manager?: string
}

export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
  totalPages: number
}
