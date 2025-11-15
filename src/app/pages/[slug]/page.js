'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import MainLayout from '@/components/layout/MainLayout'
import ContentHeader from '@/components/common/ContentHeader'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Loading from '@/components/common/Loading'
import Modal from '@/components/common/Modal'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiFileText, FiSettings, FiGripVertical, FiColumns } from 'react-icons/fi'
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
  const [activeColumnTab, setActiveColumnTab] = useState('visibility')
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    status: true,
    createdAt: true
  })
  const [columnOrder, setColumnOrder] = useState(['title', 'status', 'createdAt'])
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

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
        const parsed = JSON.parse(saved)
        setVisibleColumns(parsed.visibility || {
          title: true,
          status: true,
          createdAt: true
        })
        setColumnOrder(parsed.order || ['title', 'status', 'createdAt'])
      }
    } catch (err) {
      console.error('Failed to load column preferences:', err)
    }
  }

  const saveColumnPreferences = (preferences) => {
    try {
      const currentPrefs = JSON.parse(localStorage.getItem(`page-columns-${params.slug}`) || '{}')
      const updatedPrefs = {
        ...currentPrefs,
        ...preferences
      }
      localStorage.setItem(`page-columns-${params.slug}`, JSON.stringify(updatedPrefs))
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

        // Collect all sections from both top-level and nested pages
        const allSections = [
          ...(form.sections || []),
          ...(form.pages || []).flatMap(page => page.sections || [])
        ]

        // Add form field columns
        allSections.forEach(section => {
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

        // Initialize column order with form fields
        const allFieldNames = Object.keys(formFieldColumns)
        setColumnOrder(prev => {
          const existingOrder = prev.filter(key => !allFieldNames.includes(key))
          return [...existingOrder, ...allFieldNames]
        })

        // Also update saved preferences if needed
        const savedPrefs = localStorage.getItem(`page-columns-${params.slug}`)
        if (savedPrefs) {
          const parsedPrefs = JSON.parse(savedPrefs)
          setVisibleColumns(prev => ({
            ...prev,
            ...formFieldColumns,
            ...(parsedPrefs.visibility || {})
          }))
          if (parsedPrefs.order) {
            setColumnOrder(parsedPrefs.order)
          }
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

  // Drag and drop functions for column ordering
  const handleDragStart = (e, index, label) => {
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
    setDraggedItem({ index, label })
    
    // Create custom drag image
    const dragImage = document.createElement('div')
    dragImage.className = 'px-3 py-2 bg-primary-500 text-white rounded-lg shadow-lg text-sm font-medium'
    dragImage.textContent = label
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    dragImage.style.left = '-1000px'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))

    if (dragIndex === dropIndex) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    const newOrder = [...columnOrder]
    const [removed] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, removed)

    setColumnOrder(newOrder)
    saveColumnPreferences({ order: newOrder })
    
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const columns = useMemo(() => {
    const columnMap = {}

    // Add default columns
    if (visibleColumns.title) {
      columnMap.title = {
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
      }
    }

    if (visibleColumns.status) {
      columnMap.status = {
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
      }
    }

    if (visibleColumns.createdAt) {
      columnMap.createdAt = {
        header: 'Created',
        accessor: 'createdAt',
        render: (entry) => <span className="text-gray-600 dark:text-gray-400">{format(new Date(entry.createdAt), 'MMM dd, yyyy')}</span>
      }
    }

    // Add form field columns
    if (page?.forms && page.forms.length > 0) {
      const form = page.forms[0]
      // Collect all sections from both top-level and nested pages
      const allSections = [
        ...(form.sections || []),
        ...(form.pages || []).flatMap(page => page.sections || [])
      ]

      allSections.forEach(section => {
        if (section.fields) {
          section.fields.forEach(field => {
            if (field.name && field.name !== 'title' && visibleColumns[field.name]) {
              columnMap[field.name] = {
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
              }
            }
          })
        }
      })
    }

    // Add Actions column - always included
    columnMap.actions = {
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

    // Order columns according to columnOrder, put actions last
    const orderedColumns = []
    const visibleOrder = columnOrder.filter(key => columnMap[key] && key !== 'actions')

    visibleOrder.forEach(key => {
      orderedColumns.push(columnMap[key])
    })

    // Always add actions at the end
    if (columnMap.actions) {
      orderedColumns.push(columnMap.actions)
    }

    return orderedColumns
  }, [visibleColumns, page, columnOrder])

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
            enableColumnSelector={false}
            columns={columns}

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
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveColumnTab('visibility')}
                className={`flex-1 py-2 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeColumnTab === 'visibility'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiColumns className="inline mr-2" />
                Visibility
              </button>
              <button
                onClick={() => setActiveColumnTab('order')}
                className={`flex-1 py-2 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeColumnTab === 'order'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiColumns className="inline mr-2" />
                Order
              </button>
            </div>

            {/* Tab Content */}
            {activeColumnTab === 'visibility' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select which columns to display in the table view.
                </p>

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
                            saveColumnPreferences({ visibility: newVisibleColumns })
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
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Form Fields</h4>
                    <div className="space-y-4">
                      {(() => {
                        const form = page.forms[0]
                        const groupedFields = {}

                        // Process top-level sections
                        if (form.sections && form.sections.length > 0) {
                          form.sections.forEach(section => {
                            if (section.fields && section.fields.length > 0) {
                              const sectionKey = `section-${section.id}`
                              const sectionTitle = section.title || 'Untitled Section'
                              groupedFields[sectionKey] = {
                                title: sectionTitle,
                                type: 'section',
                                fields: section.fields.filter(field => field.name && field.name !== 'title')
                              }
                            }
                          })
                        }

                        // Process nested pages and their sections
                        if (form.pages && form.pages.length > 0) {
                          form.pages.forEach(page => {
                            if (page.sections && page.sections.length > 0) {
                              page.sections.forEach(section => {
                                if (section.fields && section.fields.length > 0) {
                                  const sectionKey = `page-${page.id}-section-${section.id}`
                                  const sectionTitle = section.title || 'Untitled Section'
                                  const pageTitle = page.title || 'Untitled Tab'
                                  groupedFields[sectionKey] = {
                                    title: sectionTitle,
                                    type: 'section',
                                    parentTitle: pageTitle,
                                    fields: section.fields.filter(field => field.name && field.name !== 'title')
                                  }
                                }
                              })
                            }
                          })
                        }

                        return Object.entries(groupedFields).map(([sectionKey, sectionData]) => (
                          <div key={sectionKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                              {sectionData.parentTitle && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                                  {sectionData.parentTitle} →
                                </span>
                              )}
                              {sectionData.title}
                            </h5>
                            <div className="space-y-2 pl-2">
                              {sectionData.fields.map(field => (
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
                                      saveColumnPreferences({ visibility: newVisibleColumns })
                                    }}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {field.label || field.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                )}

                {/* Actions Column */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Actions</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 opacity-50 cursor-not-allowed"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Actions
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        Always visible
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeColumnTab === 'order' && page && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop to reorder the columns in the table.
                </p>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {columnOrder.filter(key => visibleColumns.hasOwnProperty(key) && visibleColumns[key] && key !== 'actions').map((key, displayIndex) => {
                    // Get the actual index in columnOrder for correct drag-drop operations
                    const actualIndex = columnOrder.indexOf(key)
                    const isDragging = draggedItem?.index === actualIndex
                    const isDragOver = dragOverIndex === actualIndex
                    const isDragBefore = dragOverIndex === actualIndex && draggedItem && draggedItem.index > actualIndex
                    const isDragAfter = dragOverIndex === actualIndex && draggedItem && draggedItem.index < actualIndex
                    
                    let label = key
                    if (key === 'title') label = 'Title'
                    else if (key === 'status') label = 'Status'
                    else if (key === 'createdAt') label = 'Created Date'
                    else if (page.forms && page.forms.length > 0) {
                      // Find the field label from the form
                      const form = page.forms[0]
                      if (form) {
                        const allSections = [
                          ...(form.sections || []),
                          ...(form.pages || []).flatMap(p => p.sections || [])
                        ]
                        for (const section of allSections) {
                          const field = section.fields?.find(f => f.name === key)
                          if (field) {
                            label = field.label || field.name
                            break
                          }
                        }
                      }
                    }

                    return (
                      <div key={key} className="relative">
                        {/* Top insertion line - shown when dragging over and item is coming from below */}
                        {isDragBefore && (
                          <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary-500 dark:bg-primary-400 z-50" />
                        )}
                        
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, actualIndex, label)}
                          onDragOver={(e) => handleDragOver(e, actualIndex)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, actualIndex)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-move transition-all duration-200 ${
                            isDragging
                              ? 'opacity-40 bg-gray-300 dark:bg-gray-600 border-2 border-dashed border-gray-400 dark:border-gray-500'
                              : isDragOver
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 dark:border-primary-400 shadow-md'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                          }`}
                        >
                          <FiColumns className={`flex-shrink-0 transition-colors ${
                            isDragOver 
                              ? 'text-primary-600 dark:text-primary-400' 
                              : isDragging
                              ? 'text-gray-500 dark:text-gray-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                          <span className={`text-sm font-medium flex-1 transition-colors ${
                            isDragOver
                              ? 'text-primary-700 dark:text-primary-300'
                              : isDragging
                              ? 'text-gray-500 dark:text-gray-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {displayIndex + 1}
                          </span>
                        </div>

                        {/* Bottom insertion line - shown when dragging over and item is coming from above */}
                        {isDragAfter && (
                          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-500 dark:bg-primary-400 z-50" />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <strong>Note:</strong> The Actions column is always displayed at the end and cannot be reordered.
                </div>
              </div>
            )}

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

