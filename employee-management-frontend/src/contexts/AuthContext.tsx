import React, { createContext, useContext, useEffect, useState } from 'react'
import type { UserAccount, UserRole } from '@/types'
import apiClient from '@/utils/apiClient'
import { jwtDecode } from 'jwt-decode'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: UserAccount | null
  users: UserAccount[]
  fetchUsers: () => Promise<UserAccount[]>
  login: (email: string, password: string, rememberMe?: boolean) => Promise<UserAccount>
  register: (firstName: string, lastName: string, email: string, phone: string, password: string) => Promise<UserAccount>
  logout: () => void
  approveUser: (userId: string, role: UserRole) => void
  rejectUser: (userId: string) => void
  updateUserRole: (userId: string, role: UserRole) => void
  toggleUserStatus: (userId: string) => void
  deleteUser: (userId: string) => void
  updateUserDetails: (userId: string, data: { name: string; email: string; department: string }) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_STORAGE_KEY = 'rbac-session'

interface DecodedToken {
  user_id: number;
  exp: number;
}

// Helper to map backend User to frontend UserAccount
export const mapBackendUserToAccount = (backendUser: any): UserAccount => {
  return {
    id: backendUser.id.toString(),
    name: `${backendUser.first_name} ${backendUser.last_name}`.trim(),
    email: backendUser.email,
    password: '', // Don't store passwords in state
    department: 'Unassigned', // Backend doesn't provide this by default
    role: backendUser.is_superuser ? 'super_admin' : (backendUser.is_staff ? 'admin_hr' : 'employee'),
    approvalStatus: backendUser.is_active ? 'approved' : 'pending',
    accountStatus: backendUser.is_active ? 'active' : 'inactive',
    registrationDate: backendUser.date_joined || new Date().toISOString(),
    lastLogin: null, // Update if backend provides last_login
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/v1/users/');
      const allUsers = response.data.results || response.data;
      const backendUsers = Array.isArray(allUsers) ? allUsers : [];
      setUsers(backendUsers.map(mapBackendUserToAccount));
      return backendUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  const fetchCurrentUser = async (token: string, storage: Storage = localStorage): Promise<UserAccount | null> => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const userId = decoded.user_id;
      
      const backendUsers = await fetchUsers();
      
      const currentUser = backendUsers.find((u: any) => u.id === userId);
      
      if (currentUser) {
        const mappedUser = mapBackendUserToAccount(currentUser);
        setUser(mappedUser);
        setIsAuthenticated(true);
        storage.setItem(SESSION_STORAGE_KEY, mappedUser.email);
        
        return mappedUser;
      } else {
        throw new Error('User not found in list');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      logout();
      return null;
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const storage = localStorage.getItem('access_token') ? localStorage : (sessionStorage.getItem('access_token') ? sessionStorage : null);
      if (storage) {
        const token = storage.getItem('access_token');
        await fetchCurrentUser(token!, storage);
      }
      setIsLoading(false);
    }
    initializeAuth();
  }, [])


  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await apiClient.post('/api/v1/auth/login/', { email, password });
      const { access, refresh } = response.data;
      
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('access_token', access);
      storage.setItem('refresh_token', refresh);
      
      const loggedInUser = await fetchCurrentUser(access, storage);
      if (loggedInUser) {
        return loggedInUser;
      }
      // Fallback if fetchCurrentUser didn't return a user
      const tempUser: UserAccount = {
        id: 'temp',
        name: email.split('@')[0],
        email: email,
        password: '',
        department: 'Unassigned',
        role: 'employee',
        approvalStatus: 'approved',
        accountStatus: 'active',
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }
      return tempUser;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.detail || 'Invalid email or password');
    }
  }

  const register = async (firstName: string, lastName: string, email: string, phone: string, password: string) => {
    try {
      const payload = {
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        phone_number: phone || '+10000000000'
      };

      await apiClient.post('/api/v1/users/create/', payload);
      
      // Auto login after registration removed, returning null since we redirect to login
      return null as any;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.email?.[0] || error.response?.data?.phone_number?.[0] || 'Registration failed');
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setIsAuthenticated(false)
    setUser(null)
  }

  // These actions require admin backend endpoints, for now we mock them or leave them as local state updates
  // Since the user asked not to change the UI, we'll just keep the local state update for these
  const persistUser = (updatedUser: UserAccount) => {
    setUsers(previousUsers => previousUsers.map(account => account.id === updatedUser.id ? updatedUser : account))
    setUser(previousUser => (previousUser?.id === updatedUser.id ? updatedUser : previousUser))
  }

  const approveUser = async (userId: string, role: UserRole) => {
    try {
      const payload = {
        is_active: true,
        is_staff: role === 'super_admin' || role === 'admin_hr',
        is_superuser: role === 'super_admin',
      }
      await apiClient.patch(`/api/v1/users/${userId}/`, payload)
      
      const currentUser = users.find(account => account.id === userId)
      if (!currentUser) return
      const updatedUser: UserAccount = { ...currentUser, role, approvalStatus: 'approved', accountStatus: 'active' }
      persistUser(updatedUser)
    } catch (err) {
      console.error('Failed to approve user', err)
      // Optimistic update for demo
      const currentUser = users.find(account => account.id === userId)
      if (currentUser) {
        persistUser({ ...currentUser, role, approvalStatus: 'approved', accountStatus: 'active' })
      }
    }
  }

  const rejectUser = async (userId: string) => {
    try {
      await apiClient.patch(`/api/v1/users/${userId}/`, { is_active: false, is_staff: false, is_superuser: false })
      
      const currentUser = users.find(account => account.id === userId)
      if (!currentUser) return
      const updatedUser: UserAccount = { ...currentUser, role: null, approvalStatus: 'rejected', accountStatus: 'inactive' }
      persistUser(updatedUser)
    } catch (err) {
      console.error('Failed to reject user', err)
      const currentUser = users.find(account => account.id === userId)
      if (currentUser) {
        persistUser({ ...currentUser, role: null, approvalStatus: 'rejected', accountStatus: 'inactive' })
      }
    }
  }

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const payload = {
        is_staff: role === 'super_admin' || role === 'admin_hr',
        is_superuser: role === 'super_admin',
      }
      await apiClient.patch(`/api/v1/users/${userId}/`, payload)
      
      const currentUser = users.find(account => account.id === userId)
      if (!currentUser) return
      const updatedUser: UserAccount = { ...currentUser, role, approvalStatus: 'approved', accountStatus: 'active' }
      persistUser(updatedUser)
    } catch (err) {
      console.error('Failed to update role', err)
      const currentUser = users.find(account => account.id === userId)
      if (currentUser) {
        persistUser({ ...currentUser, role, approvalStatus: 'approved', accountStatus: 'active' })
      }
    }
  }

  const toggleUserStatus = async (userId: string) => {
    const currentUser = users.find(account => account.id === userId)
    if (!currentUser) return
    
    try {
      const newStatus = currentUser.accountStatus === 'active' ? 'inactive' : 'active'
      await apiClient.patch(`/api/v1/users/${userId}/`, { is_active: newStatus === 'active' })
      
      const updatedUser: UserAccount = { ...currentUser, accountStatus: newStatus }
      persistUser(updatedUser)
    } catch (err) {
      console.error('Failed to toggle status', err)
      const newStatus = currentUser.accountStatus === 'active' ? 'inactive' : 'active'
      persistUser({ ...currentUser, accountStatus: newStatus })
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      await apiClient.delete(`/api/v1/users/${userId}/`)
      setUsers(previousUsers => previousUsers.filter(account => account.id !== userId))
      if (user?.id === userId) logout()
    } catch (err) {
      console.error('Failed to delete user', err)
      setUsers(previousUsers => previousUsers.filter(account => account.id !== userId))
      if (user?.id === userId) logout()
    }
  }

  const updateUserDetails = async (userId: string, data: { name: string; email: string; department: string }) => {
    try {
      const parts = data.name.split(' ')
      const first_name = parts[0] || ''
      const last_name = parts.slice(1).join(' ') || ''
      await apiClient.patch(`/api/v1/users/${userId}/`, {
        first_name,
        last_name,
        email: data.email
      })
      const currentUser = users.find(account => account.id === userId)
      if (!currentUser) return
      const updatedUser: UserAccount = { ...currentUser, name: data.name, email: data.email, department: data.department }
      persistUser(updatedUser)
    } catch (err) {
      console.error('Failed to update user details', err)
      const currentUser = users.find(account => account.id === userId)
      if (currentUser) {
        persistUser({ ...currentUser, name: data.name, email: data.email, department: data.department })
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      users,
      fetchUsers,
      login,
      register,
      logout,
      approveUser,
      rejectUser,
      updateUserRole,
      toggleUserStatus,
      deleteUser,
      updateUserDetails,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
