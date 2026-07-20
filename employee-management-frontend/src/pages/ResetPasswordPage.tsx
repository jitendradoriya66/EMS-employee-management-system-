import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Alert } from '@/components/common/Alert'
import { motion } from 'framer-motion'
import { confirmPasswordReset } from '@/utils/api'

export const ResetPasswordPage: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>()
  const navigate = useNavigate()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!uid || !token) {
      setError('Invalid reset link')
      return
    }

    setLoading(true)
    try {
      await confirmPasswordReset(uid, token, password)
      setSubmitted(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.new_password?.[0] || 'Failed to reset password. The link might be expired or invalid.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-primary-100 dark:from-slate-950 dark:via-background dark:to-slate-900 flex items-center justify-center p-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-xl">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white mb-md"
          >
            {submitted ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <KeyRound className="h-8 w-8" />
            )}
          </motion.div>
          <h1 className="text-3xl font-bold text-text-primary">
            {submitted ? 'Password Reset' : 'Create New Password'}
          </h1>
          <p className="text-text-secondary mt-sm">
            {submitted
              ? 'Your password has been successfully reset. Redirecting...'
              : 'Enter your new password below'}
          </p>
        </div>

        <div className="card p-lg space-y-md shadow-lg border border-primary-100 dark:border-primary-900/30">
          {!submitted ? (
            <>
              {error && (
                <Alert variant="error" title="Error">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-md">
                <Input
                  type="password"
                  label="New Password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                
                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={loading}
                >
                  Reset Password
                </Button>
              </form>
            </>
          ) : (
            <Alert variant="success" title="Success">
              Your password has been updated. You will be redirected to the login page momentarily.
            </Alert>
          )}

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-sm text-primary-500 font-semibold hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
