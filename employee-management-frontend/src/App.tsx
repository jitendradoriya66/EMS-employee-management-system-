import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import type { UserRole } from '@/types'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Header } from '@/components/layout/Header'
import { Sidebar, SidebarNav, SidebarNavItem } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EmployeesPage } from '@/pages/EmployeesPage'
import { EmployeeDetailsPage } from '@/pages/EmployeeDetailsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AttendancePage } from '@/pages/AttendancePage'
import { ReportsPage } from '@/pages/ReportsPage'
import { LeavePage } from '@/pages/LeavePage'
import { PayrollPage } from '@/pages/PayrollPage'
import { LayoutDashboard, Users, Building2, Clock3, CalendarCheck2, DollarSign, FileText, ShieldCheck, Settings, UserCircle2, LogOut, Megaphone, CircleCheck, MessageSquare } from 'lucide-react'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { ApprovalsPage } from '@/pages/ApprovalsPage'
import { PendingApprovalPage } from '@/pages/PendingApprovalPage'
import { DepartmentsPage } from '@/pages/DepartmentsPage'
import { AnnouncementsPage } from '@/pages/AnnouncementsPage'
import { TeamManagementPage } from '@/pages/TeamManagementPage'

interface NavItemConfig {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin_hr: 'Admin / HR',
  employee: 'Employee',
}

const superAdminNavigation: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Employees', href: '/employees', icon: Users },
  { id: 'departments', label: 'Departments', href: '/departments', icon: Building2 },
  { id: 'attendance', label: 'Attendance', href: '/attendance', icon: Clock3 },
  { id: 'leave', label: 'Leave Management', href: '/leave', icon: CalendarCheck2 },
  { id: 'payroll', label: 'Payroll', href: '/payroll', icon: DollarSign },
  { id: 'reports', label: 'Reports', href: '/reports', icon: FileText },
  { id: 'users', label: 'User Management', href: '/users', icon: ShieldCheck },
  { id: 'approvals', label: 'Approvals', href: '/approvals', icon: CircleCheck },
  { id: 'announcements', label: 'Announcements', href: '/announcements', icon: Megaphone },
  { id: 'team', label: 'Team Management', href: '/team', icon: MessageSquare },
  { id: 'profile', label: 'Profile', href: '/profile', icon: UserCircle2 },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
]

const hrNavigation: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Employees', href: '/employees', icon: Users },
  { id: 'departments', label: 'Departments', href: '/departments', icon: Building2 },
  { id: 'attendance', label: 'Attendance', href: '/attendance', icon: Clock3 },
  { id: 'leave', label: 'Leave Management', href: '/leave', icon: CalendarCheck2 },
  { id: 'payroll', label: 'Payroll', href: '/payroll', icon: DollarSign },
  { id: 'reports', label: 'Reports', href: '/reports', icon: FileText },
  { id: 'announcements', label: 'Announcements', href: '/announcements', icon: Megaphone },
  { id: 'team', label: 'Team Management', href: '/team', icon: MessageSquare },
  { id: 'profile', label: 'Profile', href: '/profile', icon: UserCircle2 },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
]

const employeeNavigation: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'My Profile', href: '/profile', icon: UserCircle2 },
  { id: 'attendance', label: 'My Attendance', href: '/attendance', icon: Clock3 },
  { id: 'leave', label: 'My Leave', href: '/leave', icon: CalendarCheck2 },
  { id: 'payroll', label: 'My Payslips', href: '/payroll', icon: DollarSign },
  { id: 'announcements', label: 'Announcements', href: '/announcements', icon: Megaphone },
  { id: 'team', label: 'My Team', href: '/team', icon: MessageSquare },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
]

const routeToNavId: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/employees': 'employees',
  '/departments': 'departments',
  '/attendance': 'attendance',
  '/leave': 'leave',
  '/payroll': 'payroll',
  '/reports': 'reports',
  '/users': 'users',
  '/approvals': 'approvals',
  '/settings': 'settings',
  '/profile': 'profile',
  '/announcements': 'announcements',
  '/team': 'team',
}

function getNavIdFromPath(pathname: string) {
  const matchedPath = Object.keys(routeToNavId).find(path => pathname.startsWith(path))
  return matchedPath ? routeToNavId[matchedPath] : 'dashboard'
}

function RoleGate({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role ?? 'employee')) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const { isAuthenticated, logout, user } = useAuth()
  const [activeNav, setActiveNav] = useState('dashboard')
  const location = useLocation()

  useEffect(() => {
    setActiveNav(getNavIdFromPath(location.pathname))
  }, [location.pathname])

  const role = user?.role ?? 'employee'
  const navigationItems = useMemo(() => {
    if (role === 'super_admin') return superAdminNavigation
    if (role === 'admin_hr') return hrNavigation
    return employeeNavigation
  }, [role])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background print:block print:h-auto">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      >
        <div className="hidden md:block mb-lg">
          <div className="flex items-center gap-sm">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-cyan-400 flex items-center justify-center text-white font-extrabold shadow-lg shadow-primary-500/20">
              W
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">Workforce Hub</h1>
              <p className="text-slate-400 text-xs">Enterprise HRMS</p>
            </div>
          </div>
          <div className="mt-md inline-flex items-center gap-xs rounded-full border border-white/10 bg-white/5 px-sm py-xs text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {roleLabels[role]}
          </div>
        </div>

        <SidebarNav>
          {navigationItems.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              href={item.href}
              label={item.label}
              isActive={activeNav === item.id}
              onClick={() => {
                setActiveNav(item.id)
                setSidebarOpen(false)
              }}
            />
          ))}
        </SidebarNav>

        <div className="mt-auto pt-md border-t border-slate-700 p-sm">
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="w-full flex items-center gap-2 px-sm py-[6px] text-sm rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </Sidebar>

      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onCancel={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false)
          logout()
        }}
        title="Confirm Logout"
        message="Are you sure you want to sign out?"
        confirmText="Logout"
        variant="danger"
      />

      <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userName={user?.name || 'User'}
          userRole={roleLabels[role]}
        />

        <main className="flex-1 overflow-y-auto flex flex-col print:block print:overflow-visible">
          <div className="flex-1 p-md sm:p-lg md:p-xl print:p-0">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/employees" element={<RoleGate allowedRoles={['super_admin', 'admin_hr']}><EmployeesPage setActiveNav={setActiveNav} /></RoleGate>} />
              <Route path="/employees/:id" element={<RoleGate allowedRoles={['super_admin', 'admin_hr']}><EmployeeDetailsPage /></RoleGate>} />
              <Route path="/departments" element={<RoleGate allowedRoles={['super_admin', 'admin_hr']}><DepartmentsPage /></RoleGate>} />
              <Route path="/users" element={<RoleGate allowedRoles={['super_admin']}><UserManagementPage /></RoleGate>} />
              <Route path="/approvals" element={<RoleGate allowedRoles={['super_admin']}><ApprovalsPage /></RoleGate>} />
              <Route path="/analytics" element={<RoleGate allowedRoles={['super_admin', 'admin_hr']}><AnalyticsPage /></RoleGate>} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leave" element={<LeavePage />} />
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/reports" element={<RoleGate allowedRoles={['super_admin', 'admin_hr']}><ReportsPage /></RoleGate>} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/team" element={<TeamManagementPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
          {location.pathname !== '/team' && <Footer />}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
            <Route path="/pending-approval" element={<ProtectedRoute allowPendingApproval><PendingApprovalPage /></ProtectedRoute>} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
