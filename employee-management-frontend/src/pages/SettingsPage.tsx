import React, { useState } from 'react'
import { Settings as SettingsIcon, Bell, Palette, LogOut } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher'
import { Alert } from '@/components/common/Alert'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import apiClient from '@/utils/apiClient'
import { useEffect } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

interface SettingSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export const SettingsPage: React.FC = () => {
  const { user, logout, updateCurrentUser } = useAuth()
  const role = user?.role ?? 'employee'
  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role !== 'employee'
  const { themeMode, resolvedTheme, accentColor, setAccentColor } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    language: 'en',
    notifications: {
      email: true,
    },
  })
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const { data } = await apiClient.get('/api/v1/settings/preferences/')
        if (data) {
          setFormData(prev => ({
            ...prev,
            notifications: { email: data.notifications_enabled }
          }))
        }
      } catch (err) {
        console.error('Failed to fetch preferences', err)
      }
    }
    fetchPrefs()
  }, [])

  const settings: SettingSection[] = [
    { id: 'profile', title: 'Profile', description: 'Manage your account', icon: SettingsIcon },
    { id: 'notifications', title: 'Notifications', description: 'Control alerts', icon: Bell },
    { id: 'appearance', title: 'Appearance', description: 'Theme & display', icon: Palette },
  ]

  const handleSave = async () => {
    setErrorMessage(null)
    setSaved(false)
    
    if (!formData.fullName.trim()) {
      setErrorMessage("Full Name is required.")
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address.")
      return
    }

    setSaving(true)
    try {
      const parts = formData.fullName.trim().split(' ')
      const first_name = parts[0] || ''
      const last_name = parts.slice(1).join(' ') || ''
      
      await Promise.all([
        apiClient.patch('/api/v1/users/me/', {
          first_name,
          last_name,
          email: formData.email
        }),
        apiClient.patch('/api/v1/settings/preferences/', {
          theme: themeMode,
          notifications_enabled: formData.notifications.email
        })
      ])
      
      updateCurrentUser({ name: formData.fullName.trim(), email: formData.email.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error('Failed to save settings', err)
      setErrorMessage(
        err.response?.data?.email?.[0] || 
        err.response?.data?.detail || 
        "Failed to save settings. Please try again."
      )
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-lg">
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Logout"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false)
          handleLogout()
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Header */}
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle mt-xs">{isSuperAdmin ? 'Manage account, theme, and global system controls' : isAdmin ? 'Manage account, preferences, and HR workspace settings' : 'Manage your account and self-service preferences'}</p>
      </div>

      {saved && (
        <Alert variant="success" title="Success">
          Your settings have been saved successfully.
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Error">
          {errorMessage}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg">
        {/* Sidebar */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="card p-sm space-y-sm">
            {settings.map(setting => {
              const Icon = setting.icon
              return (
                <button
                  key={setting.id}
                  onClick={() => setActiveTab(setting.id)}
                  className={`w-full text-left px-md py-sm rounded-lg transition-all duration-200 flex items-center gap-md ${
                    activeTab === setting.id
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{setting.title}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-3"
        >
          <div className="card p-lg space-y-lg">
            {activeTab === 'profile' && (
              <div className="space-y-md">
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-md">Profile Settings</h2>
                  <p className="text-sm text-text-secondary mb-lg">Update your personal information</p>
                </div>

                <div className="space-y-md">
                  <Input
                    label="Full Name"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Select
                    label="Default Language"
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                    ]}
                  />
                </div>

              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-md">
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-md">Notification Preferences</h2>
                  <p className="text-sm text-text-secondary mb-lg">Choose how you want to be notified</p>
                </div>

                <div className="space-y-md">
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                  ].map(notif => (
                    <label key={notif.key} className="flex items-center gap-md p-md bg-background rounded-lg border border-border cursor-pointer hover:bg-card transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.notifications[notif.key as keyof typeof formData.notifications]}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [notif.key]: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary">{notif.label}</p>
                        <p className="text-xs text-text-secondary">{notif.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-md">
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-md">Appearance</h2>
                  <p className="text-sm text-text-secondary mb-lg">Customize how the application looks</p>
                </div>

                <div className="space-y-lg">
                  <div>
                    <label className="text-sm font-semibold text-text-primary mb-md block">Application Theme</label>
                    <ThemeSwitcher />
                  </div>

                  <div className="pt-md border-t border-border space-y-md">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-text-primary">Accent Color</label>
                      {accentColor && (
                        <button
                          onClick={() => setAccentColor(null)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Reset to Theme Default
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-text-secondary">
                      Choose a preset accent color or click the custom picker to define a custom color brand.
                    </p>

                    {/* Predefined Presets */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-sm">
                      {[
                        { name: 'Indigo', value: '#4F46E5' },
                        { name: 'Emerald', value: '#10B981' },
                        { name: 'Violet', value: '#8B5CF6' },
                        { name: 'Orange', value: '#F97316' },
                        { name: 'Rose', value: '#F43F5E' },
                        { name: 'Cyan', value: '#06B6D4' },
                      ].map(preset => {
                        // Resolve active state
                        const resolvedActive = accentColor
                          ? accentColor.toLowerCase() === preset.value.toLowerCase()
                          : (resolvedTheme === 'light' && preset.name === 'Indigo') ||
                            (resolvedTheme === 'dark' && preset.name === 'Cyan')

                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setAccentColor(preset.value)}
                            className={`flex flex-col items-center justify-center p-sm rounded-2xl border-2 transition-all duration-200 ${
                              resolvedActive
                                ? 'border-primary bg-primary-50 text-primary-700'
                                : 'border-border bg-card text-text-secondary hover:border-primary-300'
                            }`}
                          >
                            <div
                              className="w-6 h-6 rounded-full border border-black/10 shadow-sm mb-xs"
                              style={{ backgroundColor: preset.value }}
                            />
                            <span className="text-xs font-medium">{preset.name}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Custom Color Picker */}
                    <div className="pt-sm">
                      <label
                        htmlFor="custom-accent-picker"
                        className="inline-flex items-center gap-md px-md py-sm bg-background rounded-lg border border-border cursor-pointer hover:bg-card hover:border-primary-300 transition-colors"
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-border shadow-sm flex-shrink-0"
                          style={{
                            backgroundColor: accentColor || (
                              resolvedTheme === 'light' ? '#4F46E5' : '#06B6D4'
                            )
                          }}
                        />
                        <div className="text-left">
                          <p className="text-xs font-semibold text-text-primary">Choose Custom Accent</p>
                          <p className="text-[10px] text-text-secondary">Click to open color picker</p>
                        </div>
                        <input
                          type="color"
                          id="custom-accent-picker"
                          className="sr-only"
                          value={accentColor || (
                            resolvedTheme === 'light' ? '#4F46E5' : '#06B6D4'
                          )}
                          onChange={(e) => setAccentColor(e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-lg border-t border-border">
              <Button
                variant="danger"
                className="gap-sm"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={saving}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
