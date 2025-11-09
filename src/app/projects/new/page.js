'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import DynamicFormRenderer from '@/components/forms/DynamicFormRenderer'
import api from '@/lib/api'

export default function NewProjectPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { error, success } = useToast()
  
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [selectedForm, setSelectedForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      loadPages()
    }
  }, [user, authLoading, router])

  const loadPages = async () => {
    try {
      setLoading(true)
      const res = await api.get('/pages?published=true')
      setPages(res.data.pages)
    } catch (err) {
      console.error('Error loading pages:', err)
      error('Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSelect = async (formId) => {
    try {
      setLoading(true)
      const res = await api.get(`/forms/${formId}`)
      setSelectedForm(res.data.form)
    } catch (err) {
      console.error('Error loading form:', err)
      error('Failed to load form')
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
      const res = await api.post('/projects', {
        formId: selectedForm.id,
        title: projectTitle,
        description: projectDescription,
        data: formData,
        status: 'published'
      })
      
      success('Project created successfully!')
      router.push(`/projects/${res.data.project.id}`)
    } catch (err) {
      error(err.response?.data?.error || 'Failed to create project')
    }
  }

  const handleSaveDraft = async (formData) => {
    if (!projectTitle.trim()) {
      error('Project title is required')
      return
    }

    try {
      const res = await api.post('/projects', {
        formId: selectedForm.id,
        title: projectTitle,
        description: projectDescription,
        data: formData,
        status: 'draft'
      })
      
      success('Draft saved successfully!')
      router.push(`/projects/${res.data.project.id}`)
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save draft')
    }
  }

  if (authLoading || loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-gray-600">Fill in the details to create a new project</p>
        </div>

        {!selectedForm ? (
          <Card>
            {/* Step 1: Select Page and Form */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select a Form</h2>
            
            {pages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No forms available yet</p>
                <p className="text-sm text-gray-500">Contact your administrator to create forms</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pages.map(page => (
                  <div key={page.id}>
                    <h3 className="font-semibold text-gray-900 mb-3">{page.title}</h3>
                    {page.description && (
                      <p className="text-sm text-gray-600 mb-3">{page.description}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {page.forms.map(form => (
                        <button
                          key={form.id}
                          onClick={() => {
                            setSelectedPage(page)
                            handleFormSelect(form.id)
                          }}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                        >
                          <h4 className="font-medium text-gray-900">{form.title}</h4>
                          {form.description && (
                            <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            {/* Step 2: Fill Project Details */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setSelectedForm(null)
                  setSelectedPage(null)
                }}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-4"
              >
                ← Change Form
              </button>
              
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedForm.title}
              </h2>
              
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
            </div>

            {/* Dynamic Form */}
            <DynamicFormRenderer
              form={selectedForm}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              mode="create"
            />
          </Card>
        )}
      </main>
    </div>
  )
}

