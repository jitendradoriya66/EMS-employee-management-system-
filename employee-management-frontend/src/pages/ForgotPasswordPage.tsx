import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Alert } from '@/components/common/Alert'
import { motion } from 'framer-motion'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format')
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitted(true)
    } catch (err) {
      setError('Failed to send reset email. Please try again.')
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
        {/* Logo Section */}
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
              <Mail className="h-8 w-8" />
            )}
          </motion.div>
          <h1 className="text-3xl font-bold text-text-primary">
            {submitted ? 'Email Sent' : 'Reset Password'}
          </h1>
          <p className="text-text-secondary mt-sm">
            {submitted
              ? 'Check your email for password reset instructions'
              : 'Enter your email to receive reset instructions'}
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
                <div className="relative">
                  <Mail className="absolute left-md top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-3xl"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={loading}
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <Alert variant="success" title="Success">
              We've sent password reset instructions to <strong>{email}</strong>. Check your inbox and follow
              the link to reset your password.
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
