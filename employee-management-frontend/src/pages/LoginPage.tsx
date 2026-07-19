import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Alert } from '@/components/common/Alert'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password) {
        setError('Please fill in all fields')
        return
      }
      await login(email, password, rememberMe)
      navigate('/dashboard')
    } catch (err) {
      setError('Login failed. Please try again.')
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
          <h1 className="text-3xl font-bold text-text-primary">Welcome Back</h1>
            <p className="text-text-secondary mt-sm">Sign in to your Workforce Hub account</p>
        </div>

        <div className="card p-lg space-y-md shadow-lg border border-primary-100 dark:border-primary-900/30">
            <div className="space-y-md">
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

            <div className="relative">
              <Lock className="absolute left-md top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-3xl"
                disabled={loading}
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-primary-500 focus:ring-primary-500 bg-background"
                />
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="flex items-center gap-md">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-text-secondary">Or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-sm text-center text-sm">
            <p className="text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-500 font-semibold hover:underline">
                Sign up
              </Link>
            </p>
            <Link to="/forgot-password" className="text-primary-500 font-semibold hover:underline block">
              Forgot password?
            </Link>
          </div>

          </div>
        </div>
      </motion.div>
    </div>
  )
}
