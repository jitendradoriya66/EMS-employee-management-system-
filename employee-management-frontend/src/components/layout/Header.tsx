import React, { useState } from 'react'
import { Menu, Bell, User, Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'


interface HeaderProps {
  onMenuClick: () => void
  userName?: string
  userRole?: string
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  userName = 'John Doe',
  userRole = 'People Operations Admin',
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleProfileClick = (action: string) => {
    setProfileOpen(false)
    if (action === 'profile') {
      navigate('/profile')
    } else if (action === 'settings') {
      navigate('/settings')
    } else if (action === 'logout') {
      handleLogout()
    }
  }

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-card/90 no-print">
      <div className="h-16 px-md md:px-lg flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-md">
          <button
            onClick={onMenuClick}
            className="md:hidden p-xs hover:bg-background rounded transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-text-primary" />
          </button>
          <h1 className="hidden md:block text-xl font-bold text-text-primary">
            Workforce Hub
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-md">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-md"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="fixed left-4 right-4 top-20 z-50 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-slate-900/20 md:absolute md:left-auto md:right-0 md:top-full md:mt-3 md:w-96 md:max-w-none">
                <div className="flex items-start justify-between gap-md border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-lg py-md text-white">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Activity center</p>
                    <h3 className="mt-xs text-lg font-bold text-white">Notifications</h3>
                    <p className="text-xs text-slate-300">2 unread updates</p>
                  </div>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="rounded-full border border-white/10 bg-white/10 p-xs text-white transition-colors hover:bg-white/15"
                    aria-label="Close notifications"
                  >
                    <span className="block h-4 w-4 leading-none">×</span>
                  </button>
                </div>
                <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-md space-y-sm">
                  <div className="rounded-2xl border border-border bg-background/80 p-md shadow-sm backdrop-blur">
                    <div className="flex items-start gap-sm">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary">New employee added</p>
                        <p className="mt-xs text-sm text-text-secondary">John Smith joined the team</p>
                        <p className="mt-xs text-xs font-medium text-text-secondary">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/80 p-md shadow-sm backdrop-blur">
                    <div className="flex items-start gap-sm">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary">Leave approved</p>
                        <p className="mt-xs text-sm text-text-secondary">Your leave request has been approved</p>
                        <p className="mt-xs text-xs font-medium text-text-secondary">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border bg-background/60 p-md text-center">
                  <button 
                    onClick={() => {
                      setNotificationsOpen(false)
                      navigate('/announcements')
                    }}
                    className="inline-flex items-center gap-xs rounded-full border border-border bg-card px-md py-sm text-xs font-semibold text-primary-600 transition-colors hover:bg-background hover:text-primary-700"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-sm rounded-full border border-border bg-background/80 px-md py-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-md"
              aria-label="Profile menu"
            >
              <div className="hidden sm:flex items-center gap-sm">
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">{userName}</p>
                  <p className="text-xs text-text-secondary">{userRole}</p>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="fixed left-4 right-4 top-20 z-50 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-slate-900/20 md:absolute md:left-auto md:right-0 md:top-full md:mt-3 md:w-72 md:max-w-none">
                <div className="border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 px-lg py-md dark:from-slate-900 dark:to-slate-800">
                  <p className="text-sm font-semibold text-text-primary">{userName}</p>
                  <p className="text-xs text-text-secondary mt-xs">{userRole}</p>
                </div>
                <div className="p-sm">
                  <button
                    onClick={() => handleProfileClick('profile')}
                    className="w-full flex items-center gap-md rounded-2xl px-md py-sm text-sm text-text-primary transition-colors hover:bg-background"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </button>
                  <button
                    onClick={() => handleProfileClick('settings')}
                    className="w-full flex items-center gap-md rounded-2xl px-md py-sm text-sm text-text-primary transition-colors hover:bg-background"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => handleProfileClick('logout')}
                    className="mt-sm w-full border-t border-border px-md py-sm text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */} 
      {(notificationsOpen || profileOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setNotificationsOpen(false)
            setProfileOpen(false)
          }}
        />
      )}
    </header>
  )
}
