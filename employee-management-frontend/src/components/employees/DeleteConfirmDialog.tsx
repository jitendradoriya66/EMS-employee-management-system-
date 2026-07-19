import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { motion } from 'framer-motion'

interface DeleteConfirmDialogProps {
  employeeName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  employeeName,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="card w-full max-w-md p-lg"
      >
        <div className="flex items-center justify-center mb-md">
          <div className="p-md bg-red-50 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>

        <h2 className="text-center text-lg font-bold text-text-primary mb-sm">
          Delete Employee?
        </h2>

        <p className="text-center text-text-secondary mb-lg">
          Are you sure you want to delete <span className="font-semibold">{employeeName}</span>?
          This action cannot be undone.
        </p>

        <div className="flex gap-md">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            className="flex-1"
            isLoading={isLoading}
          >
            Delete
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
