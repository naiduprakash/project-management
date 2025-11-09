'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import MainLayout from '@/components/layout/MainLayout'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Loading from '@/components/common/Loading'
import Breadcrumb from '@/components/common/Breadcrumb'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch, FiFilter, FiFileText } from 'react-icons/fi'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (params.slug) {
      console.log('Loading data for slug:', params.slug)
      loadData()
    }
  }, [params.slug, filters, searchTerm])

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
      
      // Load entries for this page
      const entriesResponse = await api.get('/projects')
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
      
      // Apply filters
      if (filters.status) {
        filteredEntries = filteredEntries.filter(entry => entry.status === filters.status)
        console.log('After status filter:', filteredEntries.length)
      }
      
      // Apply search
      if (searchTerm) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          Object.values(entry.data || {}).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
        console.log('After search filter:', filteredEntries.length)
      }
      
      // Apply sorting
      filteredEntries.sort((a, b) => {
        const aVal = a[filters.sortBy]
        const bVal = b[filters.sortBy]
        
        if (filters.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
      
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
            { label: page?.title || 'Loading...' }
          ]} 
        />
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{page.title}</h1>
          {page.description && (
            <p className="text-gray-600">{page.description}</p>
          )}
        </div>

        {/* Search and Actions */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${page.title.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-none"
              >
                <FiFilter className="mr-2" />
                Filters
              </Button>
              
              {page.forms && page.forms.length > 0 && (
                <Button
                  onClick={() => router.push(`/pages/${params.slug}/new`)}
                  className="flex-1 sm:flex-none"
                >
                  <FiPlus className="mr-2" />
                  New Entry
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    setFilters({ ...filters, sortBy, sortOrder })
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="updatedAt-desc">Recently Updated</option>
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Entries List */}
        {entries.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FiFileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No entries yet
              </h3>
              <p className="text-gray-600 mb-4">
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
          <div className="grid grid-cols-1 gap-4">
            {entries.map((entry) => {
              const form = getFormForEntry(entry)
              return (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {entry.title || 'Untitled Entry'}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
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
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {entry.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('View clicked for entry:', entry)
                          if (entry.id) {
                            router.push(`/pages/${params.slug}/${entry.id}`)
                          } else {
                            showError('Entry ID not found')
                          }
                        }}
                        title="View"
                      >
                        <FiEye />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('Edit clicked for entry:', entry)
                          if (entry.id) {
                            router.push(`/pages/${params.slug}/${entry.id}/edit`)
                          } else {
                            showError('Entry ID not found')
                          }
                        }}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        title="Delete"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

