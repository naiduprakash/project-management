'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import api from '@/lib/api'
import { FiPlus, FiFileText, FiUsers, FiLayers } from 'react-icons/fi'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { error } = useToast()
  
  const [stats, setStats] = useState({
    projects: 0,
    pages: 0,
    forms: 0
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      loadDashboardData()
    }
  }, [user, authLoading, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load projects
      const projectsRes = await api.get('/projects?page=1&limit=5')
      setRecentProjects(projectsRes.data.projects)
      setStats(prev => ({ ...prev, projects: projectsRes.data.pagination.total }))
      
      // Load pages
      const pagesRes = await api.get('/pages?published=true')
      setStats(prev => ({ ...prev, pages: pagesRes.data.pages.length }))
      
      // Load forms
      const formsRes = await api.get('/forms')
      setStats(prev => ({ ...prev, forms: formsRes.data.forms.length }))
    } catch (err) {
      console.error('Error loading dashboard:', err)
      error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="px-3 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid - Mobile first: 1 column */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card padding={false}>
            <div className="flex items-center p-4 sm:p-6">
              <div className="p-2.5 sm:p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex-shrink-0">
                <FiFileText className="text-2xl sm:text-3xl text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.projects}</p>
              </div>
            </div>
          </Card>

          <Card padding={false}>
            <div className="flex items-center p-4 sm:p-6">
              <div className="p-2.5 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                <FiLayers className="text-2xl sm:text-3xl text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Available Pages</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pages}</p>
              </div>
            </div>
          </Card>

          <Card padding={false}>
            <div className="flex items-center p-4 sm:p-6">
              <div className="p-2.5 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                <FiUsers className="text-2xl sm:text-3xl text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Forms</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.forms}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Recent Projects</h2>
            <Link href="/projects/new">
              <Button size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-[32px]">
                <FiPlus className="mr-2" />
                New Project
              </Button>
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FiFileText className="mx-auto text-4xl sm:text-5xl text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">No projects yet</p>
              <Link href="/projects/new">
                <Button className="min-h-[44px]">Create Your First Project</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recentProjects.map(project => (
                <div
                  key={project.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-gray-800 gap-3"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">{project.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1 sm:line-clamp-2">{project.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Created by {project.creator?.name} • {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      project.status === 'published' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                      project.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

