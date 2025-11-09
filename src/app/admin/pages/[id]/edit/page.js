'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import AdminLayout from '@/components/layout/AdminLayout'
import ContentHeader from '@/components/common/ContentHeader'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import FormBuilder from '@/components/admin/FormBuilder'
import FieldConfigPanel from '@/components/admin/FieldConfigPanel'
import api from '@/lib/api'
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiSave, FiEdit2 } from 'react-icons/fi'

export default function EditPagePage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading, hasRole } = useAuth()
  const { error, success } = useToast()
  
  const [page, setPage] = useState(null)
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingForm, setEditingForm] = useState(null)
  const [showPageConfig, setShowPageConfig] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!hasRole('admin')) {
        error('Access denied')
        router.push('/')
      } else {
        loadPageAndForms()
      }
    }
  }, [user, authLoading, router, params.id])

  const loadPageAndForms = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/pages/${params.id}`)
      const pageData = res.data
      setPage(pageData)
      
      const formsData = pageData.forms || []
      setForms(formsData)
      
      // Each page has exactly one form - edit it or create new
      setEditingForm(formsData.length > 0 ? formsData[0] : null)
    } catch (err) {
      console.error('Error loading page:', err)
      error('Failed to load page')
      router.push('/admin/pages')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveForm = async (formData) => {
    try {
      // Update page's published status based on form's published status
      await api.put(`/pages/${params.id}`, {
        isPublished: formData.published || false
      })
      
      // Update or create form
      if (editingForm) {
        // Update existing form
        await api.put(`/forms/${editingForm.id}`, formData)
        success(formData.published ? 'Page published successfully' : 'Page saved as draft')
      } else {
        // Create new form for this page
        await api.post('/forms', { ...formData, pageId: params.id })
        success(formData.published ? 'Page created and published' : 'Page created as draft')
      }
      
      // Go back to pages list after saving
      router.push('/admin/pages')
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save page')
      throw err
    }
  }

  const handleSavePageConfig = async (updatedConfig) => {
    try {
      await api.put(`/pages/${params.id}`, {
        title: updatedConfig.title,
        description: updatedConfig.description
      })
      
      // Update local page state
      setPage(prev => ({
        ...prev,
        title: updatedConfig.title,
        description: updatedConfig.description
      }))
      
      success('Page details updated successfully')
      setShowPageConfig(false)
    } catch (err) {
      error(err.response?.data?.error || 'Failed to update page details')
      throw err
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Loading fullScreen />
      </AdminLayout>
    )
  }

  // Removed separate FormBuilder view - now integrated inline

  return (
    <AdminLayout
      pageTitle={`Edit Page: ${page?.title || 'Loading...'}`}
    >
      <div className="h-full flex flex-col">
        {/* Content Header with Breadcrumb and Actions */}
        <ContentHeader
          breadcrumbItems={[
            { label: 'Admin', href: '/admin' },
            { label: 'Pages', href: '/admin/pages' },
            { label: page?.title || 'Edit Page' }
          ]}
          actions={
            <>
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/pages')}
              >
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('form-builder-submit')?.click()}
              >
                <FiSave className="mr-2" />
                Save as Draft
              </Button>
              <Button onClick={() => document.getElementById('form-builder-publish')?.click()}>
                <FiSave className="mr-2" />
                Save & Publish
              </Button>
            </>
          }
        />
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Form Builder (Always Shown) */}
            <FormBuilder
              form={editingForm}
              onSave={handleSaveForm}
              onCancel={() => router.push('/admin/pages')}
            />
          {/* Page Config Panel */}
          {showPageConfig && page && (
            <FieldConfigPanel
              type="page"
              field={{
                title: page.title,
                description: page.description
              }}
              onSave={handleSavePageConfig}
              onClose={() => setShowPageConfig(false)}
            />
          )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

