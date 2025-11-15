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
    pages: {
      total: 0,
      published: 0,
      draft: 0,
      archived: 0
    },
    users: {
      total: 0,
      active: 0,
      inactive: 0,
      byRole: {}
    },
    roles: {
      total: 0,
      active: 0,
      inactive: 0,
      byType: {}
    }
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

      // Process pages data
      const pagesData = pagesRes.data?.pages || pagesRes.data || []
      const pagesStats = {
        total: pagesData.length,
        published: pagesData.filter(page => page.published || page.isPublished).length,
        draft: pagesData.filter(page => !page.published && !page.isPublished && !page.archived).length,
        archived: pagesData.filter(page => page.archived).length
      }

      // Process users data
      const usersData = usersRes.data?.users || usersRes.data || []
      const usersByRole = {}
      usersData.forEach(user => {
        const roleName = user.role?.displayName || 'Unknown'
        usersByRole[roleName] = (usersByRole[roleName] || 0) + 1
      })

      const usersStats = {
        total: usersData.length,
        active: usersData.filter(user => user.active).length,
        inactive: usersData.filter(user => !user.active).length,
        byRole: usersByRole
      }

      // Process roles data
      const rolesData = rolesRes.data?.roles || rolesRes.data || []
      const rolesByType = {}
      rolesData.forEach(role => {
        const type = role.isDefault ? 'Default' : 'Custom'
        rolesByType[type] = (rolesByType[type] || 0) + 1
      })

      const rolesStats = {
        total: rolesData.length,
        active: rolesData.filter(role => role.isActive !== false).length, // Assuming roles are active by default
        inactive: rolesData.filter(role => role.isActive === false).length,
        byType: rolesByType
      }

      setStats({
        pages: pagesStats,
        users: usersStats,
        roles: rolesStats
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
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <FiLayers className="text-2xl text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pages</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stats.pages.total} total</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Published</span>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">{stats.pages.published}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Draft</span>
                    <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">{stats.pages.draft}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Archived</span>
                    <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">{stats.pages.archived}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FiUsers className="text-2xl text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Users</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stats.users.total} total</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">{stats.users.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Inactive</span>
                    <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">{stats.users.inactive}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">By Role:</p>
                    <div className="space-y-1">
                      {Object.entries(stats.users.byRole).slice(0, 2).map(([role, count]) => (
                        <div key={role} className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400 truncate mr-2">{role}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                      {Object.keys(stats.users.byRole).length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{Object.keys(stats.users.byRole).length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/roles">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <FiShield className="text-2xl text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Roles</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stats.roles.total} total</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">{stats.roles.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Inactive</span>
                    <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">{stats.roles.inactive}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">By Type:</p>
                    <div className="space-y-1">
                      {Object.entries(stats.roles.byType).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Common administrative tasks and system management
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/pages" className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group">
              <div className="flex items-center">
                <FiLayers className="text-2xl text-primary-600 dark:text-primary-400 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-700 dark:group-hover:text-primary-300">Manage Pages</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create and edit content pages</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/users" className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group">
              <div className="flex items-center">
                <FiUsers className="text-2xl text-purple-600 dark:text-purple-400 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-300">Manage Users</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User accounts and permissions</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/roles" className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors group col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <FiShield className="text-2xl text-yellow-600 dark:text-yellow-400 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-yellow-700 dark:group-hover:text-yellow-300">Manage Roles</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Roles and access permissions</p>
                </div>
              </div>
            </Link>
          </div>
        </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

