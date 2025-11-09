'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import AdminLayout from '@/components/layout/AdminLayout'
import DataTable from '@/components/common/DataTable'
import GridCard from '@/components/common/GridCard'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Input from '@/components/common/Input'
import api from '@/lib/api'
import { FiEdit, FiTrash2, FiEye, FiEyeOff, FiFileText } from 'react-icons/fi'
import Link from 'next/link'

export default function AdminPagesPage() {
  const router = useRouter()
  const { user, loading: authLoading, hasRole } = useAuth()
  const { error, success } = useToast()
  
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPage, setEditingPage] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'document',
    published: false
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!hasRole('admin')) {
        error('Access denied')
        router.push('/')
      } else {
        loadPages()
      }
    }
  }, [user, authLoading, router])

  const loadPages = async () => {
    try {
      setLoading(true)
      const res = await api.get('/pages')
      setPages(res.data || [])
    } catch (err) {
      console.error('Error loading pages:', err)
      error('Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (page = null) => {
    if (page) {
      setEditingPage(page)
      setFormData({
        title: page.title,
        description: page.description || '',
        icon: page.icon || 'document',
        published: page.published
      })
    } else {
      setEditingPage(null)
      setFormData({
        title: '',
        description: '',
        icon: 'document',
        published: false
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingPage) {
        await api.put(`/pages/${editingPage.id}`, formData)
        success('Page updated successfully')
      } else {
        await api.post('/pages', formData)
        success('Page created successfully')
      }
      
      setShowModal(false)
      loadPages()
    } catch (err) {
      error(err.response?.data?.error || 'Operation failed')
    }
  }

  const handleDelete = async (pageId, pageTitle) => {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"? This will also delete all associated forms.`)) {
      return
    }

    try {
      await api.delete(`/pages/${pageId}`)
      success('Page deleted successfully')
      loadPages()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete page')
    }
  }

  const handleTogglePublish = async (page) => {
    try {
      await api.put(`/pages/${page.id}`, { published: !page.published })
      success(`Page ${!page.published ? 'published' : 'unpublished'} successfully`)
      loadPages()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to update page')
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Loading fullScreen />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <DataTable
          title="Manage Pages"
          description="Create and organize pages for your forms"
          data={pages}
          searchPlaceholder="Search pages..."
          searchKeys={['title', 'description']}
          
          // List view columns
          columns={[
            {
              header: 'Page',
              render: (page) => (
                <div>
                  <p className="font-medium text-gray-900">{page.title}</p>
                  {page.description && (
                    <p className="text-sm text-gray-600 mt-0.5">{page.description}</p>
                  )}
                </div>
              )
            },
            {
              header: 'Forms',
              accessor: 'forms',
              align: 'center',
              noWrap: true,
              render: (page) => (
                <span className="text-gray-900">{page.forms?.length || 0}</span>
              )
            },
            {
              header: 'Status',
              align: 'center',
              noWrap: true,
              render: (page) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  page.published 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {page.published ? 'Published' : 'Draft'}
                </span>
              )
            },
            {
              header: 'Actions',
              align: 'right',
              noWrap: true,
              render: (page) => (
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePublish(page)}
                    title={page.published ? 'Unpublish' : 'Publish'}
                  >
                    {page.published ? <FiEyeOff /> : <FiEye />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenModal(page)}
                    title="Edit"
                  >
                    <FiEdit />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/admin/pages/${page.id}/forms`)}
                    title="Manage Forms"
                  >
                    <FiFileText />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(page.id, page.title)}
                    title="Delete"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              )
            }
          ]}
          
          filters={[
            {
              key: 'published',
              label: 'Status',
              options: [
                { value: 'true', label: 'Published' },
                { value: 'false', label: 'Draft' }
              ]
            }
          ]}
          
          onAdd={() => handleOpenModal()}
          addButtonText="New Page"
          emptyMessage="No pages yet"
          emptyActionText="Create Your First Page"
          onEmptyAction={() => handleOpenModal()}
          
          defaultView="list"
          gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          
          // Grid view card renderer
          renderCard={(page) => (
            <GridCard
              title={page.title}
              description={page.description}
              badges={[
                {
                  label: page.published ? 'Published' : 'Draft',
                  className: page.published 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }
              ]}
              actions={[
                {
                  label: page.published ? 'Unpublish' : 'Publish',
                  icon: page.published ? FiEyeOff : FiEye,
                  variant: 'ghost',
                  onClick: () => handleTogglePublish(page)
                },
                {
                  label: 'Edit',
                  icon: FiEdit,
                  variant: 'ghost',
                  onClick: () => handleOpenModal(page)
                },
                {
                  label: 'Forms',
                  icon: FiFileText,
                  variant: 'ghost',
                  onClick: () => router.push(`/admin/pages/${page.id}/forms`)
                },
                {
                  label: 'Delete',
                  icon: FiTrash2,
                  variant: 'ghost',
                  onClick: () => handleDelete(page.id, page.title),
                  className: 'text-red-600 hover:bg-red-50'
                }
              ]}
            >
              <div className="text-sm text-gray-600">
                <p className="flex items-center gap-1">
                  <FiFileText className="inline" />
                  {page.forms?.length || 0} form(s)
                </p>
              </div>
            </GridCard>
          )}
        />

        {/* Page Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingPage ? 'Edit Page' : 'Create New Page'}
        >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Page Title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Project Management"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" fullWidth>
              {editingPage ? 'Update Page' : 'Create Page'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
        </Modal>
      </div>
    </AdminLayout>
  )
}

