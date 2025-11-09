'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import MainLayout from '@/components/layout/MainLayout'
import DynamicFormRenderer from '@/components/forms/DynamicFormRenderer'
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
      const currentPage = pagesResponse.data.find(p => p.slug === params.slug)
      
      if (!currentPage || !currentPage.isPublished) {
        showError('Page not found')
        router.push('/')
        return
      }
      
      setPage(currentPage)
      
      // Load entry
      const entryResponse = await api.get(`/projects/${params.id}`)
      setEntry(entryResponse.data)
      
      // Find the form
      const entryForm = currentPage.forms?.find(f => f.id === entryResponse.data.formId)
      setForm(entryForm)
      
    } catch (err) {
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
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/pages/${params.slug}/${params.id}`)}
            className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center"
          >
            ← Back to {entry.title || 'Entry'}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Entry
          </h1>
          {page?.description && (
            <p className="text-gray-600">{page.description}</p>
          )}
        </div>

        <DynamicFormRenderer
          form={form}
          initialData={entry.data}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          mode="edit"
        />
      </div>
    </MainLayout>
  )
}

