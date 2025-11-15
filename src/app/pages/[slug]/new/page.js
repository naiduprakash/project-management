'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import MainLayout from '@/components/layout/MainLayout'
import DynamicFormRenderer from '@/components/forms/DynamicFormRenderer'
import ContentHeader from '@/components/common/ContentHeader'
import Loading from '@/components/common/Loading'
import api from '@/lib/api'

export default function NewEntryPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  
  const [page, setPage] = useState(null)
  const [selectedForm, setSelectedForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creatingForm, setCreatingForm] = useState(false)

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

      // Handle forms
      if (currentPage.forms && currentPage.forms.length > 0) {
        // Auto-select first form (every page should have only one form)
        setSelectedForm(currentPage.forms[0])
      } else {
        // No forms exist - create default form
        setCreatingForm(true)
        try {
          const defaultFormData = {
            pageId: currentPage.id,
            title: `${currentPage.title} Form`,
            description: `Default form for ${currentPage.title} page`,
            sections: [
              {
                id: 'default-section',
                title: 'Basic Information',
                type: 'section',
                fields: [
                  {
                    id: 'entry-title',
                    type: 'text',
                    label: 'Entry Title',
                    name: 'title',
                    required: true,
                    placeholder: 'Enter a title for this entry',
                    columnSpan: { mobile: 12, tablet: 12, desktop: 12 }
                  },
                  {
                    id: 'entry-description',
                    type: 'textarea',
                    label: 'Entry Description',
                    name: 'description',
                    required: false,
                    placeholder: 'Enter a description (optional)',
                    columnSpan: { mobile: 12, tablet: 12, desktop: 12 }
                  }
                ]
              }
            ],
            settings: {
              multiPage: false,
              showProgressBar: false,
              allowSaveDraft: true
            },
            published: true
          }

          const formResponse = await api.post('/forms', defaultFormData)
          const newForm = formResponse.data.form

          // Update page with the new form
          setPage({ ...currentPage, forms: [newForm] })
          setSelectedForm(newForm)
          setCreatingForm(false)
        } catch (formError) {
          console.error('Failed to create default form:', formError)
          setCreatingForm(false)
          showError('Failed to create form for this page')
          router.push('/')
          return
        }
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

  if (loading || creatingForm) {
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
    <MainLayout
      pageTitle={`Create New ${page.title} Entry`}
    >
      <div className="h-full flex flex-col">
        {/* Content Header with Breadcrumb */}
        <ContentHeader
          breadcrumbItems={[
            { label: page?.title || 'Loading...', href: `/pages/${params.slug}` },
            { label: 'Create New Entry' }
          ]}
        />
        
        {/* Main Content */}
        <div className="flex-1 min-h-0">
          {selectedForm ? (
            <div className="h-full">
              <DynamicFormRenderer
                form={selectedForm}
                onSubmit={handleSubmit}
                onSaveDraft={handleSaveDraft}
                mode="create"
              />
            </div>
          ) : (
            <div className="px-4 sm:px-6 lg:px-8 py-8 h-full flex items-center justify-center">
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600">
                  No forms are available for this page yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

