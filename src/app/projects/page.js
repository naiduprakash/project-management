'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import api from '@/lib/api'
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiFilter, FiDownload } from 'react-icons/fi'
import { formatDate, downloadCSV } from '@/lib/utils'
import Link from 'next/link'

export default function ProjectsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { error, success } = useToast()
  
  const [projects, setProjects] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    formId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [forms, setForms] = useState([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      loadForms()
      loadProjects()
    }
  }, [user, authLoading, router, page, filters])

  const loadForms = async () => {
    try {
      const res = await api.get('/forms')
      setForms(res.data.forms)
    } catch (err) {
      console.error('Error loading forms:', err)
    }
  }

  const loadProjects = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: searchTerm
      })

      if (filters.status) params.append('status', filters.status)
      if (filters.formId) params.append('formId', filters.formId)

      const res = await api.get(`/projects?${params}`)
      setProjects(res.data.projects)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error('Error loading projects:', err)
      error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (projectId, projectTitle) => {
    if (!confirm(`Are you sure you want to delete "${projectTitle}"?`)) {
      return
    }

    try {
      await api.delete(`/projects/${projectId}`)
      success('Project deleted successfully')
      loadProjects()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete project')
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    loadProjects()
  }

  const handleExport = () => {
    const exportData = projects.map(p => ({
      Title: p.title,
      Description: p.description,
      Status: p.status,
      Form: p.form?.title || 'N/A',
      Creator: p.creator?.name || 'N/A',
      Created: formatDate(p.createdAt)
    }))
    downloadCSV(exportData, 'projects-export.csv')
    success('Projects exported successfully')
  }

  if (authLoading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Manage and track your projects</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={projects.length === 0}
            >
              <FiDownload className="mr-2" />
              Export
            </Button>
            <Link href="/projects/new">
              <Button>
                <FiPlus className="mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                <FiSearch className="mr-2" />
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="mr-2" />
                Filters
              </Button>
            </div>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value })
                    setPage(1)
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form
                </label>
                <select
                  value={filters.formId}
                  onChange={(e) => {
                    setFilters({ ...filters, formId: e.target.value })
                    setPage(1)
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
                >
                  <option value="">All Forms</option>
                  {forms.map(form => (
                    <option key={form.id} value={form.id}>{form.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    setFilters({ ...filters, sortBy, sortOrder })
                    setPage(1)
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="updatedAt-desc">Recently Updated</option>
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Projects List */}
        <Card>
          {loading ? (
            <Loading />
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FiSearch className="mx-auto text-5xl text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No projects found</p>
              <Link href="/projects/new">
                <Button>Create Your First Project</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Form</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Creator</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => (
                      <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{project.title}</p>
                            <p className="text-sm text-gray-600">{project.description}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {project.form?.title || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'published' ? 'bg-green-100 text-green-800' :
                            project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {project.creator?.name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(project.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => router.push(`/projects/${project.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <FiEye />
                            </button>
                            <button
                              onClick={() => router.push(`/projects/${project.id}/edit`)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id, project.title)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {projects.map(project => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'published' ? 'bg-green-100 text-green-800' :
                        project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {project.form?.title || 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      By {project.creator?.name} • {formatDate(project.createdAt)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <FiEye className="mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/projects/${project.id}/edit`)}
                      >
                        <FiEdit className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(project.id, project.title)}
                      >
                        <FiTrash2 className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!pagination.hasPrev}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!pagination.hasNext}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </main>
    </div>
  )
}

