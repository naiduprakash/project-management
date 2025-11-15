'use client'

import { useState, useEffect, useRef } from 'react'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import RightResizableSidebar from '@/components/common/RightResizableSidebar'
import { useToast } from '@/context/ToastContext'
import { FiChevronRight, FiChevronLeft, FiSave, FiCheckCircle, FiCircle, FiAlertCircle } from 'react-icons/fi'
import { getResponsiveColSpan, getGridColumnStyle, sortFieldsByGridPosition } from '@/lib/gridLayoutUtils'

/**
 * Nested Tabs Component
 */
const NestedTabsRenderer = ({ tabsField, dataContext, pathPrefix, renderSection }) => {
  const [activeNestedTab, setActiveNestedTab] = useState(0)
  const pages = tabsField.pages || []
  
  if (pages.length === 0) {
    return null
  }

  const currentTabPage = pages[activeNestedTab] || { sections: [] }

  return (
    <Card className="mb-4 mt-4 border-2 border-blue-200 dark:border-blue-800">
      {/* Tab Header */}
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {tabsField.label || 'Nested Tabs'}
          </h3>
        </div>
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {pages.map((page, idx) => (
            <button
              key={page.id || idx}
              type="button"
              onClick={() => setActiveNestedTab(idx)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeNestedTab === idx
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {page.title || `Tab ${idx + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {currentTabPage.sections && currentTabPage.sections.length > 0 ? (
          currentTabPage.sections.map((section, sectionIdx) => 
            renderSection(section, dataContext, `${pathPrefix}-tab-${activeNestedTab}`, sectionIdx)
          )
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No content in this tab.</p>
        )}
      </div>
    </Card>
  )
}

/**
 * Helper function to get responsive column span classes
 * Supports both old format (number) and new format (object with mobile/tablet/desktop)
 */
// Using shared utility from gridLayoutUtils
// const getResponsiveColSpan = (columnSpan) => { ... }

/**
 * Helper function to get grid column style for absolute positioning
 * For responsive column spans, returns null to let CSS classes handle it
 */
// Using shared utility from gridLayoutUtils
// const getGridColumnStyle = (columnSpan, gridColumn = 1) => { ... }

/**
 * Dynamic Form Renderer Component
 * Renders forms dynamically based on form configuration from admin
 */
const DynamicFormRenderer = ({ 
  form, 
  initialData = {}, 
  onSubmit, 
  onSaveDraft,
  mode = 'create' // create, edit, view
}) => {
  const { error: showError, warning } = useToast()
  const [formData, setFormData] = useState(initialData)
  const [currentPage, setCurrentPage] = useState(0)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false) // Mobile right sidebar state
  const sectionRefs = useRef({})

  // Support both old (sections) and new (pages) structure
  const pages = form.pages || (form.sections ? [{ id: 'page-1', title: 'Form', sections: form.sections }] : [])
  const isMultiPage = form.settings?.multiPage && pages.length > 1
  const totalPages = isMultiPage ? pages.length : 1
  const isLastPage = currentPage === totalPages - 1
  const isFirstPage = currentPage === 0

  // Only update formData from initialData once on mount or when switching between entries
  useEffect(() => {
    if (!isInitialized || (mode === 'edit' && Object.keys(initialData).length > 0)) {
      setFormData(initialData)
      setIsInitialized(true)
    }
  }, [mode, isInitialized])

  const validateField = (field, value) => {
    const validation = field.validation || {}

    if (validation.required && !value) {
      return validation.message || `${field.label} is required`
    }

    if (validation.minLength && value.length < validation.minLength) {
      return validation.message || `Minimum length is ${validation.minLength}`
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      return validation.message || `Maximum length is ${validation.maxLength}`
    }

    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      return validation.message || `Invalid format`
    }

    if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      return 'Invalid email format'
    }

    return null
  }

  const validateSection = (section) => {
    const sectionErrors = {}

    if (section.type === 'repeater') {
      // Special validation for repeater sections
      const minRows = section.repeaterConfig?.minRows || 1
      const sectionValue = Array.isArray(formData[section.id]) ? formData[section.id] : []

      if (sectionValue.length < minRows) {
        sectionErrors[section.id] = `${section.title} must have at least ${minRows} row${minRows > 1 ? 's' : ''}`
        return sectionErrors
      }

      // Validate each row in the repeater
      sectionValue.forEach((rowData, rowIndex) => {
        (section.fields || []).forEach(field => {
          const fieldValue = rowData[field.name]
          const error = validateField(field, fieldValue)
          if (error) {
            sectionErrors[`${section.id}_${rowIndex}_${field.name}`] = `${section.title} - Row ${rowIndex + 1}: ${error}`
          }
        })
      })
    } else {
      // Regular section validation
      (section.fields || []).forEach(field => {
        // Check if field should be displayed (dependency check)
        if (field.dependsOn) {
          const dependentValue = formData[field.dependsOn.field]
          if (dependentValue !== field.dependsOn.value) {
            return // Skip validation for hidden fields
          }
        }

        const error = validateField(field, formData[field.name])
        if (error) {
          sectionErrors[field.name] = error
        }
      })
    }

    return sectionErrors
  }

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const handleNext = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    console.log('Next button clicked, current page:', currentPage)
    
    if (isMultiPage) {
      const currentPageData = pages[currentPage]
      const pageErrors = {}
      
      // Validate all sections on current page
      currentPageData.sections.forEach(section => {
        const sectionErrors = validateSection(section)
        Object.assign(pageErrors, sectionErrors)
      })
      
      if (Object.keys(pageErrors).length > 0) {
        setErrors(pageErrors)
        console.log('Validation errors:', pageErrors)
        return
      }
      
      const newPage = currentPage + 1
      console.log('Moving to page:', newPage)
      setCurrentPage(newPage)
      setErrors({}) // Clear errors when moving to next page
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    console.log('Previous button clicked, current page:', currentPage)
    
    // Validate current page before moving
    if (isMultiPage) {
      const currentPageData = pages[currentPage]
      const pageErrors = {}
      
      currentPageData.sections.forEach(section => {
        const sectionErrors = validateSection(section)
        Object.assign(pageErrors, sectionErrors)
      })
      
      if (Object.keys(pageErrors).length > 0) {
        setErrors(pageErrors)
        console.log('Validation errors on current page:', pageErrors)
        // Show warning toast but allow navigation back (for draft saving)
        warning('This page has validation errors. Make sure to fix them before submitting.')
      }
    }
    
    const newPage = currentPage - 1
    console.log('Moving to page:', newPage)
    setCurrentPage(newPage)
    setErrors({}) // Clear errors when moving to previous page
    window.scrollTo(0, 0)
  }
  
  const handleTabSwitch = (targetPage) => {
    // Don't validate if clicking on the current page
    if (targetPage === currentPage) {
      return
    }
    
    // Validate current page before switching
    if (isMultiPage && mode !== 'view') {
      const currentPageData = pages[currentPage]
      const pageErrors = {}
      
      currentPageData.sections.forEach(section => {
        const sectionErrors = validateSection(section)
        Object.assign(pageErrors, sectionErrors)
      })
      
      if (Object.keys(pageErrors).length > 0) {
        setErrors(pageErrors)
        console.log('Validation errors, preventing tab switch:', pageErrors)
        // Show error toast and prevent navigation
        showError('Please fix the validation errors on the current page before switching tabs.')
        return
      }
    }
    
    // Switch to target page
    setCurrentPage(targetPage)
    setErrors({})
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Form submit triggered, current page:', currentPage, 'isLastPage:', isLastPage)
    
    // Validate all sections across all pages
    const allErrors = {}
    pages.forEach(page => {
      (page.sections || []).forEach(section => {
        const sectionErrors = validateSection(section)
        Object.assign(allErrors, sectionErrors)
      })
    })
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      console.log('All sections validation errors:', allErrors)
      return
    }
    
    console.log('Submitting form data:', formData)
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  const handleSaveDraft = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onSaveDraft) {
      setLoading(true)
      await onSaveDraft(formData)
      setLoading(false)
    }
  }

  const renderField = (field) => {
    // Support custom value, onChange, and error for repeater fields
    const customValue = field.value !== undefined ? field.value : formData[field.name] || ''
    const customOnChange = field.onChange
    const customError = field.error !== undefined ? field.error : errors[field.name]
    const isDisabled = mode === 'view'

    // Check dependency (skip for repeater fields since they have custom handling)
    if (field.dependsOn && !customOnChange) {
      const dependentValue = formData[field.dependsOn.field]
      if (dependentValue !== field.dependsOn.value) {
        return null // Hide field
      }
    }

    const value = customValue
    const error = customError
    const handleFieldChange = customOnChange || handleChange

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            label={field.showLabel !== false ? field.label : ''}
            type={field.type}
            name={field.name}
            value={value || ''}
            fullWidth={false}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={error}
            required={field.validation?.required}
            placeholder={field.placeholder}
            hint={field.hint}
            disabled={isDisabled}
            autoComplete="off"
          />
        )

      case 'number':
        return (
          <Input
            label={field.showLabel !== false ? field.label : ''}
            type="number"
            name={field.name}
            value={value || ''}
            fullWidth={false}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={error}
            required={field.validation?.required}
            placeholder={field.placeholder}
            hint={field.hint}
            disabled={isDisabled}
            autoComplete="off"
          />
        )

      case 'date':
        return (
          <Input
            label={field.showLabel !== false ? field.label : ''}
            type="date"
            name={field.name}
            value={value || ''}
            fullWidth={false}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={error}
            required={field.validation?.required}
            hint={field.hint}
            disabled={isDisabled}
            autoComplete="off"
          />
        )

      case 'textarea':
        return (
          <div className="flex flex-col gap-1">
            {field.showLabel !== false && (
            <label className="text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            )}
            <textarea
              name={field.name}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 4}
              disabled={isDisabled}
              autoComplete="off"
              className={`px-4 py-3 sm:px-3 sm:py-2.5 text-base sm:text-sm min-h-[88px] sm:min-h-[80px] border rounded-lg sm:rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all ${
                error ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
              } ${isDisabled ? 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-600' : ''}`}
            />
            {field.hint && !error && (
              <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400">{field.hint}</p>
            )}
            {error && (
              <p className="text-sm sm:text-xs text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div className="flex flex-col gap-1">
            {field.showLabel !== false && (
            <label className="text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            )}
            {field.searchable ? (
              // Searchable select (simplified - in production, use a library like react-select)
              <select
                name={field.name}
                value={value || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                disabled={isDisabled}
                className={`px-4 py-3 sm:px-3 sm:py-2.5 text-base sm:text-sm min-h-[44px] sm:min-h-[36px] border rounded-lg sm:rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all ${
                  error ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                } ${isDisabled ? 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-600' : ''}`}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.multiSelect ? (
              // Multi-select
              <select
                name={field.name}
                value={value ? (Array.isArray(value) ? value : [value]) : []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  handleFieldChange(field.name, selected)
                }}
                multiple
                disabled={isDisabled}
                className={`px-4 py-3 sm:px-3 sm:py-2.5 text-base sm:text-sm min-h-[88px] sm:min-h-[80px] border rounded-lg sm:rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all ${
                  error ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                } ${isDisabled ? 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-600' : ''}`}
              >
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              // Regular select
              <select
                name={field.name}
                value={value || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                disabled={isDisabled}
                className={`px-4 py-3 sm:px-3 sm:py-2.5 text-base sm:text-sm min-h-[44px] sm:min-h-[36px] border rounded-lg sm:rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all ${
                  error ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                } ${isDisabled ? 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-600' : ''}`}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {field.hint && !error && (
              <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400">{field.hint}</p>
            )}
            {error && (
              <p className="text-sm sm:text-xs text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>
        )

      case 'checkbox_group':
        if (field.orientation === 'question-answer') {
          return (
            <div className="flex flex-col gap-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                {field.showLabel !== false && (
                <div className="flex-shrink-0">
                  <label className="text-sm font-medium text-gray-700 block">
                    {field.label}
                    {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                )}
                <div className="flex-1 mt-1 sm:mt-0 sm:text-right">
                  <div className="flex flex-wrap gap-4 sm:justify-end">
                    {field.options?.map((option, index) => {
                      const optionValue = typeof option === 'object' ? option.value || option.label : option
                      const optionLabel = typeof option === 'object' ? option.label || option.value : option
                      const isChecked = Array.isArray(value) ? value.includes(optionValue) : false

                      return (
                        <label key={index} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name={field.name}
                            value={optionValue}
                            checked={isChecked}
                            onChange={(e) => {
                              const currentValues = Array.isArray(value) ? [...value] : []
                              if (e.target.checked) {
                                // Add to array
                                handleFieldChange(field.name, [...currentValues, optionValue])
                              } else {
                                // Remove from array
                                handleFieldChange(field.name, currentValues.filter(v => v !== optionValue))
                              }
                            }}
                            disabled={isDisabled}
                            className={`rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                              error ? 'border-red-400 focus:ring-red-400' : ''
                            } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
                          />
                          <span className={`text-sm text-gray-700 ${
                            isDisabled ? 'text-gray-500' : ''
                          }`}>
                            {optionLabel}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
              {field.hint && !error && (
                <p className="text-xs text-gray-500">{field.hint}</p>
              )}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
          )
        }
        if (field.orientation === 'label-left') {
          return (
            <div className="flex flex-col gap-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
                {field.showLabel !== false && (
                <div className="flex-shrink-0">
                  <label className="text-sm font-medium text-gray-700 block">
                    {field.label}
                    {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                )}
                <div className="flex-1 mt-1 sm:mt-0">
                  <div className="flex flex-wrap gap-4">
                    {field.options?.map((option, index) => {
                      const optionValue = typeof option === 'object' ? option.value || option.label : option
                      const optionLabel = typeof option === 'object' ? option.label || option.value : option
                      const isChecked = Array.isArray(value) ? value.includes(optionValue) : false

                      return (
                        <label key={index} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name={field.name}
                            value={optionValue}
                            checked={isChecked}
                            onChange={(e) => {
                              const currentValues = Array.isArray(value) ? [...value] : []
                              if (e.target.checked) {
                                // Add to array
                                handleFieldChange(field.name, [...currentValues, optionValue])
                              } else {
                                // Remove from array
                                handleFieldChange(field.name, currentValues.filter(v => v !== optionValue))
                              }
                            }}
                            disabled={isDisabled}
                            className={`rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                              error ? 'border-red-400 focus:ring-red-400' : ''
                            } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
                          />
                          <span className={`text-sm text-gray-700 ${
                            isDisabled ? 'text-gray-500' : ''
                          }`}>
                            {optionLabel}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
              {field.hint && !error && (
                <p className="text-xs text-gray-500">{field.hint}</p>
              )}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
          )
        }
        return (
          <div className="flex flex-col gap-1">
            {field.showLabel !== false && (
            <label className="text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            )}
            <div className={`${
              field.orientation === 'horizontal'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-3 lg:gap-4'
                : 'space-y-2'
            }`}>
              {field.options?.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value || option.label : option
                const optionLabel = typeof option === 'object' ? option.label || option.value : option
                const isChecked = Array.isArray(value) ? value.includes(optionValue) : false

                return (
                  <label key={index} className={`flex items-center gap-2 cursor-pointer ${
                    field.orientation === 'horizontal' ? 'min-w-0' : ''
                  }`}>
                    <input
                      type="checkbox"
                      name={field.name}
                      value={optionValue}
                      checked={isChecked}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? [...value] : []
                        if (e.target.checked) {
                          // Add to array
                          handleFieldChange(field.name, [...currentValues, optionValue])
                        } else {
                          // Remove from array
                          handleFieldChange(field.name, currentValues.filter(v => v !== optionValue))
                        }
                      }}
                      disabled={isDisabled}
                      className={`rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                        error ? 'border-red-400 focus:ring-red-400' : ''
                      } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
                    />
                    <span className={`text-sm text-gray-700 ${
                      isDisabled ? 'text-gray-500' : ''
                    }`}>
                      {optionLabel}
                    </span>
                  </label>
                )
              })}
            </div>
            {field.hint && !error && (
              <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400">{field.hint}</p>
            )}
            {error && (
              <p className="text-sm sm:text-xs text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>
        )

      case 'radio_group':
        if (field.orientation === 'question-answer') {
          return (
            <div className="flex flex-col gap-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                {field.showLabel !== false && (
                <div className="flex-shrink-0">
                  <label className="text-sm font-medium text-gray-700 block">
                    {field.label}
                    {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                )}
                <div className="flex-1 mt-1 sm:mt-0 sm:text-right">
                  <div className="flex flex-wrap gap-4 sm:justify-end">
                    {field.options?.map((option, index) => {
                      const optionValue = typeof option === 'object' ? option.value || option.label : option
                      const optionLabel = typeof option === 'object' ? option.label || option.value : option
                      const isChecked = value === optionValue

                      return (
                        <label key={index} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={field.name}
                            value={optionValue}
                            checked={isChecked}
                            onChange={(e) => handleFieldChange(field.name, optionValue)}
                            disabled={isDisabled}
                            className={`rounded-full border-gray-300 text-primary-600 focus:ring-primary-500 ${
                              error ? 'border-red-400 focus:ring-red-400' : ''
                            } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
                          />
                          <span className={`text-sm text-gray-700 ${
                            isDisabled ? 'text-gray-500' : ''
                          }`}>
                            {optionLabel}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
              {field.hint && !error && (
                <p className="text-xs text-gray-500">{field.hint}</p>
              )}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
          )
        }
        if (field.orientation === 'label-left') {
          return (
            <div className="flex flex-col gap-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
                {field.showLabel !== false && (
                <div className="flex-shrink-0">
                  <label className="text-sm font-medium text-gray-700 block">
                    {field.label}
                    {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                )}
                <div className="flex-1 mt-1 sm:mt-0">
                  <div className="flex flex-wrap gap-4">
                    {field.options?.map((option, index) => {
                      const optionValue = typeof option === 'object' ? option.value || option.label : option
                      const optionLabel = typeof option === 'object' ? option.label || option.value : option
                      const isChecked = value === optionValue

                      return (
                        <label key={index} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={field.name}
                            value={optionValue}
                            checked={isChecked}
                            onChange={(e) => handleFieldChange(field.name, optionValue)}
                            disabled={isDisabled}
                            className={`rounded-full border-gray-300 text-primary-600 focus:ring-primary-500 ${
                              error ? 'border-red-400 focus:ring-red-400' : ''
                            } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
                          />
                          <span className={`text-sm text-gray-700 ${
                            isDisabled ? 'text-gray-500' : ''
                          }`}>
                            {optionLabel}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
              {field.hint && !error && (
                <p className="text-xs text-gray-500">{field.hint}</p>
              )}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>
          )
        }
        return (
          <div className="flex flex-col gap-1">
            {field.showLabel !== false && (
            <label className="text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            )}
            <div className={`${
              field.orientation === 'horizontal'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-3 lg:gap-4'
                : 'space-y-2'
            }`}>
              {field.options?.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value || option.label : option
                const optionLabel = typeof option === 'object' ? option.label || option.value : option
                const isChecked = value === optionValue

                return (
                  <label key={index} className={`flex items-center gap-2 cursor-pointer ${
                    field.orientation === 'horizontal' ? 'min-w-0' : ''
                  }`}>
                    <input
                      type="radio"
                      name={field.name}
                      value={optionValue}
                      checked={isChecked}
                      onChange={(e) => handleFieldChange(field.name, optionValue)}
                      disabled={isDisabled}
                      className={`rounded-full border-gray-300 text-primary-600 focus:ring-primary-500 ${
                        error ? 'border-red-400 focus:ring-red-400' : ''
                      } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
                    />
                    <span className={`text-sm text-gray-700 ${
                      isDisabled ? 'text-gray-500' : ''
                    }`}>
                      {optionLabel}
                    </span>
                  </label>
                )
              })}
            </div>
            {field.hint && !error && (
              <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400">{field.hint}</p>
            )}
            {error && (
              <p className="text-sm sm:text-xs text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>
        )

      case 'info':
        // Info/Text display field - customizable text with styling
        const infoStyle = {
          fontSize: field.fontSize || '14px',
          fontWeight: field.fontWeight || 'normal',
          color: field.fontColor || '#374151',
          fontFamily: field.fontFamily || 'inherit',
          textAlign: field.textAlign || 'left',
          fontStyle: field.fontStyle || 'normal',
          textDecoration: field.textDecoration || 'none'
        }
        return (
          <div 
            className="w-full whitespace-pre-wrap break-words"
            style={infoStyle}
          >
            {field.content || field.placeholder || ''}
          </div>
        )

      case 'section':
        // Nested section field
        // Use dataContext if provided (for repeater sections), otherwise create from formData
        const sectionDataContext = field.dataContext || (() => {
          // For nested sections, we need to handle the data path
          const nestedData = formData[field.name] || {}
          return {
            getData: (key) => nestedData[key],
            setData: (key, value) => {
              const newNestedData = { ...nestedData, [key]: value }
              handleFieldChange(field.name, newNestedData)
            },
            getError: (key) => errors[`${field.name}.${key}`],
            clearError: (key) => {
              if (errors[`${field.name}.${key}`]) {
                setErrors(prev => {
                  const newErrors = { ...prev }
                  delete newErrors[`${field.name}.${key}`]
                  return newErrors
                })
              }
            }
          }
        })
        return renderSection(field, sectionDataContext, field.name)

      case 'tab':
        // Nested tabs field
        // Use dataContext if provided (for repeater sections), otherwise create from formData
        const tabDataContext = field.dataContext || (() => {
          // For nested tabs, we need to handle the data path
          const nestedData = formData[field.name] || {}
          return {
            getData: (key) => nestedData[key],
            setData: (key, value) => {
              const newNestedData = { ...nestedData, [key]: value }
              handleFieldChange(field.name, newNestedData)
            },
            getError: (key) => errors[`${field.name}.${key}`],
            clearError: (key) => {
              if (errors[`${field.name}.${key}`]) {
                setErrors(prev => {
                  const newErrors = { ...prev }
                  delete newErrors[`${field.name}.${key}`]
                  return newErrors
                })
              }
            }
          }
        })
        return renderNestedTabs(field, tabDataContext, field.name)

      default:
        return null
    }
  }

  // Render nested tabs
  const renderNestedTabs = (tabsField, dataContext, pathPrefix = '') => {
    return (
      <NestedTabsRenderer
        tabsField={tabsField}
        dataContext={dataContext}
        pathPrefix={pathPrefix}
        renderSection={renderSection}
      />
    )
  }

  // Render section (can be top-level or nested)
  const renderSection = (section, dataContext = null, pathPrefix = '', sectionIndex = 0) => {
    const isNested = dataContext !== null
    const sectionId = section.id || (isNested ? `${pathPrefix}-section-${sectionIndex}` : `section-${sectionIndex}`)
    
    // Check if it's a repeater section (supports both section.type and section.sectionType)
    const isRepeaterSection = section.type === 'repeater' || section.sectionType === 'repeater'
    
    if (isRepeaterSection) {
      // Repeater Section
      const minRows = section.repeaterConfig?.minRows || 1
      const maxRows = section.repeaterConfig?.maxRows || 10
      const addLabel = section.repeaterConfig?.addLabel?.trim() || 'Add New'
      const removeLabel = section.repeaterConfig?.removeLabel?.trim() || 'Remove'
      const addButtonPosition = section.repeaterConfig?.addButtonPosition || 'bottom'
      const isDisabled = mode === 'view'

      // Get data from context if nested, otherwise from formData
      const getSectionValue = () => {
        if (isNested) {
          const ctx = dataContext()
          const key = section.name || section.id
          return Array.isArray(ctx.getData(key)) ? ctx.getData(key) : []
        }
        const key = section.id || section.name
        return Array.isArray(formData[key]) ? formData[key] : []
      }

      const sectionValue = getSectionValue()

      // Initialize with minimum rows if empty
      const initializedValue = sectionValue.length < minRows
        ? [
            ...sectionValue,
            ...Array.from({ length: minRows - sectionValue.length }, () =>
              (section.fields || []).reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
            )
          ]
        : sectionValue

      const handleRepeaterChange = (rowIndex, fieldName, subValue) => {
        const newValue = [...initializedValue]
        if (!newValue[rowIndex]) {
          newValue[rowIndex] = section.fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
        }
        newValue[rowIndex][fieldName] = subValue
        
        const key = isNested ? (section.name || section.id) : (section.id || section.name)
        if (isNested) {
          const ctx = dataContext()
          ctx.setData(key, newValue)
        } else {
          handleChange(key, newValue)
        }
      }

      const addRepeaterRow = () => {
        if (initializedValue.length >= maxRows) return
        const newRow = section.fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
        const newValue = addButtonPosition === 'top' ? [newRow, ...initializedValue] : [...initializedValue, newRow]
        
        const key = isNested ? (section.name || section.id) : (section.id || section.name)
        if (isNested) {
          const ctx = dataContext()
          ctx.setData(key, newValue)
        } else {
          handleChange(key, newValue)
        }
      }

      const removeRepeaterRow = (rowIndex) => {
        if (initializedValue.length <= minRows) return
        const newValue = initializedValue.filter((_, i) => i !== rowIndex)
        
        const key = isNested ? (section.name || section.id) : (section.id || section.name)
        if (isNested) {
          const ctx = dataContext()
          ctx.setData(key, newValue)
        } else {
          handleChange(key, newValue)
        }
      }

      return (
        <Card
          key={sectionId}
          className={isNested ? 'mb-4 mt-4' : 'mb-6'}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className={`font-bold text-gray-900 dark:text-gray-100 ${isNested ? 'text-base' : 'text-lg'}`}>{section.title || section.label}</h2>
              {section.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
              )}
            </div>
            {addButtonPosition === 'top' && initializedValue.length < maxRows && !isDisabled && (
              <button
                type="button"
                onClick={addRepeaterRow}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                + {addLabel}
              </button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {!isDisabled && (
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 text-[10px] font-bold">
                  R
                </span>
                All entries below belong to this repeatable group.
              </div>
            )}

            {/* Repeated section instances */}
            {initializedValue.map((rowData, rowIndex) => (
              <div
                key={`${sectionId}-${rowIndex}`}
                className="rounded-md border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                    {section.title || section.label} • Item {rowIndex + 1}
                  </h3>
                  {initializedValue.length > minRows && !isDisabled && (
                    <button
                      type="button"
                      onClick={() => removeRepeaterRow(rowIndex)}
                      className="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Remove this entry"
                    >
                      {removeLabel}
                    </button>
                  )}
                </div>

                {/* Render all fields exactly like in regular sections */}
                <div className="hidden lg:grid grid-cols-12 gap-3">
                  {(section.fields || []).map(field => {
                    const columnSpan = field.columnSpan || 12
                    const gridColumn = field.gridColumn || 1
                    const gridRow = field.gridRow || 1
                    const span = typeof columnSpan === 'object' 
                      ? (columnSpan.desktop || 4) 
                      : (columnSpan || 4)

                    return (
                      <div
                        key={`${field.name}-${rowIndex}`}
                        className="w-full"
                        style={{
                          gridColumn: `${gridColumn} / span ${span}`,
                          gridRow: gridRow
                        }}
                      >
                        {field.type === 'section' || field.type === 'tab' ? (
                          // For nested sections/tabs in repeaters, use data context pattern
                          renderField({
                            ...field,
                            dataContext: () => {
                              const nestedData = rowData[field.name] || {}
                              return {
                                getData: (key) => nestedData[key],
                                setData: (key, value) => {
                                  const newNestedData = { ...nestedData, [key]: value }
                                  handleRepeaterChange(rowIndex, field.name, newNestedData)
                                },
                                getError: (key) => errors[`${sectionId}_${rowIndex}_${field.name}.${key}`],
                                clearError: (key) => {
                                  if (errors[`${sectionId}_${rowIndex}_${field.name}.${key}`]) {
                                    setErrors(prev => {
                                      const newErrors = { ...prev }
                                      delete newErrors[`${sectionId}_${rowIndex}_${field.name}.${key}`]
                                      return newErrors
                                    })
                                  }
                                }
                              }
                            }
                          })
                        ) : (
                          // Regular fields in repeaters
                          renderField({
                            ...field,
                            name: `${sectionId}_${rowIndex}_${field.name}`,
                            value: rowData[field.name] || '',
                            onChange: (fieldName, value) => handleRepeaterChange(rowIndex, field.name, value),
                            error: errors[`${sectionId}_${rowIndex}_${field.name}`]
                          })
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Mobile/Tablet: Responsive layout */}
                <div className="lg:hidden grid grid-cols-12 gap-3">
                  {sortFieldsByGridPosition(section.fields || []).map(field => {
                    const columnSpan = field.columnSpan || 12

                    return (
                      <div
                        key={`${field.name}-${rowIndex}`}
                        className={getResponsiveColSpan(columnSpan)}
                      >
                        {field.type === 'section' || field.type === 'tab' ? (
                          // For nested sections/tabs in repeaters, use data context pattern
                          renderField({
                            ...field,
                            dataContext: () => {
                              const nestedData = rowData[field.name] || {}
                              return {
                                getData: (key) => nestedData[key],
                                setData: (key, value) => {
                                  const newNestedData = { ...nestedData, [key]: value }
                                  handleRepeaterChange(rowIndex, field.name, newNestedData)
                                },
                                getError: (key) => errors[`${sectionId}_${rowIndex}_${field.name}.${key}`],
                                clearError: (key) => {
                                  if (errors[`${sectionId}_${rowIndex}_${field.name}.${key}`]) {
                                    setErrors(prev => {
                                      const newErrors = { ...prev }
                                      delete newErrors[`${sectionId}_${rowIndex}_${field.name}.${key}`]
                                      return newErrors
                                    })
                                  }
                                }
                              }
                            }
                          })
                        ) : (
                          // Regular fields in repeaters
                          renderField({
                            ...field,
                            name: `${sectionId}_${rowIndex}_${field.name}`,
                            value: rowData[field.name] || '',
                            onChange: (fieldName, value) => handleRepeaterChange(rowIndex, field.name, value),
                            error: errors[`${sectionId}_${rowIndex}_${field.name}`]
                          })
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {addButtonPosition !== 'top' && initializedValue.length < maxRows && !isDisabled && (
            <div className="mt-4">
              <button
                type="button"
                onClick={addRepeaterRow}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                + {addLabel}
              </button>
            </div>
          )}
        </Card>
      )
    } else {
      // Regular Section - Grid Layout
      // On desktop: use absolute grid positioning with explicit gridRow/gridColumn
      // On mobile/tablet: use responsive Tailwind classes
      
      // Calculate max row for proper grid sizing
      const maxRow = (section.fields || []).length > 0 
        ? Math.max(...(section.fields || []).map(f => f.gridRow || 1))
        : 1

      return (
        <Card
          key={sectionId}
          id={sectionId}
          ref={!isNested ? (el) => (sectionRefs.current[sectionId] = el) : null}
          className={isNested ? 'mb-4 mt-4' : 'mb-6'}
        >
          <div className="mb-6">
            <h2 className={`font-bold text-gray-900 dark:text-gray-100 ${isNested ? 'text-base' : 'text-lg'}`}>{section.title || section.label}</h2>
            {section.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
            )}
          </div>

          {/* Desktop: Grid layout respecting gridRow and gridColumn from FormBuilder */}
          <div 
            className="hidden lg:grid grid-cols-12 gap-3"
            style={{
              gridAutoRows: 'min-content',
            }}
          >
            {section.fields.map(field => {
              const columnSpan = field.columnSpan || 12
              const gridColumn = field.gridColumn || 1
              const gridRow = field.gridRow || 1
              const span = typeof columnSpan === 'object' 
                ? (columnSpan.desktop || 4) 
                : (columnSpan || 4)

              return (
                <div
                  key={field.name}
                  className="w-full"
                  style={{
                    gridColumn: `${gridColumn} / span ${span}`,
                    gridRow: gridRow
                  }}
                >
                  {isNested ? (
                    renderField({
                      ...field,
                      value: dataContext().getData(field.name) || '',
                      onChange: (fieldName, value) => {
                        dataContext().setData(field.name, value)
                        dataContext().clearError(field.name)
                      },
                      error: dataContext().getError(field.name)
                    })
                  ) : (
                    renderField(field)
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile/Tablet: Responsive layout using Tailwind responsive classes */}
          <div className="lg:hidden grid grid-cols-12 gap-3">
            {sortFieldsByGridPosition(section.fields).map(field => {
              const columnSpan = field.columnSpan || 12

              return (
                <div
                  key={field.name}
                  className={getResponsiveColSpan(columnSpan)}
                >
                  {isNested ? (
                    renderField({
                      ...field,
                      value: dataContext().getData(field.name) || '',
                      onChange: (fieldName, value) => {
                        dataContext().setData(field.name, value)
                        dataContext().clearError(field.name)
                      },
                      error: dataContext().getError(field.name)
                    })
                  ) : (
                    renderField(field)
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )
    }
  }

  // Scroll spy for sections
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    }

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => {
      Object.values(sectionRefs.current).forEach(ref => {
        if (ref) observer.unobserve(ref)
      })
    }
  }, [currentPage])

  // Calculate section status
  const getSectionStatus = (section) => {
    if (section.type === 'repeater') {
      // Special status calculation for repeater sections
      const minRows = section.repeaterConfig?.minRows || 1
      const sectionValue = Array.isArray(formData[section.id]) ? formData[section.id] : []

      // Check for errors in this section
      const sectionErrors = Object.keys(errors).filter(key => key.startsWith(`${section.id}_`))
      if (sectionErrors.length > 0) return 'error'

      // Check if minimum rows requirement is met
      if (sectionValue.length >= minRows) return 'filled'

      return 'empty'
    } else {
      // Regular section status calculation
      const sectionFields = (section.fields || []).filter(field => {
        // Check dependency
        if (field.dependsOn) {
          const dependentValue = formData[field.dependsOn.field]
          return dependentValue === field.dependsOn.value
        }
        return true
      })

      // Check for errors in this section
      const hasErrors = sectionFields.some(field => errors[field.name])
      if (hasErrors) return 'error'

      // Check if all required fields are filled
      const requiredFields = sectionFields.filter(f => f.validation?.required)
      const allFilled = requiredFields.every(field => {
        const value = formData[field.name]
        return value !== undefined && value !== null && value !== ''
      })

      if (allFilled && requiredFields.length > 0) return 'filled'
      if (requiredFields.length === 0) return 'filled' // No required fields

      return 'empty'
    }
  }

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSectionId(sectionId)
    }
  }

  const currentPageData = pages[currentPage]
  const sectionsToRender = currentPageData?.sections || []

  // Action buttons renderer - can be used by parent or rendered at bottom
  const actionButtons = mode !== 'view' && (
    isMultiPage ? (
      <>
        <div className="flex gap-3 flex-1">
          {!isFirstPage && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
            >
              <FiChevronLeft className="mr-2" />
              Previous
            </Button>
          )}
          {!isLastPage ? (
            <Button
              type="button"
              onClick={handleNext}
            >
              Next
              <FiChevronRight className="ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              loading={loading}
            >
              Submit
            </Button>
          )}
        </div>
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            loading={loading}
          >
            <FiSave className="mr-2" />
            Save Draft
          </Button>
        )}
      </>
    ) : (
      <>
        <Button
          type="submit"
          loading={loading}
          className="flex-1 sm:flex-initial"
        >
          Submit
        </Button>
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            loading={loading}
          >
            <FiSave className="mr-2" />
            Save Draft
          </Button>
        )}
      </>
    )
  )

  return (
    <div className="flex relative h-full w-full">
      {/* Main Form Content */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        
          {/* Page Tabs for Multi-Page Forms */}
          {isMultiPage && (
          <div className="px-4 sm:px-6 lg:px-8 pt-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex overflow-x-auto">
                {pages.map((page, index) => (
                  <button
                    key={page.id || index}
                    type="button"
                    onClick={() => handleTabSwitch(index)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      currentPage === index
                        ? 'border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {page.title || `Page ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form 
          onSubmit={handleSubmit} 
          autoComplete="off"
          className="flex-1 flex flex-col min-h-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault()
              console.log('Enter key pressed, preventing default')
            }
          }}
        >
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          {sectionsToRender.map((section, sectionIndex) => renderSection(section, null, '', sectionIndex))}
        </div>
      
        {/* Footer with Action Buttons - Fixed at bottom */}
        {mode !== 'view' && (
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                {actionButtons}
              </div>
            </div>
          </div>
        )}
        </form>
      </div>

      {/* Mobile: Floating button to open right sidebar */}
      {sectionsToRender.length > 1 && mode !== 'view' && (
        <button
          onClick={() => setIsRightSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-30 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all"
          aria-label="Show sections"
        >
          <FiChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Right Sidebar - Section Navigation */}
      {sectionsToRender.length > 1 && mode !== 'view' && (
        <RightResizableSidebar
          minWidth={200}
          maxWidth={400}
          defaultWidth={256}
          collapsedWidth={48}
          storageKey="formSectionSidebarWidth"
          className="flex-shrink-0 h-full"
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
        >
          {({ isCollapsed }) => (
            <>
              {!isCollapsed && (
                <div className="h-full p-4 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Sections ({sectionsToRender.length})
                  </h3>
                  
                  <div className="space-y-2">
                    {sectionsToRender.map((section, index) => {
                      const sectionId = section.id || `section-${index}`
                      const status = getSectionStatus(section)
                      const isActive = activeSectionId === sectionId
                      
                      return (
                        <button
                          key={sectionId}
                          type="button"
                          onClick={() => {
                            scrollToSection(sectionId)
                            setIsRightSidebarOpen(false) // Close sidebar on mobile after clicking
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-md transition-all ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 dark:border-primary-600 ring-2 ring-primary-100 dark:ring-primary-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {/* Status Icon */}
                            <div className="mt-0.5 flex-shrink-0">
                              {status === 'filled' && (
                                <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              )}
                              {status === 'empty' && (
                                <FiCircle className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                              )}
                              {status === 'error' && (
                                <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            
                            {/* Section Title */}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${
                                isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {section.title}
                              </div>
                              
                              {/* Field Count */}
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {(section.fields || []).filter(f => {
                                  if (f.dependsOn) {
                                    const depValue = formData[f.dependsOn.field]
                                    return depValue === f.dependsOn.value
                                  }
                                  return true
                                }).length} fields
                              </div>
                              
                              {/* Viewing Indicator */}
                              {isActive && (
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400 animate-pulse" />
                                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">Viewing</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </RightResizableSidebar>
      )}
    </div>
  )
}

export default DynamicFormRenderer

