import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Alert } from '@/components/common/Alert'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format')
      return
    }

    setLoading(true)
    try {
      await register(firstName, lastName, email, phone, password)
      setSuccess('Registration successful! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
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
            <User className="h-8 w-8" />
          </motion.div>
          <h1 className="text-3xl font-bold text-text-primary">Create Account</h1>
          <p className="text-text-secondary mt-sm">Join Workforce Hub to manage your team</p>
        </div>

        <div className="card p-lg space-y-md shadow-lg border border-primary-100 dark:border-primary-900/30">
          {error && (
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" title="Success">
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="grid grid-cols-2 gap-sm">
              <div className="relative">
                <User className="absolute left-md top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                <Input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-3xl"
                  disabled={loading || !!success}
                />
              </div>
              <div className="relative">
                <User className="absolute left-md top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="pl-3xl"
                  disabled={loading || !!success}
                />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-md top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-3xl"
                disabled={loading || !!success}
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-md top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
              <Input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-3xl"
                disabled={loading || !!success}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-md top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-3xl"
                disabled={loading || !!success}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-md top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-3xl"
                disabled={loading || !!success}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
              disabled={!!success}
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="text-center text-sm">
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
