import React from 'react'
import { X } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { cn } from '@/utils/helpers'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, children }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static left-0 top-0 h-screen w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 transition-transform duration-300 z-50 no-print',
          'md:transform-none md:z-0 flex flex-col border-r border-slate-800/60 shadow-2xl shadow-slate-950/30',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-md md:hidden border-b border-slate-700">
          <h1 className="text-white font-bold">Workforce Hub</h1>
          <button
            onClick={onClose}
            className="p-xs hover:bg-slate-700 rounded transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <nav className="flex-1 min-h-0 p-sm overflow-y-auto flex flex-col no-scrollbar">
          {children}
        </nav>
      </aside>
    </>
  )
}

interface SidebarNavProps {
  children: React.ReactNode
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ children }) => {
  return (
    <ul className="space-y-[2px]">
      {children}
    </ul>
  )
}

interface SidebarNavItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href?: string
  isActive?: boolean
  onClick?: () => void
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon: Icon,
  label,
  href = '/',
  isActive,
  onClick,
}) => {
  const content = (
    <>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span>{label}</span>
    </>
  )

  const className = cn(
    'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-all duration-200',
    'text-slate-300 hover:bg-white/5 hover:text-white hover:translate-x-0.5',
    isActive && 'bg-white/10 text-white shadow-md shadow-black/10 ring-1 ring-white/10'
  )

  if (href) {
    return (
      <li>
        <RouterLink to={href} onClick={onClick} className={className}>
          <span className={cn('h-5 w-1 rounded-full bg-transparent transition-colors duration-200', isActive && 'bg-cyan-400')} />
          {content}
        </RouterLink>
      </li>
    )
  }

  return (
    <li>
      <button onClick={onClick} className={cn(className, 'w-full text-left')}>
        <span className={cn('h-5 w-1 rounded-full bg-transparent transition-colors duration-200', isActive && 'bg-cyan-400')} />
        {content}
      </button>
    </li>
  )
}
