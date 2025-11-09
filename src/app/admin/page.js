'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import AdminLayout from '@/components/layout/AdminLayout'
import ContentHeader from '@/components/common/ContentHeader'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import api from '@/lib/api'
import { FiLayers, FiUsers, FiShield } from 'react-icons/fi'
import Link from 'next/link'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading, hasRole } = useAuth()
  const { error } = useToast()
  
  const [stats, setStats] = useState({
    pages: 0,
    users: 0,
    roles: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!hasRole('admin')) {
        error('Access denied. Admin privileges required.')
        router.push('/')
      } else {
        loadStats()
      }
    }
  }, [user, authLoading, router])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      const [pagesRes, usersRes, rolesRes] = await Promise.all([
        api.get('/pages'),
        api.get('/users'),
        api.get('/roles')
      ])
      
      setStats({
        pages: (pagesRes.data?.length || pagesRes.data?.pages?.length || 0),
        users: (usersRes.data?.users?.length || 0),
        roles: (rolesRes.data?.roles?.length || 0)
      })
    } catch (err) {
      console.error('Error loading stats:', err)
      error('Failed to load admin stats')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Loading fullScreen />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      pageTitle="Admin Panel"
    >
      <div className="h-full flex flex-col">
        {/* Content Header with Breadcrumb */}
        <ContentHeader
          breadcrumbItems={[
            { label: 'Overview' }
          ]}
        />
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats - Clickable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/pages">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <FiLayers className="text-2xl text-primary-600 dark:text-primary-400" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pages}</p>
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FiUsers className="text-2xl text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.users}</p>
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/roles">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <FiShield className="text-2xl text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Roles & Permissions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.roles}</p>
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Activity or Additional Info */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">System Overview</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Manage your application settings, users, and content
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Published Pages</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pages}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.users}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Defined Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.roles}</p>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

