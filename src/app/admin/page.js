'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import AdminLayout from '@/components/layout/AdminLayout'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import api from '@/lib/api'
import { FiPlus, FiLayers, FiFileText, FiUsers, FiShield } from 'react-icons/fi'
import Link from 'next/link'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading, hasRole } = useAuth()
  const { error } = useToast()
  
  const [stats, setStats] = useState({
    pages: 0,
    forms: 0,
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
      
      const [pagesRes, formsRes, usersRes, rolesRes] = await Promise.all([
        api.get('/pages'),
        api.get('/forms'),
        api.get('/users'),
        api.get('/roles')
      ])
      
      setStats({
        pages: pagesRes.data.pages.length,
        forms: formsRes.data.forms.length,
        users: usersRes.data.users.length,
        roles: rolesRes.data.roles.length
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
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage your system configuration and users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <FiLayers className="text-2xl text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pages}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiFileText className="text-2xl text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Forms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.forms}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiUsers className="text-2xl text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiShield className="text-2xl text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.roles}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pages & Forms */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pages & Forms</h2>
            <p className="text-gray-600 mb-6">
              Create and manage dynamic forms for your projects
            </p>
            <div className="space-y-3">
              <Link href="/admin/pages">
                <Button fullWidth variant="outline">
                  <FiLayers className="mr-2" />
                  Manage Pages
                </Button>
              </Link>
              <Link href="/admin/forms">
                <Button fullWidth variant="outline">
                  <FiFileText className="mr-2" />
                  Manage Forms
                </Button>
              </Link>
              <Link href="/admin/pages/new">
                <Button fullWidth>
                  <FiPlus className="mr-2" />
                  Create New Page
                </Button>
              </Link>
            </div>
          </Card>

          {/* Users & Roles */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Users & Roles</h2>
            <p className="text-gray-600 mb-6">
              Manage users, roles, and permissions
            </p>
            <div className="space-y-3">
              <Link href="/admin/users">
                <Button fullWidth variant="outline">
                  <FiUsers className="mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/roles">
                <Button fullWidth variant="outline">
                  <FiShield className="mr-2" />
                  Manage Roles
                </Button>
              </Link>
              <Link href="/admin/users/new">
                <Button fullWidth>
                  <FiPlus className="mr-2" />
                  Create New User
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

