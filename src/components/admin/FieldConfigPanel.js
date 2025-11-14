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

            {/* Repeater Toggle */}
            <div className="border-t border-gray-200 pt-4">
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={config.type === 'repeater'}
                    onChange={(e) => {
                      const newType = e.target.checked ? 'repeater' : 'regular'
                  const updates = { type: newType }

                  if (newType === 'repeater') {
                    const existingConfig = config.repeaterConfig || {}
                    updates.repeaterConfig = {
                      minRows: existingConfig.minRows ?? 1,
                      maxRows: existingConfig.maxRows ?? 10,
                      addLabel: existingConfig.addLabel ?? 'Add New',
                      removeLabel: existingConfig.removeLabel ?? 'Remove',
                      addButtonPosition: existingConfig.addButtonPosition ?? 'bottom'
                    }
                  } else {
                    updates.repeaterConfig = undefined
                  }

                      updateConfig(updates)
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Make this section repeatable</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  When enabled, this section becomes a repeater where all fields can be added multiple times as rows in a table.
                </p>
              </div>

              {/* Repeater Configuration - only show when section is a repeater */}
              {config.type === 'repeater' && (
                <div className="ml-6 mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Rows
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={config.repeaterConfig?.minRows ?? 1}
                        onChange={(e) => updateConfig({
                          repeaterConfig: {
                            ...config.repeaterConfig,
                            minRows: parseInt(e.target.value, 10) || 0
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Rows
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={config.repeaterConfig?.maxRows ?? 10}
                        onChange={(e) => updateConfig({
                          repeaterConfig: {
                            ...config.repeaterConfig,
                            maxRows: parseInt(e.target.value, 10) || 10
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Add Button Label"
                      value={config.repeaterConfig?.addLabel ?? 'Add New'}
                      onChange={(e) => updateConfig({
                        repeaterConfig: {
                          ...config.repeaterConfig,
                          addLabel: e.target.value
                        }
                      })}
                      placeholder="e.g., Add Entry"
                    />
                    <Input
                      label="Remove Button Label"
                      value={config.repeaterConfig?.removeLabel ?? 'Remove'}
                      onChange={(e) => updateConfig({
                        repeaterConfig: {
                          ...config.repeaterConfig,
                          removeLabel: e.target.value
                        }
                      })}
                      placeholder="e.g., Delete Entry"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add Button Position
                    </label>
                    <select
                      value={config.repeaterConfig?.addButtonPosition || 'bottom'}
                      onChange={(e) => updateConfig({
                        repeaterConfig: {
                          ...config.repeaterConfig,
                          addButtonPosition: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="top">Top (insert new items first)</option>
                      <option value="bottom">Bottom (append new items)</option>
                    </select>
                  </div>

                  <p className="text-xs text-gray-500">
                    Users can add entries between the minimum and maximum limits. Customise button labels and choose
                    whether the “Add” control sits above or below the entries.
                  </p>
                </div>
              )}
            </div>

          </>
        ) : (
          <>
            {/* Field Configuration */}
            
            {/* Common: Field Label */}
            <Input
              label={config.type === 'section' ? 'Section Title' : config.type === 'tab' ? 'Tab Label' : 'Field Label'}
              value={config.type === 'section' ? (config.title || config.label) : config.label}
              onChange={(e) => {
                if (config.type === 'section') {
                  updateConfig({ title: e.target.value, label: e.target.value })
                } else {
                  updateConfig({ label: e.target.value })
                }
              }}
              placeholder={config.type === 'section' ? 'e.g., Contact Information' : config.type === 'tab' ? 'e.g., Additional Info' : 'e.g., Project Name'}
              required
            />

            {/* Show Label Checkbox - Only for regular input fields */}
            {config.type !== 'info' && config.type !== 'section' && config.type !== 'tab' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showLabel !== false}
                  onChange={(e) => updateConfig({ showLabel: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show label in form</span>
              </label>
            )}

            {/* Field Type Selector */}
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
                <option value="checkbox_group">Checkbox Group</option>
                <option value="radio">Radio</option>
                <option value="radio_group">Radio Group</option>
                <option value="toggle">Toggle</option>
                <option value="info">Text Display (Customizable)</option>
                <option value="section">Nested Section</option>
                <option value="tab">Nested Tabs</option>
              </select>
            </div>

            {/* Field Width - All types except nested items which handle their own width */}
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

            {/* Field Name - Only for regular input fields (not section, tab, or info) */}
            {config.type !== 'info' && config.type !== 'section' && config.type !== 'tab' && (
              <Input
                label="Field Name (Internal)"
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                placeholder="e.g., project_name"
                hint="Used to store the data (no spaces)"
              />
            )}

            {/* Placeholder - Only for input fields that support it */}
            {config.type !== 'info' && config.type !== 'section' && config.type !== 'tab' && config.type !== 'checkbox' && config.type !== 'toggle' && config.type !== 'checkbox_group' && config.type !== 'radio_group' && (
              <Input
                label="Placeholder"
                value={config.placeholder || ''}
                onChange={(e) => updateConfig({ placeholder: e.target.value })}
                placeholder="e.g., Enter project name..."
              />
            )}

            {/* Separator for Type-Specific Options */}
            {(config.type === 'textarea' || config.type === 'select' || config.type === 'checkbox_group' || config.type === 'radio_group' || config.type === 'info' || config.type === 'section' || config.type === 'tab') && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {config.type === 'section' ? 'Section Options' : config.type === 'tab' ? 'Tab Options' : config.type === 'info' ? 'Text Styling' : 'Field Options'}
                </h4>
              </div>
            )}

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

            {(config.type === 'select' || config.type === 'radio' || config.type === 'checkbox_group' || config.type === 'radio_group') && (
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

            {(config.type === 'checkbox_group' || config.type === 'radio_group') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layout Orientation
                </label>
                <select
                  value={config.orientation || 'horizontal'}
                  onChange={(e) => updateConfig({ orientation: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="horizontal">Horizontal (Inline)</option>
                  <option value="vertical">Vertical (Stacked)</option>
                  <option value="question-answer">Question-Answer (Label Left, Options Right)</option>
                  <option value="label-left">Label Left, Options Left</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose how the options should be displayed
                </p>
              </div>
            )}

            {config.type === 'info' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Text Display:</strong> This field displays customizable text to users. 
                    Style it as a heading, instruction, warning, or any other informational text.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={config.content || config.placeholder || ''}
                    onChange={(e) => updateConfig({ content: e.target.value, placeholder: e.target.value })}
                    placeholder="Enter the text you want to display..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This text will be displayed in the form. Line breaks are preserved.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Text Styling</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Font Size */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                      <select
                        value={config.fontSize || '14px'}
                        onChange={(e) => updateConfig({ fontSize: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="10px">10px - Tiny</option>
                        <option value="12px">12px - Small</option>
                        <option value="14px">14px - Normal</option>
                        <option value="16px">16px - Medium</option>
                        <option value="18px">18px - Large</option>
                        <option value="20px">20px - XLarge</option>
                        <option value="24px">24px - 2XLarge</option>
                        <option value="30px">30px - 3XLarge</option>
                        <option value="36px">36px - Heading</option>
                        <option value="48px">48px - Large Heading</option>
                      </select>
                    </div>

                    {/* Font Weight */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Weight</label>
                      <select
                        value={config.fontWeight || 'normal'}
                        onChange={(e) => updateConfig({ fontWeight: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="300">Light</option>
                        <option value="normal">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi-Bold</option>
                        <option value="bold">Bold</option>
                        <option value="800">Extra Bold</option>
                      </select>
                    </div>

                    {/* Font Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.fontColor || '#374151'}
                          onChange={(e) => updateConfig({ fontColor: e.target.value })}
                          className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.fontColor || '#374151'}
                          onChange={(e) => updateConfig({ fontColor: e.target.value })}
                          placeholder="#374151"
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Text Align */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Text Align</label>
                      <select
                        value={config.textAlign || 'left'}
                        onChange={(e) => updateConfig({ textAlign: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                        <option value="justify">Justify</option>
                      </select>
                    </div>

                    {/* Font Style */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Style</label>
                      <select
                        value={config.fontStyle || 'normal'}
                        onChange={(e) => updateConfig({ fontStyle: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                      </select>
                    </div>

                    {/* Text Decoration */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Text Decoration</label>
                      <select
                        value={config.textDecoration || 'none'}
                        onChange={(e) => updateConfig({ textDecoration: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="none">None</option>
                        <option value="underline">Underline</option>
                        <option value="line-through">Line Through</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Quick Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateConfig({
                          fontSize: '24px',
                          fontWeight: 'bold',
                          fontColor: '#1f2937',
                          textAlign: 'left'
                        })}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        Heading
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig({
                          fontSize: '14px',
                          fontWeight: 'normal',
                          fontColor: '#6b7280',
                          textAlign: 'left'
                        })}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        Body Text
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig({
                          fontSize: '14px',
                          fontWeight: '600',
                          fontColor: '#dc2626',
                          textAlign: 'left'
                        })}
                        className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                      >
                        Warning
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig({
                          fontSize: '14px',
                          fontWeight: '600',
                          fontColor: '#2563eb',
                          textAlign: 'left'
                        })}
                        className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                      >
                        Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {config.type === 'section' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
                  <textarea
                    value={config.description || ''}
                    onChange={(e) => updateConfig({ description: e.target.value })}
                    placeholder="Optional description for this section"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={config.type === 'section' && config.sectionType === 'repeater'}
                      onChange={(e) => updateConfig({ 
                        sectionType: e.target.checked ? 'repeater' : 'regular',
                        repeaterConfig: e.target.checked ? {
                          minRows: 1,
                          maxRows: 10,
                          addLabel: 'Add New',
                          removeLabel: 'Remove',
                          addButtonPosition: 'bottom'
                        } : undefined
                      })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Make this a Repeater Section</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 -mt-2 mb-3">
                    Allow users to add multiple instances of this section's fields
                  </p>

                  {config.sectionType === 'repeater' && (
                    <div className="ml-6 space-y-3 border-l-2 border-primary-200 pl-4">
                      <Input
                        label="Minimum Rows"
                        type="number"
                        value={config.repeaterConfig?.minRows || 1}
                        onChange={(e) => updateConfig({
                          repeaterConfig: { 
                            ...config.repeaterConfig, 
                            minRows: parseInt(e.target.value) || 1 
                          }
                        })}
                        min="1"
                        hint="Minimum number of rows required"
                      />

                      <Input
                        label="Maximum Rows"
                        type="number"
                        value={config.repeaterConfig?.maxRows || 10}
                        onChange={(e) => updateConfig({
                          repeaterConfig: { 
                            ...config.repeaterConfig, 
                            maxRows: parseInt(e.target.value) || 10 
                          }
                        })}
                        min="1"
                        hint="Maximum number of rows allowed"
                      />

                      <Input
                        label="Add Button Label"
                        value={config.repeaterConfig?.addLabel || 'Add New'}
                        onChange={(e) => updateConfig({
                          repeaterConfig: { 
                            ...config.repeaterConfig, 
                            addLabel: e.target.value 
                          }
                        })}
                        placeholder="e.g., Add Item, Add Row"
                      />

                      <Input
                        label="Remove Button Label"
                        value={config.repeaterConfig?.removeLabel || 'Remove'}
                        onChange={(e) => updateConfig({
                          repeaterConfig: { 
                            ...config.repeaterConfig, 
                            removeLabel: e.target.value 
                          }
                        })}
                        placeholder="e.g., Remove, Delete"
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Add Button Position
                        </label>
                        <select
                          value={config.repeaterConfig?.addButtonPosition || 'bottom'}
                          onChange={(e) => updateConfig({
                            repeaterConfig: { 
                              ...config.repeaterConfig, 
                              addButtonPosition: e.target.value 
                            }
                          })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

              {/* Nested Section Fields Management */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Fields in this Section</h4>
                <p className="text-xs text-gray-500 mb-3">
                  {(config.fields || []).length === 0 
                    ? 'No fields added yet. Save this section first, then use the "Add Field" button in the form builder to add fields to it.' 
                    : `This section contains ${config.fields.length} field${config.fields.length !== 1 ? 's' : ''}.`
                  }
                </p>
                
                {(config.fields || []).length > 0 && (
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200">
                    {config.fields.map((nestedField, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {nestedField.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({nestedField.type})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </>
            )}

            {config.type === 'tab' && (
              <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Nested Tabs</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    {(config.pages || []).length === 0 
                      ? 'No tabs added yet. Add tabs below to organize your content.' 
                      : `This tab group contains ${config.pages.length} tab${config.pages.length !== 1 ? 's' : ''}.`
                    }
                  </p>
                  
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200">
                    {(config.pages || []).map((page, idx) => (
                      <div key={page.id || idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                        <input
                          type="text"
                          value={page.title || ''}
                          onChange={(e) => {
                            const newPages = [...(config.pages || [])]
                            newPages[idx] = { ...page, title: e.target.value }
                            updateConfig({ pages: newPages })
                          }}
                          placeholder={`Tab ${idx + 1} Title`}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPages = (config.pages || []).filter((_, i) => i !== idx)
                            updateConfig({ pages: newPages })
                          }}
                          className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove Tab"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const newPage = {
                          id: `tab-${Date.now()}`,
                          title: `Tab ${(config.pages || []).length + 1}`,
                          sections: [{
                            id: `section-${Date.now()}`,
                            title: 'New Section',
                            description: '',
                            fields: []
                          }]
                        }
                        updateConfig({ pages: [...(config.pages || []), newPage] })
                      }}
                      className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Tab
                    </button>
                  </div>
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

