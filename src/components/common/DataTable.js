'use client'

import { useState } from 'react'
import Card from './Card'
import Button from './Button'
import { FiSearch, FiFilter, FiPlus, FiGrid, FiList, FiChevronUp, FiChevronDown, FiAlignLeft, FiAlignCenter, FiAlignRight } from 'react-icons/fi'

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
  enableViewToggle = true, // Allow users to toggle between views
  customActions // Custom actions to render beside filters
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterValues, setFilterValues] = useState({})
  const [currentView, setCurrentView] = useState(defaultView)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [columnAlignments, setColumnAlignments] = useState({})
  const [hoveredColumn, setHoveredColumn] = useState(null)

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

  // Sort functionality
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = sortConfig.key.split('.').reduce((obj, k) => obj?.[k], a)
    const bValue = sortConfig.key.split('.').reduce((obj, k) => obj?.[k], b)

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1

    // Compare values
    let comparison = 0
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else {
      comparison = String(aValue).localeCompare(String(bValue))
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison
  })

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilterValues({})
    setSearchTerm('')
  }

  const handleSort = (columnKey) => {
    if (!columnKey) return

    setSortConfig(prevConfig => {
      if (prevConfig.key === columnKey) {
        // Toggle direction
        return {
          key: columnKey,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      // New column, default to ascending
      return { key: columnKey, direction: 'asc' }
    })
  }

  const handleAlignmentChange = (columnIndex, alignment, e) => {
    e.stopPropagation()
    setColumnAlignments(prev => ({
      ...prev,
      [columnIndex]: alignment
    }))
  }

  const getColumnAlignment = (column, columnIndex) => {
    // Check if user has set custom alignment
    if (columnAlignments[columnIndex]) {
      return columnAlignments[columnIndex]
    }
    // Use column's default align if specified
    if (column.align) {
      return column.align
    }
    // Default: left for all columns except Actions
    return column.header === 'Actions' ? 'right' : 'left'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2">
            {/* Search - Full width on mobile, then flexible width on sm and up */}
            <div className="w-full sm:flex-grow sm:max-w-xs md:max-w-sm lg:max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all min-h-[44px] sm:min-h-[36px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-0">
              {/* Add New Button */}
              {onAdd && (
                <Button size="sm" onClick={onAdd} className="min-h-[44px] sm:min-h-[32px] flex-grow sm:flex-grow-0">
                  <FiPlus className="mr-2" />
                  <span className="hidden xs:inline">{addButtonText}</span>
                </Button>
              )}
              
              {/* View Toggle */}
              {enableViewToggle && renderCard && columns.length > 0 && (
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md flex-grow sm:flex-grow-0">
                  <button
                    onClick={() => setCurrentView('list')}
                    className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-l-md transition-colors min-h-[44px] sm:min-h-[32px] flex items-center justify-center flex-1 ${
                      currentView === 'list'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="List View"
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentView('grid')}
                    className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-r-md transition-colors min-h-[44px] sm:min-h-[32px] flex items-center justify-center flex-1 ${
                      currentView === 'grid'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="min-h-[44px] sm:min-h-[32px] flex-grow sm:flex-grow-0"
                >
                  <FiFilter className="mr-2" />
                  <span className="hidden xs:inline">Filters</span>
                  {Object.keys(filterValues).length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-xs">
                      {Object.keys(filterValues).filter(k => filterValues[k] && filterValues[k] !== 'all').length}
                    </span>
                  )}
                </Button>
              )}

              {/* Custom Actions */}
              {customActions}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && filters.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filters.map(filter => (
                  <div key={filter.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {filter.label}
                    </label>
                    <select
                      value={filterValues[filter.key] || 'all'}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all min-h-[44px] sm:min-h-[36px]"
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
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="min-h-[44px] sm:min-h-[32px]">
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Data Display */}
      {sortedData.length === 0 ? (
        <Card>
          <div className="text-center py-12 px-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">{ emptyMessage}</p>
            {onEmptyAction && (
              <Button onClick={onEmptyAction} className="min-h-[44px]">
                <FiPlus className="mr-2" />
                {emptyActionText || addButtonText}
              </Button>
            )}
          </div>
        </Card>
      ) : currentView === 'grid' && renderCard ? (
        // Grid View with Custom Cards
        <div className={`grid ${gridCols} gap-4 sm:gap-6`}>
          {sortedData.map((item, index) => (
            <div key={item.id || index}>
              {renderCard(item)}
            </div>
          ))}
        </div>
      ) : (
        // List/Table View - Responsive with horizontal scroll on small screens
        <Card className="overflow-x-auto">
          <div className="min-w-full inline-block">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm sm:text-base">
              <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                <tr>
                  {columns.map((column, index) => {
                    const isSortable = column.sortKey || column.accessor
                    const sortKey = column.sortKey || column.accessor
                    const isActive = sortConfig.key === sortKey
                    const align = getColumnAlignment(column, index)
                    const isHovered = hoveredColumn === index
                    
                    return (
                      <th
                        key={index}
                        className={`px-3 sm:px-6 py-2 sm:py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider relative whitespace-nowrap ${
                          align === 'right' ? 'text-right' : 
                          align === 'center' ? 'text-center' : 'text-left'
                        } ${isSortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors' : ''}`}
                        onClick={() => isSortable && handleSort(sortKey)}
                        onMouseEnter={() => setHoveredColumn(index)}
                        onMouseLeave={() => setHoveredColumn(null)}
                      >
                        <div className={`inline-flex items-center gap-1 ${
                          align === 'right' ? 'justify-end' : 
                          align === 'center' ? 'justify-center' : 'justify-start'
                        }`}>
                          <span className="hidden sm:inline">{column.header}</span>
                          <span className="sm:hidden">{column.header?.substring(0, 3)}</span>
                          {isSortable && (
                            <span className="inline-flex flex-col ml-0.5" style={{ width: '10px', height: '14px' }}>
                              <FiChevronUp 
                                className={`transition-colors ${
                                  isActive && sortConfig.direction === 'asc' 
                                    ? 'text-primary-600 dark:text-primary-400' 
                                    : 'text-gray-300 dark:text-gray-600 opacity-60'
                                }`} 
                                size={10}
                                style={{ marginBottom: '-2px' }}
                              />
                              <FiChevronDown 
                                className={`transition-colors ${
                                  isActive && sortConfig.direction === 'desc' 
                                    ? 'text-primary-600 dark:text-primary-400' 
                                    : 'text-gray-300 dark:text-gray-600 opacity-60'
                                }`} 
                                size={10}
                                style={{ marginTop: '-2px' }}
                              />
                            </span>
                          )}
                        </div>

                        {/* Alignment Controls - Absolutely Positioned */}
                        {isHovered && (
                          <div 
                            className="absolute top-1/2 right-2 transform -translate-y-1/2 inline-flex items-center gap-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 shadow-md z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => handleAlignmentChange(index, 'left', e)}
                              className={`p-0.5 rounded transition-colors ${
                                align === 'left' 
                                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              title="Align left"
                            >
                              <FiAlignLeft size={12} />
                            </button>
                            <button
                              onClick={(e) => handleAlignmentChange(index, 'center', e)}
                              className={`p-0.5 rounded transition-colors ${
                                align === 'center' 
                                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              title="Align center"
                            >
                              <FiAlignCenter size={12} />
                            </button>
                            <button
                              onClick={(e) => handleAlignmentChange(index, 'right', e)}
                              className={`p-0.5 rounded transition-colors ${
                                align === 'right' 
                                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              title="Align right"
                            >
                              <FiAlignRight size={12} />
                            </button>
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((item, rowIndex) => (
                  <tr
                    key={item.id || rowIndex}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:bg-gray-100 dark:active:bg-gray-700' : ''}
                  >
                    {columns.map((column, colIndex) => {
                      const align = getColumnAlignment(column, colIndex)
                      const content = column.render
                        ? column.render(item)
                        : column.accessor?.split('.').reduce((obj, key) => obj?.[key], item)
                      
                      return (
                        <td
                          key={colIndex}
                          className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100 ${column.noWrap ? 'whitespace-nowrap' : ''}`}
                        >
                          <div className={`flex ${
                            align === 'right' ? 'justify-end' : 
                            align === 'center' ? 'justify-center' : 'justify-start'
                          }`}>
                            {content}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results count */}
          <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {sortedData.length} of {data.length} {sortedData.length === 1 ? 'result' : 'results'}
              {sortConfig.key && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">
                  • Sorted by {columns.find(c => (c.sortKey || c.accessor) === sortConfig.key)?.header} 
                  ({sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A'})
                </span>
              )}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DataTable
