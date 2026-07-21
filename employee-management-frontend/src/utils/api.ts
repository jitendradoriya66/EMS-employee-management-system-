import { Employee } from '@/types'
import apiClient from './apiClient'

export const mapBackendEmployeeToFrontend = (backendEmp: any): Employee => {
  return {
    id: backendEmp.id.toString(),
    firstName: backendEmp.firstName,
    lastName: backendEmp.lastName,
    email: backendEmp.email,
    phone: backendEmp.phone || '',
    department: backendEmp.department || 'Unassigned',
    position: backendEmp.position || 'Employee',
    startDate: backendEmp.start_date ? backendEmp.start_date.split('T')[0] : '',
    status: backendEmp.status || 'active',
    avatar: `https://ui-avatars.com/api/?name=${backendEmp.firstName}+${backendEmp.lastName}`,
    salary: backendEmp.salary || 0,
    manager: backendEmp.manager || undefined,
    performanceScore: backendEmp.performance_score || 0,
    projects: backendEmp.projects || [],
    attendanceLog: backendEmp.attendanceLog || []
  }
}

export const fetchEmployees = async (
  filters?: any,
  pagination?: any
): Promise<{ employees: Employee[]; total: number; stats?: any }> => {
  try {
    const params = new URLSearchParams()
    
    if (pagination) {
      params.append('page', pagination.page.toString())
      params.append('page_size', pagination.limit.toString())
    }

    if (filters) {
      if (filters.search) params.append('search', filters.search)
      if (filters.department && filters.department !== 'all') params.append('department__name', filters.department)
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.sortBy) {
        let sortField = filters.sortBy
        if (sortField === 'name') sortField = 'firstName'
        if (filters.sortOrder === 'desc') sortField = `-${sortField}`
        params.append('ordering', sortField)
      }
    }

    const [empRes, statsRes] = await Promise.all([
      apiClient.get(`/api/v1/employees/?${params.toString()}`),
      apiClient.get(`/api/v1/employees/stats/?${params.toString()}`)
    ])

    const allEmployees = empRes.data.results || empRes.data
    const total = empRes.data.count || allEmployees.length
    const employees = (Array.isArray(allEmployees) ? allEmployees : []).map(mapBackendEmployeeToFrontend)
    
    return {
      employees,
      total,
      stats: statsRes.data
    }
  } catch (error) {
    console.error('Error fetching employees:', error)
    throw error
  }
}

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    const response = await apiClient.get(`/api/v1/employees/${id}/`);
    return mapBackendEmployeeToFrontend(response.data);
  } catch {
    return null;
  }
}

export const createEmployee = async (data: any): Promise<Employee> => {
  const payload = {
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    phone_number: data.phone || '',
    department_name: data.department || '',
    position: data.position || 'Employee',
    salary: data.salary || 0,
    start_date: data.startDate || new Date().toISOString().split('T')[0],
    status: data.status || 'active',
    role: data.role || 'employee',
  };
    const response = await apiClient.post('/api/v1/employees/create/', payload);
    return mapBackendEmployeeToFrontend(response.data);
}

export const updateEmployee = async (id: string, data: any): Promise<Employee> => {
  const payload: any = {}
  if (data.firstName) payload.first_name = data.firstName;
  if (data.lastName) payload.last_name = data.lastName;
  if (data.phone) payload.phone_number = data.phone;
  if (data.department) payload.department_name = data.department;
  if (data.position) payload.position = data.position;
  if (data.salary) payload.salary = data.salary;
  if (data.status) payload.status = data.status;

  const response = await apiClient.patch(`/api/v1/employees/${id}/`, payload);
  return mapBackendEmployeeToFrontend(response.data);
}

export const deleteEmployee = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/employees/${id}/`);
}

export const submitLeaveRequest = async (payload: { start_date: string, end_date: string, reason: string }) => {
  const response = await apiClient.post('/api/v1/leave/', payload);
  return response.data;
}

export const fetchDepartments = async () => {
  const response = await apiClient.get('/api/v1/departments/');
  return response.data.results || response.data;
}

export const fetchLeaveRequests = async () => {
  const response = await apiClient.get('/api/v1/leave/');
  return response.data.results || response.data;
}

export const approveLeaveRequest = async (id: string) => {
  const response = await apiClient.post(`/api/v1/leave/${id}/approve/`);
  return response.data;
}

export const rejectLeaveRequest = async (id: string) => {
  const response = await apiClient.post(`/api/v1/leave/${id}/reject/`);
  return response.data;
}

export const fetchPayslips = async () => {
  const response = await apiClient.get('/api/v1/payroll/payslips/');
  return response.data.results || response.data;
}

export const fetchProjects = async () => {
  const response = await apiClient.get('/api/v1/projects/');
  return response.data.results || response.data;
}

export const generatePayroll = async (month: number, year: number) => {
  const response = await apiClient.post('/api/v1/payroll/payslips/generate/', { month, year });
  return response.data;
}

export const approvePayslip = async (id: string) => {
  const response = await apiClient.post(`/api/v1/payroll/payslips/${id}/approve/`);
  return response.data;
}

export const requestPasswordReset = async (email: string) => {
  const response = await apiClient.post('/api/v1/auth/password-reset/', { email });
  return response.data;
}

export const confirmPasswordReset = async (uidb64: string, token: string, new_password: string) => {
  const response = await apiClient.post('/api/v1/auth/password-reset/confirm/', { uidb64, token, new_password });
  return response.data;
}
