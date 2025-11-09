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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <FiFileText className="text-2xl text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.projects}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiLayers className="text-2xl text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Pages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pages}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiUsers className="text-2xl text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Forms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.forms}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
            <Link href="/projects/new">
              <Button size="sm">
                <FiPlus className="mr-2" />
                New Project
              </Button>
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="mx-auto text-5xl text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No projects yet</p>
              <Link href="/projects/new">
                <Button>Create Your First Project</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.title}</h3>
                    <p className="text-sm text-gray-600">{project.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created by {project.creator?.name} • {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'published' ? 'bg-green-100 text-green-800' :
                      project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
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

