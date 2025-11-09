'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Card from '@/components/common/Card'
import { FiPlus, FiTrash2, FiChevronUp, FiChevronDown, FiCopy } from 'react-icons/fi'
import { v4 as uuidv4 } from 'uuid'

/**
 * Form Builder Component
 * Allows admins to create and edit dynamic forms with sections and fields
 */
const FormBuilder = ({ initialData = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sections: [],
    settings: {
      multiPage: false,
      showProgressBar: true,
      allowSaveDraft: true
    }
  })
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        sections: initialData.sections || [],
        settings: initialData.settings || {
          multiPage: false,
          showProgressBar: true,
          allowSaveDraft: true
        }
      })
      
      // Expand all sections by default when editing
      const expanded = {}
      initialData.sections?.forEach(section => {
        expanded[section.id] = true
      })
      setExpandedSections(expanded)
    }
  }, [initialData])

  const handleAddSection = () => {
    const newSection = {
      id: uuidv4(),
      title: 'New Section',
      description: '',
      fields: [],
      order: formData.sections.length
    }
    
    setFormData({
      ...formData,
      sections: [...formData.sections, newSection]
    })
    
    setExpandedSections({
      ...expandedSections,
      [newSection.id]: true
    })
  }

  const handleUpdateSection = (sectionId, updates) => {
    setFormData({
      ...formData,
      sections: formData.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    })
  }

  const handleDeleteSection = (sectionId) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter(s => s.id !== sectionId)
    })
  }

  const handleMoveSectionUp = (index) => {
    if (index === 0) return
    const sections = [...formData.sections]
    ;[sections[index - 1], sections[index]] = [sections[index], sections[index - 1]]
    setFormData({ ...formData, sections })
  }

  const handleMoveSectionDown = (index) => {
    if (index === formData.sections.length - 1) return
    const sections = [...formData.sections]
    ;[sections[index], sections[index + 1]] = [sections[index + 1], sections[index]]
    setFormData({ ...formData, sections })
  }

  const handleAddField = (sectionId) => {
    const newField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      placeholder: '',
      hint: '',
      validation: {
        required: false
      }
    }
    
    handleUpdateSection(sectionId, {
      fields: [
        ...(formData.sections.find(s => s.id === sectionId)?.fields || []),
        newField
      ]
    })
  }

  const handleUpdateField = (sectionId, fieldIndex, updates) => {
    const section = formData.sections.find(s => s.id === sectionId)
    const updatedFields = [...section.fields]
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...updates }
    
    handleUpdateSection(sectionId, { fields: updatedFields })
  }

  const handleDeleteField = (sectionId, fieldIndex) => {
    const section = formData.sections.find(s => s.id === sectionId)
    const updatedFields = section.fields.filter((_, i) => i !== fieldIndex)
    
    handleUpdateSection(sectionId, { fields: updatedFields })
  }

  const handleDuplicateField = (sectionId, fieldIndex) => {
    const section = formData.sections.find(s => s.id === sectionId)
    const field = section.fields[fieldIndex]
    const duplicatedField = {
      ...field,
      name: `${field.name}_copy_${Date.now()}`,
      label: `${field.label} (Copy)`
    }
    
    const updatedFields = [...section.fields]
    updatedFields.splice(fieldIndex + 1, 0, duplicatedField)
    
    handleUpdateSection(sectionId, { fields: updatedFields })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Form title is required')
      return
    }
    
    if (formData.sections.length === 0) {
      alert('Please add at least one section')
      return
    }
    
    setLoading(true)
    try {
      await onSave(formData)
    } catch (err) {
      // Error handled by parent
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections({
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId]
    })
  }

  return (
    <Card className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {initialData ? 'Edit Form' : 'Create New Form'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Basic Info */}
        <div className="space-y-4 pb-6 border-b border-gray-200">
          <Input
            label="Form Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Project Proposal Form"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of the form"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Form Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form Settings
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="multiPage"
                  checked={formData.settings.multiPage}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, multiPage: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="multiPage" className="text-sm text-gray-700">
                  Multi-page form (each section on separate page)
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showProgressBar"
                  checked={formData.settings.showProgressBar}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, showProgressBar: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="showProgressBar" className="text-sm text-gray-700">
                  Show progress bar (multi-page only)
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowSaveDraft"
                  checked={formData.settings.allowSaveDraft}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowSaveDraft: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="allowSaveDraft" className="text-sm text-gray-700">
                  Allow saving drafts
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Form Sections</h3>
            <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
              <FiPlus className="mr-2" />
              Add Section
            </Button>
          </div>

          {formData.sections.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-600 mb-4">No sections yet</p>
              <Button type="button" variant="outline" onClick={handleAddSection}>
                <FiPlus className="mr-2" />
                Add First Section
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.sections.map((section, sectionIndex) => (
                <div key={section.id} className="border border-gray-300 rounded-lg">
                  {/* Section Header */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-300">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                        className="font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder:text-gray-400"
                        placeholder="Section title"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveSectionUp(sectionIndex)}
                        disabled={sectionIndex === 0}
                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        title="Move up"
                      >
                        <FiChevronUp />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSectionDown(sectionIndex)}
                        disabled={sectionIndex === formData.sections.length - 1}
                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        title="Move down"
                      >
                        <FiChevronDown />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="px-2 py-1 text-sm text-primary-600 hover:text-primary-700"
                      >
                        {expandedSections[section.id] ? 'Collapse' : 'Expand'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Delete section"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  {/* Section Content */}
                  {expandedSections[section.id] && (
                    <div className="p-4 space-y-4">
                      <textarea
                        value={section.description}
                        onChange={(e) => handleUpdateSection(section.id, { description: e.target.value })}
                        placeholder="Section description (optional)"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />

                      {/* Fields */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900">Fields</h4>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddField(section.id)}
                          >
                            <FiPlus className="mr-1" />
                            Add Field
                          </Button>
                        </div>

                        {section.fields.length === 0 ? (
                          <div className="text-center py-4 border border-dashed border-gray-300 rounded">
                            <p className="text-sm text-gray-600 mb-2">No fields yet</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddField(section.id)}
                            >
                              Add Field
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {section.fields.map((field, fieldIndex) => (
                              <FieldEditor
                                key={fieldIndex}
                                field={field}
                                allFields={section.fields}
                                onChange={(updates) => handleUpdateField(section.id, fieldIndex, updates)}
                                onDelete={() => handleDeleteField(section.id, fieldIndex)}
                                onDuplicate={() => handleDuplicateField(section.id, fieldIndex)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <Button type="submit" loading={loading}>
            {initialData ? 'Update Form' : 'Create Form'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

/**
 * Field Editor Component
 * Allows editing individual field properties
 */
const FieldEditor = ({ field, allFields, onChange, onDelete, onDuplicate }) => {
  const [expanded, setExpanded] = useState(false)

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'date', label: 'Date' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select Dropdown' }
  ]

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between p-3 bg-gray-50">
        <div className="flex-1 flex items-center gap-3">
          <select
            value={field.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="text-sm border-gray-300 rounded bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
          >
            {fieldTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Field label"
            className="flex-1 text-sm border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {expanded ? 'Less' : 'More'}
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 text-gray-600 hover:text-gray-900"
            title="Duplicate"
          >
            <FiCopy />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-red-600 hover:text-red-700"
            title="Delete"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={field.name}
              onChange={(e) => onChange({ name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })}
              placeholder="Field name (e.g., project_name)"
              className="text-sm border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500"
            />
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              placeholder="Placeholder text"
              className="text-sm border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <input
            type="text"
            value={field.hint || ''}
            onChange={(e) => onChange({ hint: e.target.value })}
            placeholder="Help text (optional)"
            className="w-full text-sm border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500"
          />

          {/* Select Options */}
          {field.type === 'select' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Options (one per line, format: value|label)
              </label>
              <textarea
                value={(field.options || []).map(opt => `${opt.value}|${opt.label}`).join('\n')}
                onChange={(e) => {
                  const options = e.target.value.split('\n').filter(line => line.trim()).map(line => {
                    const [value, label] = line.split('|')
                    return { value: value.trim(), label: (label || value).trim() }
                  })
                  onChange({ options })
                }}
                placeholder="option1|Option 1&#10;option2|Option 2"
                rows={3}
                className="w-full text-sm border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${field.name}_searchable`}
                    checked={field.searchable || false}
                    onChange={(e) => onChange({ searchable: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor={`${field.name}_searchable`} className="text-xs text-gray-700">
                    Searchable dropdown
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${field.name}_multiSelect`}
                    checked={field.multiSelect || false}
                    onChange={(e) => onChange({ multiSelect: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor={`${field.name}_multiSelect`} className="text-xs text-gray-700">
                    Allow multiple selection
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Field Dependency */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Show this field only if:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={field.dependsOn?.field || ''}
                onChange={(e) => onChange({
                  dependsOn: e.target.value ? { field: e.target.value, value: field.dependsOn?.value || '' } : null
                })}
                className="text-sm border-gray-300 rounded bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">No dependency</option>
                {allFields.filter(f => f.name !== field.name).map(f => (
                  <option key={f.name} value={f.name}>{f.label}</option>
                ))}
              </select>
              {field.dependsOn?.field && (
                <input
                  type="text"
                  value={field.dependsOn?.value || ''}
                  onChange={(e) => onChange({
                    dependsOn: { ...field.dependsOn, value: e.target.value }
                  })}
                  placeholder="equals this value"
                  className="text-sm border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500"
                />
              )}
            </div>
          </div>

          {/* Validation */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Validation
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`${field.name}_required`}
                  checked={field.validation?.required || false}
                  onChange={(e) => onChange({
                    validation: { ...field.validation, required: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor={`${field.name}_required`} className="text-xs text-gray-700">
                  Required field
                </label>
              </div>

              {['text', 'textarea'].includes(field.type) && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) => onChange({
                      validation: { ...field.validation, minLength: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="Min length"
                    className="text-sm border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) => onChange({
                      validation: { ...field.validation, maxLength: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                    placeholder="Max length"
                    className="text-sm border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              <input
                type="text"
                value={field.validation?.message || ''}
                onChange={(e) => onChange({
                  validation: { ...field.validation, message: e.target.value }
                })}
                placeholder="Custom validation message"
                className="w-full text-sm border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormBuilder

