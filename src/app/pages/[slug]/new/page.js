'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import MainLayout from '@/components/layout/MainLayout'
import DynamicFormRenderer from '@/components/forms/DynamicFormRenderer'
import Loading from '@/components/common/Loading'
import Breadcrumb from '@/components/common/Breadcrumb'
import api from '@/lib/api'

export default function NewEntryPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  
  const [page, setPage] = useState(null)
  const [selectedForm, setSelectedForm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (params.slug) {
      loadPage()
    }
  }, [params.slug, user])

  const loadPage = async () => {
    try {
      const response = await api.get('/pages')
      const currentPage = response.data.find(p => p.slug === params.slug)
      
      if (!currentPage || !currentPage.isPublished) {
        showError('Page not found')
        router.push('/')
        return
      }
      
      setPage(currentPage)
      
      // Auto-select first form if only one exists
      if (currentPage.forms && currentPage.forms.length === 1) {
        setSelectedForm(currentPage.forms[0])
      }
    } catch (err) {
      showError('Failed to load page')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const entryData = {
        title: formData.title || `${page.title} Entry`,
        description: formData.description || '',
        formId: selectedForm.id,
        data: formData,
        status: 'published',
        createdBy: user.id
      }
      
      await api.post('/projects', entryData)
      success('Entry created successfully!')
      // Use replace and add timestamp to force reload
      router.push(`/pages/${params.slug}?refresh=${Date.now()}`)
    } catch (err) {
      showError('Failed to create entry')
      console.error('Submit error:', err)
    }
  }

  const handleSaveDraft = async (formData) => {
    try {
      const entryData = {
        title: formData.title || `${page.title} Draft`,
        description: formData.description || '',
        formId: selectedForm.id,
        data: formData,
        status: 'draft',
        createdBy: user.id
      }
      
      await api.post('/projects', entryData)
      success('Draft saved successfully!')
      // Use replace and add timestamp to force reload
      router.push(`/pages/${params.slug}?refresh=${Date.now()}`)
    } catch (err) {
      showError('Failed to save draft')
      console.error('Draft error:', err)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    )
  }

  if (!page) {
    return null
  }

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb 
          items={[
            { label: page?.title || 'Loading...', href: `/pages/${params.slug}` },
            { label: 'Create New Entry' }
          ]} 
        />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New {page.title} Entry
          </h1>
          {page.description && (
            <p className="text-gray-600">{page.description}</p>
          )}
        </div>

        {!selectedForm && page.forms && page.forms.length > 1 ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select a Form
              </h2>
              <div className="space-y-3">
                {page.forms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => setSelectedForm(form)}
                    className="w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-primary-50 hover:border-primary-500 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{form.title}</h3>
                    {form.description && (
                      <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : selectedForm ? (
          <DynamicFormRenderer
            form={selectedForm}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            mode="create"
          />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">
              No forms are available for this page yet.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

