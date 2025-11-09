'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import AdminLayout from '@/components/layout/AdminLayout'
import Card from '@/components/common/Card'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import FormBuilder from '@/components/admin/FormBuilder'
import api from '@/lib/api'
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi'
import Link from 'next/link'

export default function PageFormsPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading, hasRole } = useAuth()
  const { error, success } = useToast()
  
  const [page, setPage] = useState(null)
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingForm, setEditingForm] = useState(null)

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
      setPage(res.data.page)
      setForms(res.data.page.forms || [])
    } catch (err) {
      console.error('Error loading page:', err)
      error('Failed to load page')
      router.push('/admin/pages')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForm = () => {
    setEditingForm(null)
    setShowBuilder(true)
  }

  const handleEditForm = (form) => {
    setEditingForm(form)
    setShowBuilder(true)
  }

  const handleSaveForm = async (formData) => {
    try {
      if (editingForm) {
        await api.put(`/forms/${editingForm.id}`, formData)
        success('Form updated successfully')
      } else {
        await api.post('/forms', { ...formData, pageId: params.id })
        success('Form created successfully')
      }
      
      setShowBuilder(false)
      setEditingForm(null)
      loadPageAndForms()
    } catch (err) {
      error(err.response?.data?.error || 'Operation failed')
      throw err
    }
  }

  const handleDeleteForm = async (formId, formTitle) => {
    if (!confirm(`Are you sure you want to delete "${formTitle}"?`)) {
      return
    }

    try {
      await api.delete(`/forms/${formId}`)
      success('Form deleted successfully')
      loadPageAndForms()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete form')
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Loading fullScreen />
      </AdminLayout>
    )
  }

  if (showBuilder) {
    return (
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <FormBuilder
            initialData={editingForm}
            onSave={handleSaveForm}
            onCancel={() => {
              setShowBuilder(false)
              setEditingForm(null)
            }}
          />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/admin/pages"
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Pages
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{page?.title} - Forms</h1>
              <p className="text-gray-600">Manage forms for this page</p>
            </div>
            <Button onClick={handleCreateForm}>
              <FiPlus className="mr-2" />
              Create Form
            </Button>
          </div>
        </div>

        {forms.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No forms yet</p>
              <Button onClick={handleCreateForm}>
                <FiPlus className="mr-2" />
                Create Your First Form
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {forms.map(form => (
              <Card key={form.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{form.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{form.description}</p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{form.sections?.length || 0} sections</span>
                      <span>
                        {form.sections?.reduce((acc, s) => acc + (s.fields?.length || 0), 0) || 0} fields
                      </span>
                      {form.settings?.multiPage && (
                        <span className="text-primary-600 font-medium">Multi-page</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditForm(form)}
                    >
                      <FiEdit className="mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteForm(form.id, form.title)}
                    >
                      <FiTrash2 className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

