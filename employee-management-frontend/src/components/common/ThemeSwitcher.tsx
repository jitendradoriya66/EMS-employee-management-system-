import React from 'react'
import { Sun, MoonStar } from 'lucide-react'
import { useTheme, ThemeMode } from '@/contexts/ThemeContext'
import { cn } from '@/utils/helpers'

export const ThemeSwitcher: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme()

  const themes: { value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: MoonStar },
  ]

  return (
    <div className="space-y-md">
      <h3 className="text-sm font-semibold text-text-primary">Choose a Theme</h3>
      <div className="grid grid-cols-2 gap-md">
        {themes.map(t => {
          const Icon = t.icon
          const isActive = themeMode === t.value

          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setThemeMode(t.value)}
              className={cn(
                'flex flex-col items-center justify-center gap-sm p-md rounded-2xl border-2 transition-all duration-200',
                isActive
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-border bg-card text-text-secondary hover:border-primary-300'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
