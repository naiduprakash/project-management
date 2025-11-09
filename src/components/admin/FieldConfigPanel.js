'use client'

import { useState, useEffect } from 'react'
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'

/**
 * Field Configuration Panel - Slide-out panel for editing field, section, or page properties
 */
const FieldConfigPanel = ({ field, onSave, onClose, type = 'field', onConfigChange }) => {
  const [config, setConfig] = useState(field)
  const [isDirty, setIsDirty] = useState(false)

  // For backward compatibility
  const isSection = type === 'section'
  const isPage = type === 'page'

  // Reset state when field prop changes (switching between different fields/sections/pages)
  useEffect(() => {
    setConfig(field)
    setIsDirty(false)
  }, [field])

  const handleSave = () => {
    onSave(config)
    setIsDirty(false)
    onClose()
  }

  const handleClose = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        setIsDirty(false)
        onClose()
      }
    } else {
      onClose()
    }
  }

  // Update config and mark as dirty
  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
    if (onConfigChange) {
      onConfigChange()
    }
  }

  const addOption = () => {
    const newOptions = [...(config.options || []), '']
    setConfig({ ...config, options: newOptions })
    setIsDirty(true)
    if (onConfigChange) {
      onConfigChange()
    }
  }

  const updateOption = (index, value) => {
    const newOptions = [...config.options]
    newOptions[index] = value
    setConfig({ ...config, options: newOptions })
    setIsDirty(true)
    if (onConfigChange) {
      onConfigChange()
    }
  }

  const deleteOption = (index) => {
    const newOptions = config.options.filter((_, i) => i !== index)
    setConfig({ ...config, options: newOptions })
    setIsDirty(true)
    if (onConfigChange) {
      onConfigChange()
    }
  }

  // Check if there are unsaved changes before switching fields
  const hasUnsavedChanges = () => isDirty

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isPage ? 'Tab Settings' : isSection ? 'Section Settings' : 'Field Settings'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {isPage ? 'Configure tab properties' : isSection ? 'Configure section properties' : 'Configure field properties and validation'}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {isPage ? (
          /* Tab Configuration */
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tab Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={config.title || ''}
                onChange={(e) => updateConfig({ title: e.target.value })}
                placeholder="e.g., Basic Information, Contact Details"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Title displayed in the tab
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tab Description
              </label>
              <textarea
                value={config.description || ''}
                onChange={(e) => updateConfig({ description: e.target.value })}
                placeholder="Brief description of this tab (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional description for this tab
              </p>
            </div>
          </>
        ) : isSection ? (
          <>
            {/* Section Configuration */}
            <Input
              label="Section Title"
              value={config.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder="e.g., Project Information"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Description
              </label>
              <textarea
                value={config.description || ''}
                onChange={(e) => updateConfig({ description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optional description for this section"
              />
            </div>
          </>
        ) : (
          <>
            {/* Field Configuration */}
            <Input
              label="Field Label"
              value={config.label}
              onChange={(e) => updateConfig({ label: e.target.value })}
              placeholder="e.g., Project Name"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
              <select
                value={config.type}
                onChange={(e) => updateConfig({ type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="date">Date</option>
                <option value="textarea">Textarea</option>
                <option value="select">Select Dropdown</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Width (Column Span)
              </label>
              <select
                value={config.columnSpan || 12}
                onChange={(e) => updateConfig({ columnSpan: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={12}>Full Width (12/12)</option>
                <option value={6}>Half Width (6/12)</option>
                <option value={4}>One Third (4/12)</option>
                <option value={3}>One Fourth (3/12)</option>
                <option value={8}>Two Thirds (8/12)</option>
                <option value={9}>Three Fourths (9/12)</option>
                <option value={2}>Small (2/12)</option>
                <option value={1}>Tiny (1/12)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Controls how much horizontal space this field takes up
              </p>
            </div>

            <Input
              label="Field Name (Internal)"
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
              placeholder="e.g., project_name"
              hint="Used to store the data (no spaces)"
            />

            <Input
              label="Placeholder"
              value={config.placeholder || ''}
              onChange={(e) => updateConfig({ placeholder: e.target.value })}
              placeholder="e.g., Enter project name..."
            />

            {config.type === 'textarea' && (
              <Input
                label="Number of Rows"
                type="number"
                value={config.rows || 3}
                onChange={(e) => updateConfig({ rows: parseInt(e.target.value) || 3 })}
                min="2"
                max="20"
              />
            )}

            {(config.type === 'select' || config.type === 'radio') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                <div className="space-y-2">
                  {(config.options || []).map((option, index) => {
                    const optionValue = typeof option === 'object' ? option.label || option.value || '' : option
                    return (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={optionValue}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder={`Option ${index + 1}`}
                        />
                        <button
                          onClick={() => deleteOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-2"
                >
                  <FiPlus className="mr-1" size={14} /> Add Option
                </Button>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Validation</h4>
              
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={config.required || false}
                  onChange={(e) => updateConfig({
                    required: e.target.checked,
                    validation: { ...config.validation, required: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Required Field</span>
              </label>

              {config.type === 'text' && (
                <>
                  <Input
                    label="Min Length"
                    type="number"
                    value={config.validation?.minLength || ''}
                    onChange={(e) => updateConfig({
                      validation: { ...config.validation, minLength: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 3"
                  />
                  <Input
                    label="Max Length"
                    type="number"
                    value={config.validation?.maxLength || ''}
                    onChange={(e) => updateConfig({
                      validation: { ...config.validation, maxLength: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 100"
                    className="mt-3"
                  />
                </>
              )}

              {config.type === 'number' && (
                <>
                  <Input
                    label="Minimum Value"
                    type="number"
                    value={config.validation?.min || ''}
                    onChange={(e) => updateConfig({
                      validation: { ...config.validation, min: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 0"
                  />
                  <Input
                    label="Maximum Value"
                    type="number"
                    value={config.validation?.max || ''}
                    onChange={(e) => updateConfig({
                      validation: { ...config.validation, max: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="e.g., 100"
                    className="mt-3"
                  />
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Help Text
              </label>
              <textarea
                value={config.hint || ''}
                onChange={(e) => updateConfig({ hint: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Optional help text shown below the field"
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1">
          {isDirty ? 'Save Changes *' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

export default FieldConfigPanel

