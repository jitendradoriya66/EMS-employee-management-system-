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

interface SettingSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth()
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
}
