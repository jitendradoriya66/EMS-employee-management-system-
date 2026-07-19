import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Employee, EmployeeFilters as IEmployeeFilters, CreateEmployeeInput } from '@/types'
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/utils/api'
import { Button } from '@/components/common/Button'
import { EmployeeList } from '@/components/employees/EmployeeList'
import { EmployeeFilters } from '@/components/employees/EmployeeFilters'
import { EmployeeForm } from '@/components/employees/EmployeeForm'
import { DeleteConfirmDialog } from '@/components/employees/DeleteConfirmDialog'
import { Alert } from '@/components/common/Alert'
import { useAsync, useDebounce } from '@/hooks'
import { AnimatePresence } from 'framer-motion'

interface EmployeesPageProps {
  setActiveNav?: (nav: string) => void
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ setActiveNav }) => {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filters, setFilters] = useState<IEmployeeFilters>({
    search: '',
    department: 'all',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const debouncedSearch = useDebounce(filters.search, 300)

  React.useEffect(() => {
    setActiveNav?.('employees')
  }, [setActiveNav])

  // Fetch employees
  const { loading: listLoading, error: listError, execute: refetch } = useAsync(
    async () => {
      const result = await fetchEmployees(
        {
          ...filters,
          search: debouncedSearch,
        },
        pagination
      )
      setEmployees(result.employees)
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: Math.ceil(result.total / prev.limit),
      }))
      return result
    },
    true
  )

  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleDepartmentChange = useCallback((department: string) => {
    setFilters(prev => ({ ...prev, department }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleStatusChange = useCallback((status: IEmployeeFilters['status']) => {
    setFilters(prev => ({ ...prev, status }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const handleItemsPerPageChange = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const handleAddEmployee = useCallback(() => {
    setEditingEmployee(null)
    setShowForm(true)
  }, [])

  const handleViewEmployee = useCallback((employee: Employee) => {
    navigate(`/employees/${employee.id}`)
  }, [navigate])

  const handleEditEmployee = useCallback((employee: Employee) => {
    setEditingEmployee(employee)
    setShowForm(true)
  }, [])

  const handleDeleteEmployee = useCallback((employee: Employee) => {
    setDeletingEmployee(employee)
  }, [])

  const handleFormSubmit = async (data: CreateEmployeeInput | Employee) => {
    setFormLoading(true)
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, data)
        setSuccessMessage('Employee updated successfully')
      } else {
        await createEmployee(data)
        setSuccessMessage('Employee added successfully')
      }
      setShowForm(false)
      setEditingEmployee(null)
      await refetch()
    } catch (error) {
}
