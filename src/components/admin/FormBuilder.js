'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Card from '@/components/common/Card'
import FormSectionNav from '@/components/admin/FormSectionNav'
import FieldConfigPanel from '@/components/admin/FieldConfigPanel'
import { FiPlus, FiTrash2, FiSettings, FiChevronRight } from 'react-icons/fi'
import { v4 as uuidv4 } from 'uuid'

/**
 * Form Builder Component - New Structure
 * Pages > Sections > Fields
 * First page always has title and description fields
 */
const FormBuilder = ({ form = null, initialData = null, onSave, onCancel }) => {
  const formToEdit = form || initialData
  
  const createFirstPage = (pageTitle = '', pageDescription = '') => ({
    id: uuidv4(),
    title: 'Page 1',
    sections: [
      {
        id: uuidv4(),
        title: 'Entry Details',
        description: 'Information for each entry',
        fields: [
          {
            id: uuidv4(),
            name: 'title',
            label: 'Entry Title',
            type: 'text',
            required: true,
            placeholder: 'Enter title',
            validation: { required: true, message: 'Title is required' }
          },
          {
            id: uuidv4(),
            name: 'description',
            label: 'Entry Description',
            type: 'textarea',
            required: false,
            placeholder: 'Enter description',
            rows: 3
          }
        ]
      }
    ]
  })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pages: [createFirstPage()],
    published: false, // Draft by default
    settings: {
      multiPage: false
    }
  })
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [sectionStatus, setSectionStatus] = useState({})
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [editingConfig, setEditingConfig] = useState(null) // { type: 'section'|'field', pageIndex, sectionIndex, fieldIndex?, data }
  const [configHasChanges, setConfigHasChanges] = useState(false)
  const sectionRefs = useRef({})

  useEffect(() => {
    console.log('FormBuilder received form data:', formToEdit)
    if (formToEdit) {
      // Convert old structure to new if needed
      if (formToEdit.sections && !formToEdit.pages) {
        // Old structure - convert to new
        const firstPage = createFirstPage()
        const pages = formToEdit.settings?.multiPage
          ? formToEdit.sections.map((section, index) => ({
              id: section.id || uuidv4(),
              title: `Page ${index + 1}`,
              sections: [section]
            }))
          : [{
              ...firstPage,
              sections: [firstPage.sections[0], ...formToEdit.sections]
            }]
        
        setFormData({
          title: formToEdit.title || '',
          description: formToEdit.description || '',
          pages: pages.length > 0 ? pages : [firstPage],
          published: formToEdit.published || false,
          settings: formToEdit.settings || {
            multiPage: false
          }
        })
      } else {
        // New structure
        setFormData({
          title: formToEdit.title || '',
          description: formToEdit.description || '',
          pages: formToEdit.pages || [createFirstPage()],
          published: formToEdit.published || false,
          settings: formToEdit.settings || {
            multiPage: false
          }
        })
      }
      
      // All sections expanded by default (collapsed state is empty)
      const pages = formToEdit.pages || [createFirstPage()]
    } else {
      // New form
      const firstPage = createFirstPage()
      setFormData({
        title: '',
        description: '',
        pages: [firstPage],
        published: false,
        settings: {
          multiPage: false
        }
      })
      
      // All sections expanded by default
    }
  }, [formToEdit])

  // Page Management
  const handleAddPage = () => {
    const newPage = {
      id: uuidv4(),
      title: `Page ${formData.pages.length + 1}`,
      sections: [{
        id: uuidv4(),
        title: 'New Section',
        description: '',
        fields: []
      }]
    }
    
    setFormData({
      ...formData,
      pages: [...formData.pages, newPage],
      settings: { ...formData.settings, multiPage: true }
    })
    
    setCurrentPageIndex(formData.pages.length)
    // New sections are expanded by default
  }

  const handleDeletePage = (pageIndex) => {
    if (pageIndex === 0) {
      alert('Cannot delete the first page')
      return
    }
    
    if (!confirm('Delete this page and all its sections?')) return
    
    const newPages = formData.pages.filter((_, i) => i !== pageIndex)
    setFormData({
      ...formData,
      pages: newPages,
      settings: {
        ...formData.settings,
        multiPage: newPages.length > 1
      }
    })
    
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1)
    }
  }

  const handleUpdatePage = (pageIndex, updates) => {
    setFormData({
      ...formData,
      pages: formData.pages.map((page, i) =>
        i === pageIndex ? { ...page, ...updates } : page
      )
    })
  }

  // Section Management
  const handleAddSection = (pageIndex) => {
    const newSection = {
      id: uuidv4(),
      title: 'New Section',
      description: '',
      fields: []
    }
    
    const updatedPages = [...formData.pages]
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      sections: [...updatedPages[pageIndex].sections, newSection]
    }
    
    setFormData({ ...formData, pages: updatedPages })
    // New sections are expanded by default
  }

  const handleDeleteSection = (pageIndex, sectionIndex) => {
    const section = formData.pages[pageIndex].sections[sectionIndex]
    
    if (!confirm(`Delete section "${section.title}" and all its fields?`)) return
    
    const updatedPages = [...formData.pages]
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      sections: updatedPages[pageIndex].sections.filter((_, i) => i !== sectionIndex)
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleUpdateSection = (pageIndex, sectionIndex, updates) => {
    const updatedPages = [...formData.pages]
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      sections: updatedPages[pageIndex].sections.map((section, i) =>
        i === sectionIndex ? { ...section, ...updates } : section
      )
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  // Field Management  
  const handleAddField = (pageIndex, sectionIndex) => {
    const newField = {
      id: uuidv4(),
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: 'Enter value...',
      hint: '',
      validation: {}
    }
    
    const updatedPages = [...formData.pages]
    const section = updatedPages[pageIndex].sections[sectionIndex]
    updatedPages[pageIndex].sections[sectionIndex] = {
      ...section,
      fields: [...section.fields, newField]
    }
    
    setFormData({ ...formData, pages: updatedPages })
    
    // Auto-open config for new field
    setTimeout(() => {
      handleOpenFieldConfig(pageIndex, sectionIndex, section.fields.length)
    }, 100)
  }

  const handleUpdateField = (pageIndex, sectionIndex, fieldIndex, updates) => {
    const updatedPages = [...formData.pages]
    const section = updatedPages[pageIndex].sections[sectionIndex]
    updatedPages[pageIndex].sections[sectionIndex] = {
      ...section,
      fields: section.fields.map((field, i) =>
        i === fieldIndex ? { ...field, ...updates } : field
      )
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleOpenSectionConfig = (pageIndex, sectionIndex) => {
    const section = formData.pages[pageIndex].sections[sectionIndex]
    
    // Check if already editing the same section
    const isSameConfig = editingConfig && 
                         editingConfig.type === 'section' && 
                         editingConfig.pageIndex === pageIndex && 
                         editingConfig.sectionIndex === sectionIndex
    
    if (isSameConfig) {
      return // Already open, do nothing
    }
    
    // Check if there are unsaved changes in current config
    if (editingConfig && configHasChanges) {
      if (!confirm('You have unsaved changes. Switching will discard them. Continue?')) {
        return
      }
    }
    
    setEditingConfig({
      type: 'section',
      pageIndex,
      sectionIndex,
      data: { ...section } // Create a new object reference
    })
    setConfigHasChanges(false)
  }

  const handleOpenFieldConfig = (pageIndex, sectionIndex, fieldIndex) => {
    const field = formData.pages[pageIndex].sections[sectionIndex].fields[fieldIndex]
    
    // Check if already editing the same field
    const isSameConfig = editingConfig && 
                         editingConfig.type === 'field' && 
                         editingConfig.pageIndex === pageIndex && 
                         editingConfig.sectionIndex === sectionIndex && 
                         editingConfig.fieldIndex === fieldIndex
    
    if (isSameConfig) {
      return // Already open, do nothing
    }
    
    // Check if there are unsaved changes in current config
    if (editingConfig && configHasChanges) {
      if (!confirm('You have unsaved changes. Switching will discard them. Continue?')) {
        return
      }
    }
    
    setEditingConfig({
      type: 'field',
      pageIndex,
      sectionIndex,
      fieldIndex,
      data: { ...field } // Create a new object reference
    })
    setConfigHasChanges(false)
  }

  const handleSaveConfig = (updatedData) => {
    if (!editingConfig) return
    
    if (editingConfig.type === 'section') {
      handleUpdateSection(editingConfig.pageIndex, editingConfig.sectionIndex, updatedData)
    } else if (editingConfig.type === 'field') {
      handleUpdateField(
        editingConfig.pageIndex,
        editingConfig.sectionIndex,
        editingConfig.fieldIndex,
        updatedData
      )
    }
    setConfigHasChanges(false)
  }

  const handleConfigChange = () => {
    setConfigHasChanges(true)
  }

  const handleCloseConfig = () => {
    setEditingConfig(null)
    setConfigHasChanges(false)
  }

  const handleDeleteField = (pageIndex, sectionIndex, fieldIndex) => {
    if (!confirm('Delete this field?')) return
    
    const updatedPages = [...formData.pages]
    updatedPages[pageIndex].sections[sectionIndex] = {
      ...section,
      fields: section.fields.filter((_, i) => i !== fieldIndex)
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleMoveField = (pageIndex, sectionIndex, fieldIndex, direction) => {
    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1
    const updatedPages = [...formData.pages]
    const fields = [...section.fields]
    
    ;[fields[fieldIndex], fields[newIndex]] = [fields[newIndex], fields[fieldIndex]]
    
    updatedPages[pageIndex].sections[sectionIndex] = { ...section, fields }
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    if (formData.pages.length === 0) {
      alert('Form must have at least one page')
      return
    }
    
    // Check if all pages have titles
    const missingTitles = formData.pages.some(page => !page.title || !page.title.trim())
    if (missingTitles) {
      alert('Please provide a title for all pages')
      return
    }
    
    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        published: false,
        title: formData.title || 'Untitled Form',
        description: formData.description || ''
      }
      console.log('Saving form data (Draft):', dataToSave)
      console.log('Number of pages:', dataToSave.pages.length)
      console.log('First page sections:', dataToSave.pages[0].sections)
      
      await onSave(dataToSave)
      console.log('Save successful!')
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndPublish = async (e) => {
    e.preventDefault()
    
    if (formData.pages.length === 0) {
      alert('Form must have at least one page')
      return
    }
    
    // Check if all pages have titles
    const missingTitles = formData.pages.some(page => !page.title || !page.title.trim())
    if (missingTitles) {
      alert('Please provide a title for all pages')
      return
    }
    
    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        published: true,
        title: formData.title || 'Untitled Form',
        description: formData.description || ''
      }
      console.log('Saving form data (Publish):', dataToSave)
      console.log('Number of pages:', dataToSave.pages.length)
      console.log('First page sections:', dataToSave.pages[0].sections)
      
      await onSave(dataToSave)
      console.log('Save & Publish successful!')
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save and publish. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const scrollToSection = (sectionId) => {
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Update section status based on field validation
  useEffect(() => {
    const newStatus = {}
    formData.pages.forEach(page => {
      page.sections?.forEach(section => {
        const hasFields = section.fields?.length > 0
        const hasRequiredFields = section.fields?.some(f => f.required)
        
        if (!hasFields) {
          newStatus[section.id] = 'empty'
        } else if (hasRequiredFields) {
          newStatus[section.id] = 'empty' // Has required fields (shown as empty in builder)
        } else {
          newStatus[section.id] = 'valid'
        }
      })
    })
    setSectionStatus(newStatus)
  }, [formData])

  // Scroll spy to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id')
            if (sectionId) {
              setActiveSectionId(sectionId)
            }
          }
        })
      },
      {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      }
    )

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => {
      Object.values(sectionRefs.current).forEach((ref) => {
        if (ref) observer.unobserve(ref)
      })
    }
  }, [formData.pages, currentPageIndex])

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Helper to render field preview (as users will see it)
  const renderFieldPreview = (field, pageIndex, sectionIndex, fieldIndex) => {
    const commonClasses = "w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400"
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || ''}
            rows={field.rows || 3}
            className={commonClasses}
            disabled
          />
        )
      case 'select':
        return (
          <select className={commonClasses} disabled>
            <option>{field.placeholder || 'Select an option...'}</option>
            {(field.options || []).map((opt, i) => (
              <option key={i}>{typeof opt === 'object' ? opt.label || opt.value : opt}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600"
              disabled
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {(field.options || ['Option 1', 'Option 2']).map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.name}
                  className="border-gray-300 text-primary-600"
                  disabled
                />
                <span className="text-sm text-gray-700">{typeof opt === 'object' ? opt.label || opt.value : opt}</span>
              </label>
            ))}
          </div>
        )
      default:
        return (
          <input
            type={field.type || 'text'}
            placeholder={field.placeholder || ''}
            className={commonClasses}
            disabled
          />
        )
    }
  }

  const currentPage = formData.pages[currentPageIndex]

  return (
    <div className="flex gap-6">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <form onSubmit={handleSubmit} id="form-builder-form">
          {/* Hidden submit button for external trigger */}
          <button type="submit" id="form-builder-submit" className="hidden" />
          <button type="button" id="form-builder-publish" onClick={handleSaveAndPublish} className="hidden" />
          
          {/* Page Tabs */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                {formData.pages.map((page, index) => (
                  <div key={page.id} className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setCurrentPageIndex(index)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        currentPageIndex === index
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page.title}
                    </button>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeletePage(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete page"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button type="button" size="sm" onClick={handleAddPage} className="flex-shrink-0">
                <FiPlus className="mr-1" /> Add Page
              </Button>
            </div>
          </div>

        {/* Current Page Content */}
        {currentPage && (
          <Card className="mb-6">
            {/* Page Settings */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Page Settings
              </h3>
              
              <div className="space-y-4">
                <Input
                  label={currentPageIndex === 0 ? "First Page Title" : "Page Title"}
                  value={currentPage.title}
                  onChange={(e) => handleUpdatePage(currentPageIndex, { title: e.target.value })}
                  placeholder="e.g., Basic Information"
                  hint={currentPageIndex === 0 ? "Title for the first page" : `Title for page ${currentPageIndex + 1}`}
                />
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {currentPage.sections.map((section, sectionIndex) => (
                <div 
                  key={section.id} 
                  ref={el => sectionRefs.current[section.id] = el}
                  data-section-id={section.id}
                  className="scroll-mt-24"
                >
                  <Card className="border-2 border-gray-200">
                    {/* Section Header - Collapsible */}
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-md transition-colors"
                        title={collapsedSections[section.id] ? "Expand section" : "Collapse section"}
                      >
                        <FiChevronRight 
                          className={`w-5 h-5 text-gray-600 transition-transform ${
                            collapsedSections[section.id] ? '' : 'rotate-90'
                          }`}
                        />
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {section.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            ({section.fields?.length || 0} fields)
                          </span>
                        </div>
                        {section.description && !collapsedSections[section.id] && (
                          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenSectionConfig(currentPageIndex, sectionIndex)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Section Settings"
                        >
                          <FiSettings size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(currentPageIndex, sectionIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Section"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Section Content - Collapsible */}
                    {!collapsedSections[section.id] && (
                      <>
                  {/* Fields - Visual Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div 
                        key={field.id} 
                        className={`relative group ${field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}`}
                      >
                        {/* Field Preview */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {renderFieldPreview(field, currentPageIndex, sectionIndex, fieldIndex)}
                          {field.hint && (
                            <p className="text-xs text-gray-500 mt-1">{field.hint}</p>
                          )}
                          
                          {/* Overlay controls on hover */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-md transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenFieldConfig(currentPageIndex, sectionIndex, fieldIndex)}
                                className="p-2 bg-white shadow-lg rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                                title="Configure field"
                              >
                                <FiSettings className="w-5 h-5 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteField(currentPageIndex, sectionIndex, fieldIndex)}
                                className="p-2 bg-white shadow-lg rounded-md border border-red-300 hover:bg-red-50 transition-colors"
                                title="Delete field"
                              >
                                <FiTrash2 className="w-5 h-5 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField(currentPageIndex, sectionIndex)}
                  >
                    <FiPlus className="mr-1" /> Add Field
                  </Button>
                      </>
                    )}
                  </Card>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddSection(currentPageIndex)}
              className="mt-4"
            >
              <FiPlus className="mr-1" /> Add Section
            </Button>
          </Card>
        )}
        </form>
      </div>

      {/* Right Sidebar - Section Navigation */}
      <div className="w-64 flex-shrink-0">
        <FormSectionNav
          pages={formData.pages}
          currentPageIndex={currentPageIndex}
          onSectionClick={scrollToSection}
          sectionStatus={sectionStatus}
          activeSectionId={activeSectionId}
        />
      </div>

      {/* Field/Section Config Panel */}
      {editingConfig && (
        <FieldConfigPanel
          field={editingConfig.data}
          type={editingConfig.type}
          onSave={handleSaveConfig}
          onClose={handleCloseConfig}
          onConfigChange={handleConfigChange}
        />
      )}
    </div>
  )
}

export default FormBuilder

