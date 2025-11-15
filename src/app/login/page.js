'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const { success, error: showError } = useToast()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      router.push('/pages')
    }
  }, [user, router])

  const validate = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setLoading(true)
    const result = await login(formData.email, formData.password)
    setLoading(false)
    
    if (result.success) {
      success('Login successful!')
      router.push('/pages')
    } else {
      showError(result.error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-3 sm:px-4 py-6 sm:py-8">
      <Card className="w-full max-w-md">
        {/* Logo and App Name */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg flex-shrink-0">
            <span className="text-white font-bold text-2xl sm:text-3xl">P</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400 bg-clip-text text-transparent mb-1 sm:mb-2 text-center">
            ProjectHub
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">Project Management System</p>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Welcome Back</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            placeholder="Enter your email"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            placeholder="Enter your password"
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            className="min-h-[44px] sm:min-h-[auto]"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

