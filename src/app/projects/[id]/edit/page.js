'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import DynamicFormRenderer from '@/components/forms/DynamicFormRenderer'
import api from '@/lib/api'
import { FiArrowLeft } from 'react-icons/fi'

export default function ProjectEditPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { error, success } = useToast()
  
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

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
      const projectData = res.data.project
      
      // Check if user can edit
      const canEdit = projectData.createdBy === user.id || 
                     user.role?.permissions?.includes('*') || 
                     user.role?.permissions?.includes('projects.update.all')
      
      if (!canEdit) {
        error('You do not have permission to edit this project')
        router.push(`/projects/${params.id}`)
        return
      }
      
      setProject(projectData)
      setProjectTitle(projectData.title)
      setProjectDescription(projectData.description || '')
    } catch (err) {
      console.error('Error loading project:', err)
      error('Failed to load project')
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    if (!projectTitle.trim()) {
      error('Project title is required')
      return
    }

    try {
      await api.put(`/projects/${params.id}`, {
        title: projectTitle,
        description: projectDescription,
        data: formData,
        status: 'published'
      })
      
      success('Project updated successfully!')
      router.push(`/projects/${params.id}`)
    } catch (err) {
      error(err.response?.data?.error || 'Failed to update project')
    }
  }

  const handleSaveDraft = async (formData) => {
    if (!projectTitle.trim()) {
      error('Project title is required')
      return
    }

    try {
      await api.put(`/projects/${params.id}`, {
        title: projectTitle,
        description: projectDescription,
        data: formData,
        status: 'draft'
      })
      
      success('Draft saved successfully!')
      router.push(`/projects/${params.id}`)
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save draft')
    }
  }

  if (authLoading || loading) {
    return <Loading fullScreen />
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/projects/${params.id}`)}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Cancel
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Project</h1>
          <p className="text-gray-600">Update your project details</p>
        </div>

        <Card>
          {/* Project Title and Description */}
          <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter project title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Description
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Dynamic Form */}
          <DynamicFormRenderer
            form={project.form}
            initialData={project.data}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            mode="edit"
          />
        </Card>
      </main>
    </div>
  )
}

