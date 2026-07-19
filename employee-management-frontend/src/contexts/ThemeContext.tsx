import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeMode = 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  themeMode: ThemeMode
  resolvedTheme: ResolvedTheme
  setThemeMode: (theme: ThemeMode) => void
  accentColor: string | null
  setAccentColor: (color: string | null) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Helper to lighten/darken a hex color
function adjustColorBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace(/^\s*#|\s*$/g, '')
  let r = parseInt(cleanHex.substring(0, 2), 16)
  let g = parseInt(cleanHex.substring(2, 4), 16)
  let b = parseInt(cleanHex.substring(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return hex
  }

  r = Math.max(0, Math.min(255, r + percent))
  g = Math.max(0, Math.min(255, g + percent))
  b = Math.max(0, Math.min(255, b + percent))

  const rHex = r.toString(16).padStart(2, '0')
  const gHex = g.toString(16).padStart(2, '0')
  const bHex = b.toString(16).padStart(2, '0')

  return `#${rHex}${gHex}${bHex}`
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('themeMode') as ThemeMode | null
    return stored === 'dark' ? 'dark' : 'light'
  })

  const [accentColor, setAccentColorState] = useState<string | null>(() => {
    return localStorage.getItem('accentColor')
  })

  const resolvedTheme = useMemo<ResolvedTheme>(() => themeMode, [themeMode])

  useEffect(() => {
    // Update the document root with the resolved theme class.
    const root = document.documentElement
    root.classList.remove('theme-light', 'theme-dark', 'dark')
    root.classList.add(`theme-${resolvedTheme}`)
    root.dataset.theme = resolvedTheme
    root.style.colorScheme = resolvedTheme
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    }
    localStorage.setItem('themeMode', themeMode)
  }, [resolvedTheme, themeMode])

  useEffect(() => {
    const root = document.documentElement
    if (accentColor) {
      root.style.setProperty('--bg-primary', accentColor)
      root.style.setProperty('--bg-primary-600', adjustColorBrightness(accentColor, -15))
      root.style.setProperty('--bg-primary-700', adjustColorBrightness(accentColor, -30))
      root.style.setProperty('--bg-primary-50', adjustColorBrightness(accentColor, 160))
      root.style.setProperty('--bg-primary-100', adjustColorBrightness(accentColor, 125))
      localStorage.setItem('accentColor', accentColor)
    } else {
      root.style.removeProperty('--bg-primary')
      root.style.removeProperty('--bg-primary-50')
      root.style.removeProperty('--bg-primary-100')
      root.style.removeProperty('--bg-primary-600')
      root.style.removeProperty('--bg-primary-700')
      localStorage.removeItem('accentColor')
    }
  }, [accentColor, resolvedTheme])

  const setThemeMode = (newTheme: ThemeMode) => {
    setThemeModeState(newTheme)
  }

  const setAccentColor = (color: string | null) => {
    setAccentColorState(color)
  }

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
