'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import MainLayout from '@/components/layout/MainLayout'
import DynamicFormRenderer from '@/components/forms/DynamicFormRenderer'
import ContentHeader from '@/components/common/ContentHeader'
import Button from '@/components/common/Button'
import Loading from '@/components/common/Loading'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import api from '@/lib/api'

export default function ViewEntryPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  
  const [page, setPage] = useState(null)
  const [entry, setEntry] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug && params.id) {
      loadData()
    }
  }, [params.slug, params.id])

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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry?')) return
    
    try {
      await api.delete(`/projects/${params.id}`)
      success('Entry deleted successfully')
      router.push(`/pages/${params.slug}`)
    } catch (err) {
      showError('Failed to delete entry')
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
      pageTitle={entry.title || 'Untitled Entry'}
    >
      <div className="h-full flex flex-col">
        {/* Content Header with Breadcrumb and Actions */}
        <ContentHeader
          breadcrumbItems={[
            { label: page?.title || 'Loading...', href: `/pages/${params.slug}` },
            { label: entry?.title || 'View Entry' }
          ]}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/pages/${params.slug}/${params.id}/edit`)}
              >
                <FiEdit2 className="mr-2" />
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                <FiTrash2 className="mr-2" />
                Delete
              </Button>
            </>
          }
        />
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <DynamicFormRenderer
            form={form}
            initialData={entry.data}
            mode="view"
          />
        </div>
      </div>
    </MainLayout>
  )
}

