import React, { useState, useEffect, useRef } from 'react'
import { Menu, Bell, User, Settings, LogOut, CheckCircle2, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { formatDistanceToNow } from 'date-fns'
import { useTheme } from '@/contexts/ThemeContext'

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
  const { themeMode, setThemeMode } = useTheme()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  
  const notificationsRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { notifications, markAllAsRead } = useNotifications()
  
  const unreadCount = notifications.filter(n => !n.is_read).length

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
      setLogoutConfirmOpen(true)
    }
  }

  return (
    <>
      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        title="Sign Out"
        message="Are you sure you want to sign out of Workforce Hub? You will need to log in again to access your workspace."
        confirmText="Sign Out"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

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
            {/* Theme Toggle */}
            <button
              onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-md"
              aria-label="Toggle Theme"
            >
              {themeMode === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-md"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-card">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="fixed left-4 right-4 top-20 z-50 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-slate-900/20 md:absolute md:left-auto md:right-0 md:top-full md:mt-3 md:w-96 md:max-w-none">
                  <div className="flex items-start justify-between gap-md border-b border-border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-lg py-md text-white">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Activity center</p>
                      <h3 className="mt-xs text-lg font-bold text-white">Notifications</h3>
                      <p className="text-xs text-slate-300">{unreadCount} unread updates</p>
                    </div>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="rounded-full border border-white/10 bg-white/10 p-xs text-white transition-colors hover:bg-white/15"
                      aria-label="Close notifications"
                    >
                      <span className="block h-4 w-4 leading-none text-center">×</span>
                    </button>
                  </div>
                  
                  <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-md space-y-sm">
                    {notifications.length === 0 ? (
                      <div className="text-center py-xl text-text-secondary">
                        <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-medium">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`rounded-2xl border ${notif.is_read ? 'border-transparent bg-background/40' : 'border-primary-500/20 bg-background/80'} p-md shadow-sm backdrop-blur transition-colors`}
                        >
                          <div className="flex items-start gap-sm">
                            {!notif.is_read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm ${notif.is_read ? 'text-text-secondary font-medium' : 'text-text-primary font-bold'}`}>{notif.title}</p>
                              <p className="mt-1 text-sm text-text-secondary line-clamp-2">{notif.message}</p>
                              <p className="mt-2 text-xs font-medium text-text-secondary/70">
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {unreadCount > 0 && (
                    <div className="border-t border-border bg-background/60 p-md flex justify-center">
                      <button 
                        onClick={async () => {
                          await markAllAsRead()
                        }}
                        className="inline-flex items-center gap-xs rounded-full border border-border bg-card px-md py-sm text-xs font-semibold text-primary-600 transition-colors hover:bg-background hover:text-primary-700 w-full justify-center"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
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
                    <div className="mt-sm pt-sm border-t border-border">
                      <button
                        onClick={() => handleProfileClick('logout')}
                        className="w-full flex items-center gap-md rounded-2xl px-md py-sm text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
