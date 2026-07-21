import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  variant?: 'danger' | 'warning' | 'info'
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'danger'
}) => {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          confirmClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
        }
      case 'warning':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          confirmClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
        }
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isLoading ? onCancel : undefined}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-card shadow-2xl border border-border"
        >
          <div className="p-xl space-y-lg">
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.iconBg}`}>
                <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
              </div>
              <button
                onClick={!isLoading ? onCancel : undefined}
                disabled={isLoading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              <p className="mt-sm text-sm text-text-secondary leading-relaxed">
                {message}
              </p>
            </div>

            <div className="flex gap-sm pt-sm">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 rounded-xl px-4 py-2 font-bold transition-all disabled:opacity-50 flex items-center justify-center shadow-lg ${styles.confirmClass}`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
