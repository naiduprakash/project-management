'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Card from '@/components/common/Card'
import { FiPlus, FiTrash2, FiChevronUp, FiChevronDown, FiCopy, FiFile } from 'react-icons/fi'
import { v4 as uuidv4 } from 'uuid'

/**
 * Form Builder Component - New Structure
 * Pages > Sections > Fields
 * First page always has title and description fields
 */
const FormBuilder = ({ form = null, initialData = null, onSave, onCancel }) => {
  const formToEdit = form || initialData
  
  const createFirstPage = () => ({
    id: uuidv4(),
    title: 'Page 1',
    sections: [
      {
        id: uuidv4(),
        title: 'Basic Information',
        description: '',
        fields: [
          {
            id: uuidv4(),
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true,
            placeholder: 'Enter title',
            validation: { required: true, message: 'Title is required' }
          },
          {
            id: uuidv4(),
            name: 'description',
            label: 'Description',
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
    settings: {
      multiPage: false,
      showProgressBar: true,
      allowSaveDraft: true
    }
  })
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

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
          settings: formToEdit.settings || {
            multiPage: false,
            showProgressBar: true,
            allowSaveDraft: true
          }
        })
      } else {
        // New structure
        setFormData({
          title: formToEdit.title || '',
          description: formToEdit.description || '',
          pages: formToEdit.pages || [createFirstPage()],
          settings: formToEdit.settings || {
            multiPage: false,
            showProgressBar: true,
            allowSaveDraft: true
          }
        })
      }
      
      // Expand all sections
      const expanded = {}
      const pages = formToEdit.pages || [createFirstPage()]
      pages.forEach(page => {
        page.sections?.forEach(section => {
          expanded[section.id] = true
        })
      })
      setExpandedSections(expanded)
    } else {
      // New form
      const firstPage = createFirstPage()
      setFormData({
        title: '',
        description: '',
        pages: [firstPage],
        settings: {
          multiPage: false,
          showProgressBar: true,
          allowSaveDraft: true
        }
      })
      
      // Expand first section
      setExpandedSections({ [firstPage.sections[0].id]: true })
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
    setExpandedSections({
      ...expandedSections,
      [newPage.sections[0].id]: true
    })
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
    setExpandedSections({ ...expandedSections, [newSection.id]: true })
  }

  const handleDeleteSection = (pageIndex, sectionIndex) => {
    // Don't allow deleting the first section of the first page (has title/description)
    if (pageIndex === 0 && sectionIndex === 0) {
      alert('Cannot delete the basic information section')
      return
    }
    
    if (!confirm('Delete this section and all its fields?')) return
    
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
      placeholder: '',
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

  const handleDeleteField = (pageIndex, sectionIndex, fieldIndex) => {
    // Don't allow deleting title or description from first section
    if (pageIndex === 0 && sectionIndex === 0 && fieldIndex < 2) {
      alert('Cannot delete title or description fields')
      return
    }
    
    if (!confirm('Delete this field?')) return
    
    const updatedPages = [...formData.pages]
    const section = updatedPages[pageIndex].sections[sectionIndex]
    updatedPages[pageIndex].sections[sectionIndex] = {
      ...section,
      fields: section.fields.filter((_, i) => i !== fieldIndex)
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleMoveField = (pageIndex, sectionIndex, fieldIndex, direction) => {
    // Don't allow moving title or description
    if (pageIndex === 0 && sectionIndex === 0 && fieldIndex < 2) return
    
    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1
    const updatedPages = [...formData.pages]
    const section = updatedPages[pageIndex].sections[sectionIndex]
    const fields = [...section.fields]
    
    ;[fields[fieldIndex], fields[newIndex]] = [fields[newIndex], fields[fieldIndex]]
    
    updatedPages[pageIndex].sections[sectionIndex] = { ...section, fields }
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Please enter a form title')
      return
    }
    
    if (formData.pages.length === 0) {
      alert('Form must have at least one page')
      return
    }
    
    setLoading(true)
    try {
      await onSave(formData)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setLoading(false)
    }
  }

  const currentPage = formData.pages[currentPageIndex]

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Form Settings */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Form Settings</h2>
          
          <div className="space-y-4">
            <Input
              label="Form Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Construction Project Form"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optional description for this form"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.settings.showProgressBar}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, showProgressBar: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show Progress Bar</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.settings.allowSaveDraft}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowSaveDraft: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Allow Save Draft</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Page Tabs */}
        {formData.pages.length > 1 && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pages</h3>
              <Button type="button" size="sm" onClick={handleAddPage}>
                <FiPlus className="mr-1" /> Add Page
              </Button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {formData.pages.map((page, index) => (
                <div key={page.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPageIndex(index)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete page"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Current Page Content */}
        {currentPage && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <Input
                label="Page Title"
                value={currentPage.title}
                onChange={(e) => handleUpdatePage(currentPageIndex, { title: e.target.value })}
                placeholder="e.g., Basic Information"
              />
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {currentPage.sections.map((section, sectionIndex) => (
                <Card key={section.id} className="border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <Input
                      label="Section Title"
                      value={section.title}
                      onChange={(e) => handleUpdateSection(currentPageIndex, sectionIndex, { title: e.target.value })}
                      placeholder="Section name"
                    />
                    
                    {!(currentPageIndex === 0 && sectionIndex === 0) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(currentPageIndex, sectionIndex)}
                        className="text-red-600"
                      >
                        <FiTrash2 />
                      </Button>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="space-y-3 mb-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={field.id} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <Input
                              label="Field Label"
                              value={field.label}
                              onChange={(e) => handleUpdateField(currentPageIndex, sectionIndex, fieldIndex, { label: e.target.value })}
                              disabled={currentPageIndex === 0 && sectionIndex === 0 && fieldIndex < 2}
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={field.type}
                                onChange={(e) => handleUpdateField(currentPageIndex, sectionIndex, fieldIndex, { type: e.target.value })}
                                disabled={currentPageIndex === 0 && sectionIndex === 0 && fieldIndex < 2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="email">Email</option>
                                <option value="tel">Phone</option>
                                <option value="date">Date</option>
                                <option value="textarea">Textarea</option>
                                <option value="select">Select</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="radio">Radio</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex gap-1 ml-2">
                            {!(currentPageIndex === 0 && sectionIndex === 0 && fieldIndex < 2) && (
                              <>
                                {fieldIndex > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveField(currentPageIndex, sectionIndex, fieldIndex, 'up')}
                                    className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                                  >
                                    <FiChevronUp size={16} />
                                  </button>
                                )}
                                {fieldIndex < section.fields.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveField(currentPageIndex, sectionIndex, fieldIndex, 'down')}
                                    className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                                  >
                                    <FiChevronDown size={16} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(currentPageIndex, sectionIndex, fieldIndex)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Placeholder"
                            value={field.placeholder || ''}
                            onChange={(e) => handleUpdateField(currentPageIndex, sectionIndex, fieldIndex, { placeholder: e.target.value })}
                          />
                          <label className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              checked={field.required || false}
                              onChange={(e) => handleUpdateField(currentPageIndex, sectionIndex, fieldIndex, { 
                                required: e.target.checked,
                                validation: { ...field.validation, required: e.target.checked }
                              })}
                              disabled={currentPageIndex === 0 && sectionIndex === 0 && fieldIndex === 0}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
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
                </Card>
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

        {/* Add Page Button (for single page) */}
        {formData.pages.length === 1 && (
          <Card className="mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPage}
            >
              <FiFile className="mr-2" /> Add Page (Convert to Multi-Page Form)
            </Button>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Form
          </Button>
        </div>
      </form>
    </div>
  )
}

export default FormBuilder

