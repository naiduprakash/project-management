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
    <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
          {project.description && (
            <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              project.status === 'published' ? 'bg-green-100 text-green-800' :
              project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
            {project.form?.title && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {project.form.title}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-500">
            <p>By {project.creator?.name || 'Unknown'}</p>
            <p>{formatDate(project.createdAt)}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/projects/${project.id}`)}
            className="flex-1"
          >
            <FiEye className="mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/projects/${project.id}/edit`)}
            className="flex-1"
          >
            <FiEdit className="mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(project.id, project.title)}
            className="flex-1"
          >
            <FiTrash2 className="mr-1" />
            Delete
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

