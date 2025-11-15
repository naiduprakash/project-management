'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import DataTable from '@/components/common/DataTable'
import GridCard from '@/components/common/GridCard'
import api from '@/lib/api'
import { FiPlus, FiEdit, FiTrash2, FiEye, FiDownload } from 'react-icons/fi'
import { formatDate, downloadCSV } from '@/lib/utils'
import Link from 'next/link'

export default function ProjectsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { error, success } = useToast()
  
  const [projects, setProjects] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [forms, setForms] = useState([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      loadForms()
      loadProjects()
    }
  }, [user, authLoading, router])

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
        limit: '10'
      })

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

  const renderProjectCard = (project) => (
    <Card key={project.id} padding={false} className="hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="p-4 sm:p-6 flex flex-col h-full">
        <div className="flex-1 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{project.title}</h3>
          {project.description && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{project.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              project.status === 'published' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
              project.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              {project.status}
            </span>
            {project.form?.title && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 line-clamp-1">
                {project.form.title}
              </span>
            )}
          </div>

          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <p>By {project.creator?.name || 'Unknown'}</p>
            <p>{formatDate(project.createdAt)}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/projects/${project.id}`)}
            className="flex-1 min-h-[40px] sm:min-h-[32px]"
            title="View"
          >
            <FiEye className="mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/projects/${project.id}/edit`)}
            className="flex-1 min-h-[40px] sm:min-h-[32px]"
            title="Edit"
          >
            <FiEdit className="mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(project.id, project.title)}
            className="flex-1 min-h-[40px] sm:min-h-[32px]"
            title="Delete"
          >
            <FiTrash2 className="mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>
    </Card>
  )

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Projects</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage and track your projects</p>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={projects.length === 0}
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[32px]"
            >
              <FiDownload className="mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Link href="/projects/new" className="flex-1 sm:flex-none">
              <Button className="w-full min-h-[44px] sm:min-h-[32px]">
                <FiPlus className="mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">New Project</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        </div>


        {/* Projects List */}
        <DataTable
          title={null}
          description={null}
          data={projects}
          loading={loading}
          searchPlaceholder="Search projects..."
          searchKeys={['title', 'description']}

          columns={[
            {
              header: 'Title',
              accessor: 'title',
              render: (project) => (
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{project.title}</p>
                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
                  )}
                </div>
              )
            },
            {
              header: 'Status',
              accessor: 'status',
              render: (project) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                  project.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {project.status}
                </span>
              )
            },
            {
              header: 'Creator',
              accessor: 'creator.name',
              render: (project) => <span className="text-gray-600 dark:text-gray-400">{project.creator?.name || 'Unknown'}</span>
            },
            {
              header: 'Created',
              accessor: 'createdAt',
              render: (project) => <span className="text-gray-600 dark:text-gray-400">{formatDate(project.createdAt)}</span>
            },
            {
              header: 'Actions',
              align: 'right',
              noWrap: true,
              render: (project) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/projects/${project.id}`)}
                    title="View"
                  >
                    <FiEye />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/projects/${project.id}/edit`)}
                    title="Edit"
                  >
                    <FiEdit />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(project.id, project.title)}
                    title="Delete"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              )
            }
          ]}

          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' }
              ]
            }
          ]}

          emptyMessage="No projects found"
          emptyActionText="Create First Project"
          onEmptyAction={() => router.push('/projects/new')}
          defaultView="list"
          gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

          // Grid view card renderer
          renderCard={(project) => (
            <GridCard
              title={project.title}
              description={project.description}
              badges={[
                {
                  label: project.status,
                  className: project.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }
              ]}
              metadata={[
                { label: 'Creator', value: project.creator?.name || 'Unknown' },
                { label: 'Created', value: formatDate(project.createdAt) }
              ]}
              actions={[
                {
                  label: 'View',
                  icon: FiEye,
                  onClick: () => router.push(`/projects/${project.id}`)
                },
                {
                  label: 'Edit',
                  icon: FiEdit,
                  onClick: () => router.push(`/projects/${project.id}/edit`)
                },
                {
                  label: 'Delete',
                  icon: FiTrash2,
                  onClick: () => handleDelete(project.id, project.title),
                  variant: 'danger'
                }
              ]}
            />
          )}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card className="mt-6">
            <div className="flex items-center justify-between">
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
          </Card>
        )}
      </main>
    </div>
  )
}

