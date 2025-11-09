'use client'

import { useState, useEffect } from 'react'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import { FiChevronRight, FiChevronLeft, FiSave } from 'react-icons/fi'

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
  const [formData, setFormData] = useState(initialData)
  const [currentPage, setCurrentPage] = useState(0)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const isMultiPage = form.settings?.multiPage && form.sections.length > 1
  const totalPages = isMultiPage ? form.sections.length : 1
  const isLastPage = currentPage === totalPages - 1
  const isFirstPage = currentPage === 0

  useEffect(() => {
    setFormData(initialData)
  }, [initialData])

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
      const currentSection = form.sections[currentPage]
      const sectionErrors = validateSection(currentSection)
      
      if (Object.keys(sectionErrors).length > 0) {
        setErrors(sectionErrors)
        console.log('Validation errors:', sectionErrors)
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
    const newPage = currentPage - 1
    console.log('Moving to page:', newPage)
    setCurrentPage(newPage)
    setErrors({}) // Clear errors when moving to previous page
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Form submit triggered, current page:', currentPage, 'isLastPage:', isLastPage)
    
    // Validate current section
    const currentSection = isMultiPage ? form.sections[currentPage] : null
    if (currentSection) {
      const sectionErrors = validateSection(currentSection)
      if (Object.keys(sectionErrors).length > 0) {
        setErrors(sectionErrors)
        console.log('Current section validation errors:', sectionErrors)
        return
      }
    }
    
    // Validate all sections
    const allErrors = {}
    form.sections.forEach(section => {
      const sectionErrors = validateSection(section)
      Object.assign(allErrors, sectionErrors)
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

  const sectionsToRender = isMultiPage ? [form.sections[currentPage]] : form.sections

  return (
    <div>
      {/* Progress bar for multi-page forms */}
      {isMultiPage && form.settings?.showProgressBar && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentPage + 1} of {totalPages}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentPage + 1) / totalPages) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            />
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
          <div key={section.id || sectionIndex} className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.fields.map(field => (
                <div key={field.name} className={field.type === 'textarea' ? 'lg:col-span-3 md:col-span-2' : ''}>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Form Actions */}
        {mode !== 'view' && (
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            {isMultiPage ? (
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
                {form.settings?.allowSaveDraft && onSaveDraft && (
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
                {form.settings?.allowSaveDraft && onSaveDraft && (
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
            )}
          </div>
        )}
      </form>
    </div>
  )
}

export default DynamicFormRenderer

