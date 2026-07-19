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
): Promise<{ employees: Employee[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/v1/employees/');
    const allEmployees = response.data.results || response.data;
    let result = (Array.isArray(allEmployees) ? allEmployees : []).map(mapBackendEmployeeToFrontend);

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(
        emp =>
          emp.firstName.toLowerCase().includes(search) ||
          emp.lastName.toLowerCase().includes(search) ||
          emp.email.toLowerCase().includes(search) ||
          emp.id.toLowerCase().includes(search) ||
          emp.department.toLowerCase().includes(search) ||
          emp.position.toLowerCase().includes(search)
      )
    }

    if (filters?.department && filters.department !== 'all') {
      result = result.filter(emp => emp.department === filters.department)
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter(emp => emp.status === filters.status)
    }

    if (filters?.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1
      result.sort((a, b) => {
        let aVal: any = a[filters.sortBy as keyof Employee] || ''
        let bVal: any = b[filters.sortBy as keyof Employee] || ''
        
        if (filters.sortBy === 'name') {
          aVal = `${a.firstName} ${a.lastName}`
          bVal = `${b.firstName} ${b.lastName}`
        } else if (filters.sortBy === 'date') {
          aVal = a.startDate
          bVal = b.startDate
        }
        
        if (typeof aVal === 'string') {
          return aVal.localeCompare(bVal) * sortOrder
        }
        return (aVal - bVal) * sortOrder
      })
    }

    const total = result.length
    const start = ((pagination?.page || 1) - 1) * (pagination?.limit || 10)
    const paginated = result.slice(start, start + (pagination?.limit || 10))

    return { employees: paginated, total }
  } catch (error) {
    console.error('Error fetching employees:', error);
    return { employees: [], total: 0 }
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
