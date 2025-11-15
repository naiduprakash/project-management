'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import MainLayout from '@/components/layout/MainLayout'
import ContentHeader from '@/components/common/ContentHeader'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Loading from '@/components/common/Loading'
import Modal from '@/components/common/Modal'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiFileText, FiSettings } from 'react-icons/fi'
import DataTable from '@/components/common/DataTable'
import GridCard from '@/components/common/GridCard'
import api from '@/lib/api'
import { format } from 'date-fns'

export default function PageListingPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  
  const [page, setPage] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    status: true,
    createdAt: true
  })

  useEffect(() => {
    if (params.slug) {
      console.log('Loading data for slug:', params.slug)
      loadColumnPreferences()
      loadData()
    }
  }, [params.slug])

  const loadColumnPreferences = () => {
    try {
      const saved = localStorage.getItem(`page-columns-${params.slug}`)
      if (saved) {
        setVisibleColumns(JSON.parse(saved))
      }
    } catch (err) {
      console.error('Failed to load column preferences:', err)
    }
  }

  const saveColumnPreferences = (preferences) => {
    try {
      localStorage.setItem(`page-columns-${params.slug}`, JSON.stringify(preferences))
    } catch (err) {
      console.error('Failed to save column preferences:', err)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load page details
      const pagesResponse = await api.get('/pages')
      const currentPage = pagesResponse.data.find(p => p.slug === params.slug)
      
      if (!currentPage) {
        showError('Page not found')
        router.push('/')
        return
      }
      
      if (!currentPage.isPublished && !currentPage.published) {
        showError('This page is not available')
        router.push('/')
        return
      }
      
      setPage(currentPage)
      
      // Load ALL entries for this page (no pagination limit)
      const entriesResponse = await api.get('/projects?limit=1000') // Large limit to get all entries
      console.log('All entries response:', entriesResponse.data)
      console.log('Current page forms:', currentPage.forms)
      
      // Get the projects array from the response
      const allProjects = entriesResponse.data.projects || entriesResponse.data || []
      console.log('All projects array:', allProjects)
      
      // Filter entries by page
      let filteredEntries = allProjects.filter(entry => {
        // Find if any form in this page matches the entry's form
        const matches = currentPage.forms?.some(form => form.id === entry.formId)
        console.log(`Entry ${entry.id} (formId: ${entry.formId}) matches:`, matches)
        return matches
      })

      console.log('Filtered entries by page:', filteredEntries.length)

      // Initialize visibleColumns with form fields if not already done
      if (currentPage.forms && currentPage.forms.length > 0) {
        const form = currentPage.forms[0] // Use first form
        const formFieldColumns = {}

        // Add form field columns
        form.sections?.forEach(section => {
          section.fields?.forEach(field => {
            if (field.name && field.name !== 'title') { // Skip title as it's already in default columns
              formFieldColumns[field.name] = false // Default to hidden
            }
          })
        })

        // Update visibleColumns to include form fields
        setVisibleColumns(prev => ({
          ...prev,
          ...formFieldColumns
        }))

        // Also update saved preferences if needed
        const savedPrefs = localStorage.getItem(`page-columns-${params.slug}`)
        if (savedPrefs) {
          const parsedPrefs = JSON.parse(savedPrefs)
          setVisibleColumns(prev => ({
            ...prev,
            ...formFieldColumns,
            ...parsedPrefs
          }))
        }
      }

      console.log('Final entries to display:', filteredEntries)
      console.log('Sample entry structure:', filteredEntries[0])
      setEntries(filteredEntries)
    } catch (err) {
      console.error('Error loading data:', err)
      showError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return
    
    try {
      await api.delete(`/projects/${id}`)
      success('Entry deleted successfully')
      loadData()
    } catch (err) {
      showError('Failed to delete entry')
    }
  }

  const getFormForEntry = (entry) => {
    return page?.forms?.find(f => f.id === entry.formId)
  }

  const renderEntryCard = (entry) => {
    const form = getFormForEntry(entry)
    return (
      <Card key={entry.id} className="p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {entry.title || 'Untitled Entry'}
            </h3>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
              {form && (
                <span className="flex items-center">
                  <FiFileText className="mr-1" />
                  {form.title}
                </span>
              )}
              <span>
                Created: {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                entry.status === 'published'
                  ? 'bg-primary-100 text-primary-800'
                  : entry.status === 'draft'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {entry.status}
              </span>
            </div>
            {entry.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                {entry.description}
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/pages/${params.slug}/${entry.id}`)}
              className="flex-1"
            >
              <FiEye className="mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/pages/${params.slug}/${entry.id}/edit`)}
              className="flex-1"
            >
              <FiEdit2 className="mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(entry.id, entry.title || 'Untitled Entry')}
              className="flex-1"
            >
              <FiTrash2 className="mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    )
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
    <MainLayout
      pageTitle={page.title}
    >
      <div className="h-full flex flex-col">
        {/* Content Header with Breadcrumb */}
        <ContentHeader
          breadcrumbItems={[
            { label: page?.title || 'Loading...' }
          ]}
          actions={
            <Button onClick={() => router.push(`/pages/${params.slug}/new`)}>
              <FiPlus className="mr-2" />
              New Entry
            </Button>
          }
        />
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Entries List */}
        {entries.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FiFileText className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No entries yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first entry
              </p>
              {page.forms && page.forms.length > 0 && (
                <Button onClick={() => router.push(`/pages/${params.slug}/new`)}>
                  <FiPlus className="mr-2" />
                  Create First Entry
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <DataTable
            title={null}
            description={null}
            data={entries}
            searchPlaceholder="Search entries..."
            searchKeys={['title', 'description']}

            columns={[
              visibleColumns.title && {
                header: 'Title',
                accessor: 'title',
                render: (entry) => (
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{entry.title || 'Untitled Entry'}</p>
                    {entry.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{entry.description}</p>
                    )}
                  </div>
                )
              },
              visibleColumns.status && {
                header: 'Status',
                accessor: 'status',
                render: (entry) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.status === 'published'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200'
                      : entry.status === 'draft'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                  }`}>
                    {entry.status}
                  </span>
                )
              },
              visibleColumns.createdAt && {
                header: 'Created',
                accessor: 'createdAt',
                render: (entry) => <span className="text-gray-600 dark:text-gray-400">{format(new Date(entry.createdAt), 'MMM dd, yyyy')}</span>
              },
              // Add form field columns
              ...(page?.forms && page.forms.length > 0
                ? page.forms[0].sections?.flatMap(section =>
                    section.fields?.filter(field =>
                      field.name &&
                      field.name !== 'title' &&
                      visibleColumns[field.name]
                    ).map(field => ({
                      header: field.label || field.name,
                      accessor: `data.${field.name}`,
                      render: (entry) => {
                        const value = entry.data?.[field.name]
                        if (value === null || value === undefined || value === '') {
                          return <span className="text-gray-400">-</span>
                        }

                        // Handle different field types
                        if (field.type === 'checkbox') {
                          return <span>{value ? 'Yes' : 'No'}</span>
                        }

                        if (Array.isArray(value)) {
                          return <span>{value.join(', ')}</span>
                        }

                        if (typeof value === 'object') {
                          return <span>{JSON.stringify(value)}</span>
                        }

                        return <span className="truncate max-w-xs block" title={String(value)}>
                          {String(value)}
                        </span>
                      }
                    })) || []
                  ).filter(Boolean)
                : []
              ),
              {
                header: 'Actions',
                align: 'right',
                noWrap: true,
                render: (entry) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/pages/${params.slug}/${entry.id}`)}
                      title="View Entry"
                    >
                      <FiEye />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/pages/${params.slug}/${entry.id}/edit`)}
                      title="Edit Entry"
                    >
                      <FiEdit2 />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(entry.id, entry.title || 'Untitled Entry')}
                      title="Delete Entry"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                )
              }
            ].filter(Boolean)}

            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'all', label: 'All Status' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'scheduled', label: 'Scheduled' }
                ]
              }
            ]}

            customActions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnModal(true)}
                title="Customize Columns"
              >
                <FiSettings className="mr-2" />
                Columns
              </Button>
            }

            emptyMessage="No entries found"
            emptyActionText="Create First Entry"
            onEmptyAction={() => router.push(`/pages/${params.slug}/new`)}
            defaultView="list"
            gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

            // Grid view card renderer
            renderCard={(entry) => (
              <GridCard
                title={entry.title || 'Untitled Entry'}
                description={entry.description}
                badges={[
                  {
                    label: entry.status,
                    className: entry.status === 'published'
                      ? 'bg-primary-100 text-primary-800'
                      : entry.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-orange-100 text-orange-800'
                  }
                ]}
                metadata={[
                  { label: 'Created', value: format(new Date(entry.createdAt), 'MMM dd, yyyy') }
                ]}
                actions={[
                  {
                    label: 'View',
                    icon: FiEye,
                    onClick: () => router.push(`/pages/${params.slug}/${entry.id}`)
                  },
                  {
                    label: 'Edit',
                    icon: FiEdit2,
                    onClick: () => router.push(`/pages/${params.slug}/${entry.id}/edit`)
                  },
                  {
                    label: 'Delete',
                    icon: FiTrash2,
                    onClick: () => handleDelete(entry.id, entry.title || 'Untitled Entry'),
                    variant: 'danger'
                  }
                ]}
              />
            )}
          />
        )}
        </div>

        {/* Column Selection Modal */}
        <Modal
          isOpen={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          title="Customize Columns"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select which columns to display in the table view.
            </p>

            <div className="space-y-4">
              {/* Default Columns */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Default Columns</h4>
                <div className="space-y-2">
                  {Object.entries({
                    title: 'Title',
                    status: 'Status',
                    createdAt: 'Created Date'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key] || false}
                        onChange={(e) => {
                          const newVisibleColumns = {
                            ...visibleColumns,
                            [key]: e.target.checked
                          }
                          setVisibleColumns(newVisibleColumns)
                          saveColumnPreferences(newVisibleColumns)
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              {page?.forms && page.forms.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Form Fields</h4>
                  <div className="space-y-2">
                    {page.forms[0].sections?.flatMap(section =>
                      section.fields?.filter(field => field.name && field.name !== 'title')
                        .map(field => (
                          <label key={field.name} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={visibleColumns[field.name] || false}
                              onChange={(e) => {
                                const newVisibleColumns = {
                                  ...visibleColumns,
                                  [field.name]: e.target.checked
                                }
                                setVisibleColumns(newVisibleColumns)
                                saveColumnPreferences(newVisibleColumns)
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {field.label || field.name}
                            </span>
                          </label>
                        )) || []
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => setShowColumnModal(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  )
}

