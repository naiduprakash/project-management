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

export default function EditEntryPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  
  const [page, setPage] = useState(null)
  const [entry, setEntry] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (params.slug && params.id) {
      loadData()
    }
  }, [params.slug, params.id, user])

  const loadData = async () => {
    try {
      // Load page
      const pagesResponse = await api.get('/pages')
      console.log('Pages response:', pagesResponse.data)
      
      // Handle both array and object response formats
      const pagesArray = Array.isArray(pagesResponse.data) ? pagesResponse.data : (pagesResponse.data.pages || [])
      const currentPage = pagesArray.find(p => p.slug === params.slug)
      
      console.log('Current page found:', currentPage)
      
      if (!currentPage || (!currentPage.isPublished && !currentPage.published)) {
        showError('Page not found')
        router.push('/')
        return
      }
      
      setPage(currentPage)
      
      // Load entry
      const entryResponse = await api.get(`/projects/${params.id}`)
      console.log('Entry response:', entryResponse.data)
      
      // Handle both direct object and wrapped response
      const entryData = entryResponse.data.project || entryResponse.data
      setEntry(entryData)
      
      // Find the form
      const entryForm = currentPage.forms?.find(f => f.id === entryData.formId)
      console.log('Form found:', entryForm)
      setForm(entryForm)
      
    } catch (err) {
      console.error('Failed to load entry:', err)
      showError('Failed to load entry')
      router.push(`/pages/${params.slug}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const updatedEntry = {
        ...entry,
        title: formData.title || entry.title,
        description: formData.description || entry.description,
        data: formData,
        status: 'published',
        updatedAt: new Date().toISOString()
      }
      
      await api.put(`/projects/${params.id}`, updatedEntry)
      success('Entry updated successfully!')
      router.push(`/pages/${params.slug}/${params.id}`)
    } catch (err) {
      showError('Failed to update entry')
    }
  }

  const handleSaveDraft = async (formData) => {
    try {
      const updatedEntry = {
        ...entry,
        title: formData.title || entry.title,
        description: formData.description || entry.description,
        data: formData,
        status: 'draft',
        updatedAt: new Date().toISOString()
      }
      
      await api.put(`/projects/${params.id}`, updatedEntry)
      success('Draft saved successfully!')
      router.push(`/pages/${params.slug}`)
    } catch (err) {
      showError('Failed to save draft')
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    )
  }

  if (!entry || !form) {
    return null
  }

  return (
    <MainLayout
      pageTitle="Edit Entry"
    >
      <div className="h-full flex flex-col">
        {/* Content Header with Breadcrumb */}
        <ContentHeader
          breadcrumbItems={[
            { label: page?.title || 'Loading...', href: `/pages/${params.slug}` },
            { label: entry?.title || 'Entry', href: `/pages/${params.slug}/${params.id}` },
            { label: 'Edit' }
          ]}
        />
        
        {/* Main Content with Form (actions at bottom) */}
        <div className="flex-1">
          <DynamicFormRenderer
            form={form}
            initialData={entry.data}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            mode="edit"
          />
        </div>
      </div>
    </MainLayout>
  )
}

