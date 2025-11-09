'use client'

import { useState } from 'react'
import Card from './Card'
import Button from './Button'
import { FiSearch, FiFilter, FiPlus, FiGrid, FiList } from 'react-icons/fi'

const DataTable = ({
  title,
  description,
  data = [],
  columns = [],
  searchPlaceholder = 'Search...',
  searchKeys = [],
  filters = [],
  onAdd,
  addButtonText = 'Add New',
  onRowClick,
  emptyMessage = 'No data available',
  emptyActionText,
  onEmptyAction,
  renderCard,
  defaultView = 'list', // 'list' or 'grid'
  gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  enableViewToggle = true // Allow users to toggle between views
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterValues, setFilterValues] = useState({})
  const [currentView, setCurrentView] = useState(defaultView)

  // Search functionality
  const searchedData = data.filter(item => {
    if (!searchTerm) return true
    
    return searchKeys.some(key => {
      const value = key.split('.').reduce((obj, k) => obj?.[k], item)
      return String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  // Filter functionality
  const filteredData = searchedData.filter(item => {
    return filters.every(filter => {
      const filterValue = filterValues[filter.key]
      if (!filterValue || filterValue === 'all') return true
      
      const itemValue = filter.key.split('.').reduce((obj, k) => obj?.[k], item)
      return String(itemValue) === String(filterValue)
    })
  })

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilterValues({})
    setSearchTerm('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        {onAdd && (
          <Button onClick={onAdd}>
            <FiPlus className="mr-2" />
            {addButtonText}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              {enableViewToggle && renderCard && columns.length > 0 && (
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setCurrentView('list')}
                    className={`px-3 py-2 rounded-l-md transition-colors ${
                      currentView === 'list'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="List View"
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentView('grid')}
                    className={`px-3 py-2 rounded-r-md transition-colors ${
                      currentView === 'grid'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Grid View"
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Filter Toggle */}
              {filters.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FiFilter className="mr-2" />
                  Filters
                  {Object.keys(filterValues).length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                      {Object.keys(filterValues).filter(k => filterValues[k] && filterValues[k] !== 'all').length}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && filters.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filters.map(filter => (
                  <div key={filter.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {filter.label}
                    </label>
                    <select
                      value={filterValues[filter.key] || 'all'}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
                    >
                      <option value="all">All {filter.label}</option>
                      {filter.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              
              {Object.keys(filterValues).length > 0 && (
                <div className="mt-4">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Data Display */}
      {filteredData.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{emptyMessage}</p>
            {onEmptyAction && (
              <Button onClick={onEmptyAction}>
                <FiPlus className="mr-2" />
                {emptyActionText || addButtonText}
              </Button>
            )}
          </div>
        </Card>
      ) : currentView === 'grid' && renderCard ? (
        // Grid View with Custom Cards
        <div className={`grid ${gridCols} gap-6`}>
          {filteredData.map((item, index) => (
            <div key={item.id || index}>
              {renderCard(item)}
            </div>
          ))}
        </div>
      ) : (
        // List/Table View
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.align === 'right' ? 'text-right' : 
                        column.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, rowIndex) => (
                  <tr
                    key={item.id || rowIndex}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-6 py-4 text-sm text-gray-900 ${
                          column.align === 'right' ? 'text-right' : 
                          column.align === 'center' ? 'text-center' : 'text-left'
                        } ${column.noWrap ? 'whitespace-nowrap' : ''}`}
                      >
                        {column.render
                          ? column.render(item)
                          : column.accessor?.split('.').reduce((obj, key) => obj?.[key], item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results count */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredData.length} of {data.length} {filteredData.length === 1 ? 'result' : 'results'}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DataTable

