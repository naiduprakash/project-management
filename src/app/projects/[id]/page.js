'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import Avatar from '@/components/common/Avatar'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { FiEdit, FiTrash2, FiArrowLeft } from 'react-icons/fi'

export default function ProjectViewPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { error, success } = useToast()
  
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user && params.id) {
      loadProject()
    }
  }, [user, authLoading, router, params.id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/projects/${params.id}`)
      setProject(res.data.project)
    } catch (err) {
      console.error('Error loading project:', err)
      error('Failed to load project')
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project.title}"?`)) {
      return
    }

    try {
      await api.delete(`/projects/${params.id}`)
      success('Project deleted successfully')
      router.push('/projects')
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete project')
    }
  }

  const renderFieldValue = (field, value) => {
    if (!value) return <span className="text-gray-400">Not provided</span>

    switch (field.type) {
      case 'date':
        return formatDate(value)
      case 'select':
        if (field.multiSelect && Array.isArray(value)) {
          return value.map(v => {
            const option = field.options?.find(opt => opt.value === v)
            return option?.label || v
          }).join(', ')
        }
        const option = field.options?.find(opt => opt.value === value)
        return option?.label || value
      case 'textarea':
        return <div className="whitespace-pre-wrap">{value}</div>
      default:
        return value
    }
  }

  if (authLoading || loading) {
    return <Loading fullScreen />
  }

  if (!project) {
    return null
  }

  const canEdit = project.createdBy === user.id || user.role?.permissions?.includes('*') || 
                 user.role?.permissions?.includes('projects.update.all')
  const canDelete = project.createdBy === user.id || user.role?.permissions?.includes('*') || 
                   user.role?.permissions?.includes('projects.delete.all')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Projects
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'published' ? 'bg-green-100 text-green-800' :
                  project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-gray-600">{project.description}</p>
              )}
            </div>
            
            <div className="flex gap-2 mt-4 sm:mt-0">
              {canEdit && (
                <Button
                  onClick={() => router.push(`/projects/${params.id}/edit`)}
                  variant="outline"
                >
                  <FiEdit className="mr-2" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  onClick={handleDelete}
                  variant="danger"
                >
                  <FiTrash2 className="mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Project Meta */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Form</p>
              <p className="font-medium text-gray-900">{project.form?.title || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Created By</p>
              <div className="flex items-center gap-2">
                <Avatar name={project.creator?.name} size="sm" />
                <span className="font-medium text-gray-900">{project.creator?.name}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Created At</p>
              <p className="font-medium text-gray-900">{formatDate(project.createdAt, 'long')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="font-medium text-gray-900">{formatDate(project.updatedAt, 'long')}</p>
            </div>
          </div>
        </Card>

        {/* Project Data */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Project Details</h2>
          
          {(project.form?.sections || []).map((section, sectionIndex) => (
            <div key={section.id || sectionIndex} className="mb-8 last:mb-0">
              <div className="mb-4 pb-2 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(section.fields || []).map((field, fieldIndex) => {
                  // Check dependency
                  if (field.dependsOn) {
                    const dependentValue = project.data[field.dependsOn.field]
                    if (dependentValue !== field.dependsOn.value) {
                      return null
                    }
                  }

                  return (
                    <div key={field.name || fieldIndex} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <p className="text-sm font-medium text-gray-700 mb-1">{field.label}</p>
                      <div className="text-gray-900">
                        {renderFieldValue(field, project.data[field.name])}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>
      </main>
    </div>
  )
}

