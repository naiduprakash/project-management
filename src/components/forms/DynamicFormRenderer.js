'use client'

import { useState, useEffect, useRef } from 'react'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import RightResizableSidebar from '@/components/common/RightResizableSidebar'
import { useToast } from '@/context/ToastContext'
import { FiChevronRight, FiChevronLeft, FiSave, FiCheckCircle, FiCircle, FiAlertCircle } from 'react-icons/fi'

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
    
    section.fields.forEach(field => {
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
      page.sections.forEach(section => {
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
    // Check dependency
    if (field.dependsOn) {
      const dependentValue = formData[field.dependsOn.field]
      if (dependentValue !== field.dependsOn.value) {
        return null // Hide field
      }
    }

    const value = formData[field.name] || ''
    const error = errors[field.name]
    const isDisabled = mode === 'view'

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            label={field.label}
            type={field.type}
            name={field.name}
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
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
            label={field.label}
            type="number"
            name={field.name}
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
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
            label={field.label}
            type="date"
            name={field.name}
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
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
            <label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              name={field.name}
              value={value || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 4}
              disabled={isDisabled}
              autoComplete="off"
              className={`px-3 py-2.5 border rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all ${
                error ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-300'
              } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
            />
            {field.hint && !error && (
              <p className="text-xs text-gray-500">{field.hint}</p>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.searchable ? (
              // Searchable select (simplified - in production, use a library like react-select)
              <select
                name={field.name}
                value={value || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={isDisabled}
                className={`px-3 py-2.5 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all ${
                  error ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-300'
                } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
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
                  handleChange(field.name, selected)
                }}
                multiple
                disabled={isDisabled}
                className={`px-3 py-2.5 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all ${
                  error ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-300'
                } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
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
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={isDisabled}
                className={`px-3 py-2.5 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all ${
                  error ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-300'
                } ${isDisabled ? 'bg-gray-100 text-gray-500' : ''}`}
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
              <p className="text-xs text-gray-500">{field.hint}</p>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        )

      default:
        return null
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
    const sectionFields = section.fields.filter(field => {
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
    <div className={`flex relative ${mode !== 'view' ? 'h-full' : ''}`}>
      {/* Main Form Content */}
      <div className={`flex-1 min-w-0 flex flex-col ${mode !== 'view' ? 'h-full' : ''}`}>
        
        <div className={`flex-1 ${mode !== 'view' ? 'overflow-y-auto' : ''} px-4 sm:px-6 lg:px-8 py-8`}>
          {/* Page Tabs for Multi-Page Forms */}
          {isMultiPage && (
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault()
              console.log('Enter key pressed, preventing default')
            }
          }}
        >
          {sectionsToRender.map((section, sectionIndex) => (
            <Card
              key={section.id || sectionIndex}
              id={section.id || `section-${sectionIndex}`}
              ref={(el) => (sectionRefs.current[section.id || `section-${sectionIndex}`] = el)}
              className="mb-6"
            >
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{section.title}</h2>
                {section.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-12 gap-3">
                {section.fields.map(field => {
                  const columnSpan = field.columnSpan || 12;
                  const gridColumn = field.gridColumn || 1;
                  const gridRow = field.gridRow || 1;
                  
                  return (
                    <div
                      key={field.name}
                      className={`col-span-${columnSpan}`}
                      style={{
                        gridColumn: `${gridColumn} / span ${columnSpan}`,
                        gridRow: gridRow
                      }}
                    >
                      {renderField(field)}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </form>
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
      </div>

      {/* Right Sidebar - Section Navigation */}
      {sectionsToRender.length > 1 && mode !== 'view' && (
        <RightResizableSidebar
          minWidth={200}
          maxWidth={400}
          defaultWidth={256}
          collapsedWidth={48}
          storageKey="formSectionSidebarWidth"
          className="hidden xl:flex flex-shrink-0 h-full"
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
                          onClick={() => scrollToSection(sectionId)}
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
                                {section.fields.filter(f => {
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

