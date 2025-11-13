'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Card from '@/components/common/Card'
import RightResizableSidebar from '@/components/common/RightResizableSidebar'
import FieldConfigPanel from '@/components/admin/FieldConfigPanel'
import { FiPlus, FiTrash2, FiSettings, FiChevronRight, FiMove, FiMenu, FiType, FiHash, FiCalendar, FiAlignLeft, FiCheckSquare, FiChevronDown, FiMail, FiCheckCircle, FiCircle, FiAlertCircle, FiX, FiCopy } from 'react-icons/fi'
import { v4 as uuidv4 } from 'uuid'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * Sortable Field Component with Resizable Edges
 */
const SortableField = ({ id, field, pageIndex, sectionIndex, fieldIndex, renderFieldPreview, onOpenConfig, onDelete, onDuplicate, columnSpan, onResize, onResizeComplete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const [isResizing, setIsResizing] = useState(false)
  const [resizeEdge, setResizeEdge] = useState(null) // 'left' or 'right'
  const [duplicateDisabled, setDuplicateDisabled] = useState(false) // <--- Add state

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : transition,
    opacity: isDragging ? 0.2 : 1 // Make it very transparent when dragging
  }

  // Calculate column span class
  const getColSpanClass = (span) => {
    const spanMap = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12'
    }
    return spanMap[span] || 'col-span-12'
  }

  // Handle resize drag
  const handleResizeStart = (edge) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeEdge(edge)
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
    
    const startX = e.clientX
    const startSpan = columnSpan
    let lastSpan = startSpan
    let finalSpan = startSpan

    const handleMouseMove = (e) => {
      e.preventDefault()
      const deltaX = e.clientX - startX
      // Each column is approximately 1/12 of the container width
      // Get the actual container width for accurate calculation
      const container = e.target.closest('.grid')
      const containerWidth = container ? container.offsetWidth : 1000
      const columnWidth = containerWidth / 12
      const columnDelta = Math.round(deltaX / columnWidth)
      
      let newSpan = startSpan
      if (edge === 'right') {
        // Dragging right edge - increase span means move right
        newSpan = Math.max(1, Math.min(12, startSpan + columnDelta))
      } else if (edge === 'left') {
        // Dragging left edge - dragging left means increase span (grow left)
        // Note: negative deltaX (drag left) should increase span
        newSpan = Math.max(1, Math.min(12, startSpan - columnDelta))
      }
      
      // Only update if span actually changed to reduce re-renders
      if (newSpan !== lastSpan && onResize) {
        onResize(pageIndex, sectionIndex, fieldIndex, newSpan, edge, true) // true = isLive (don't auto-shift)
        lastSpan = newSpan
        finalSpan = newSpan
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeEdge(null)
      
      // Restore normal behavior
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      
      // Call final resize with auto-shift enabled
      if (onResizeComplete && finalSpan !== startSpan) {
        onResizeComplete(pageIndex, sectionIndex, fieldIndex, finalSpan, edge)
      }
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (!field) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group h-full ${isResizing ? 'z-50' : ''}`}
    >
      {/* Drag Handle */}
      {!isResizing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-white dark:bg-gray-800 shadow-md rounded p-1 border border-gray-300 dark:border-gray-600"
          title="Drag to reorder"
        >
          <FiMove className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
      )}

      {/* Resize Handle - Left */}
      <div
        onMouseDown={handleResizeStart('left')}
        className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 transition-all ${
          isResizing && resizeEdge === 'left' 
            ? 'bg-primary-500 opacity-100 w-1' 
            : 'opacity-0 group-hover:opacity-60 hover:opacity-100 bg-primary-400'
        }`}
        title="Drag to resize left"
        style={{ userSelect: 'none' }}
      />

      {/* Resize Handle - Right */}
      <div
        onMouseDown={handleResizeStart('right')}
        className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 transition-all ${
          isResizing && resizeEdge === 'right' 
            ? 'bg-primary-500 opacity-100 w-1' 
            : 'opacity-0 group-hover:opacity-60 hover:opacity-100 bg-primary-400'
        }`}
        title="Drag to resize right"
        style={{ userSelect: 'none' }}
      />

      {/* Field Preview */}
      <div 
        className={`relative border-2 border-dashed rounded-md p-2 transition-all select-none ${
          isResizing ? 'border-primary-500 bg-primary-50 shadow-lg' : 'border-transparent group-hover:border-primary-300'
        }`}
        style={{ 
          userSelect: isResizing ? 'none' : 'auto',
          pointerEvents: isResizing ? 'none' : 'auto'
        }}
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 select-none">
          {field.label}
          {(field.required || field.validation?.required) && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          <span className={`ml-2 text-xs font-semibold ${
            isResizing ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
          }`}>
            ({columnSpan}/12)
          </span>
        </label>
        {renderFieldPreview(field, pageIndex, sectionIndex, fieldIndex)}
        {field.hint && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 select-none">{field.hint}</p>
        )}

        {/* Overlay controls on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            type="button"
            onClick={() => onOpenConfig(pageIndex, sectionIndex, fieldIndex)}
            className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Configure field"
          >
            <FiSettings className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDuplicateDisabled(true)
              setTimeout(() => setDuplicateDisabled(false), 700) // Prevent rapid double triggers
              onDuplicate(pageIndex, sectionIndex, fieldIndex)
            }}
            disabled={duplicateDisabled}
            className={`p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${duplicateDisabled ? 'opacity-50 pointer-events-none' : ''}`}
            title="Duplicate field"
          >
            <FiCopy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(pageIndex, sectionIndex, fieldIndex)}
            className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete field"
          >
            <FiTrash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Drag Overlay - Shows what's being dragged
 */
const DragOverlayField = ({ field, columnSpan }) => {
  if (!field) return null
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 border-2 border-primary-500 rounded-md p-3 shadow-2xl opacity-90"
      style={{ width: '300px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {field.label}
          {(field.required || field.validation?.required) && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </label>
        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded">
          {columnSpan}/12
        </span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">Moving field...</div>
    </div>
  )
}

/**
 * Field Type Selector Panel - Right panel for selecting field types (matches FieldConfigPanel style)
 */
const FieldTypeSelectorPanel = ({ onSelect, onClose, sectionTitle }) => {
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])
  
  const fieldTypes = [
    { type: 'text', label: 'Text', icon: FiType, description: 'Single line text input', color: 'blue' },
    { type: 'email', label: 'Email', icon: FiMail, description: 'Email address input', color: 'purple' },
    { type: 'number', label: 'Number', icon: FiHash, description: 'Numeric input', color: 'green' },
    { type: 'date', label: 'Date', icon: FiCalendar, description: 'Date picker', color: 'orange' },
    { type: 'textarea', label: 'Textarea', icon: FiAlignLeft, description: 'Multi-line text', color: 'indigo' },
    { type: 'select', label: 'Dropdown', icon: FiChevronDown, description: 'Select from options', color: 'pink' },
    { type: 'checkbox', label: 'Checkbox', icon: FiCheckSquare, description: 'Yes/No checkbox', color: 'teal' },
  ]
  
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Field
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {sectionTitle ? `Adding to: ${sectionTitle}` : 'Choose the type of field you want to add'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select a field type to add to your form. You can add multiple fields without closing this panel.
        </p>
        
        <div className="space-y-3">
          {fieldTypes.map((fieldType) => {
            const Icon = fieldType.icon
            return (
              <button
                key={fieldType.type}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  onSelect(fieldType.type)
                }}
                className="w-full group p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary-100 dark:bg-primary-900/30 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {fieldType.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {fieldType.description}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <Button variant="outline" onClick={onClose} className="w-full">
          Cancel (ESC)
        </Button>
      </div>
    </div>
  )
}

/**
 * Droppable Empty Cell
 */
const DroppableCell = ({ id, row, col, isDragging, onHover }) => {
  const { setNodeRef, isOver } = useDroppable({ id })
  
  useEffect(() => {
    if (isOver && onHover) {
      onHover()
    }
  }, [isOver, onHover])
  
  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-md transition-all min-h-[60px] ${
        isDragging 
          ? `border-gray-400 opacity-60 ${isOver ? 'border-primary-500 opacity-100 bg-primary-50 scale-105' : ''}` 
          : 'border-gray-200 opacity-20 hover:opacity-40'
      }`}
      style={{
        gridColumn: col,
        gridRow: row
      }}
      title={`Row ${row}, Column ${col}`}
    />
  )
}


/**
 * Sortable Section Component
 */
const SortableSection = ({ id, section, pageIndex, sectionIndex, children, onOpenConfig, onDelete, isCollapsed, onToggleCollapse }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  if (!section) return null

  return (
    <div ref={setNodeRef} style={style} className="scroll-mt-24">
      <Card className="border-2 border-gray-200 dark:border-gray-700" padding={true}>
        {/* Section Header - Collapsible */}
        <div className="flex items-center gap-3 mb-6">
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-grab active:cursor-grabbing"
            title="Drag to reorder section"
          >
            <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title={isCollapsed ? "Expand section" : "Collapse section"}
          >
            <FiChevronRight
              className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                isCollapsed ? '' : 'rotate-90'
              }`}
            />
          </button>

          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {section.title}
            </h2>
            {section.description && !isCollapsed && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onOpenConfig(pageIndex, sectionIndex)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Section Settings"
            >
              <FiSettings size={18} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(pageIndex, sectionIndex)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="Delete Section"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>

        {/* Section Content */}
        {!isCollapsed && children}
      </Card>
    </div>
  )
}

/**
 * Form Builder Component - New Structure
 * Pages > Sections > Fields
 * With Drag-and-Drop and 12-column Grid Layout
 */
const FormBuilder = ({ form = null, initialData = null, onSave, onCancel }) => {
  const formToEdit = form || initialData
  
  const createFirstPage = (pageTitle = '', pageDescription = '') => ({
    id: uuidv4(),
    title: 'Tab 1',
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
            columnSpan: 4,
            gridRow: 1,
            gridColumn: 1,
            validation: { required: true, message: 'Title is required' }
          },
          {
            id: uuidv4(),
            name: 'description',
            label: 'Entry Description',
            type: 'textarea',
            required: false,
            placeholder: 'Enter description',
            rows: 3,
            columnSpan: 4,
            gridRow: 1,
            gridColumn: 5
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
  const [activeId, setActiveId] = useState(null) // For drag overlay
  const [dragPreview, setDragPreview] = useState(null) // { pageIndex, sectionIndex, row, col, span }
  const [addingFieldTo, setAddingFieldTo] = useState(null) // { pageIndex, sectionIndex } - null when not adding
  const sectionRefs = useRef({})
  const isDuplicatingRef = useRef(false) // Prevent multiple simultaneous duplicates
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Helper function to migrate fields to explicit grid positioning
  const migrateFieldsToGrid = (pages) => {
    return pages.map(page => ({
      ...page,
      sections: page.sections.map(section => ({
        ...section,
        fields: section.fields.map((field, idx) => {
          // If field already has grid positioning, keep it
          if (field.gridRow && field.gridColumn) {
            return field
          }
          
          // Otherwise, auto-calculate position based on order
          let row = 1
          let col = 1
          let accumulatedSpan = 0
          
          // Calculate position based on previous fields
          for (let i = 0; i < idx; i++) {
            const prevField = section.fields[i]
            const prevSpan = prevField.columnSpan || 4
            
            if (accumulatedSpan + prevSpan > 12) {
              // Move to next row
              row++
              accumulatedSpan = 0
            }
            
            if (i === idx - 1) {
              // This is the previous field
              col = (prevField.gridColumn || (accumulatedSpan + 1)) + prevSpan
              if (col > 12) {
                row++
                col = 1
              }
            }
            
            accumulatedSpan += prevSpan
            if (accumulatedSpan >= 12) {
              row++
              accumulatedSpan = 0
            }
          }
          
          return {
            ...field,
            columnSpan: field.columnSpan || 4,
            gridRow: row,
            gridColumn: col
          }
        })
      }))
    }))
  }

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
          pages: migrateFieldsToGrid(pages.length > 0 ? pages : [firstPage]),
          published: formToEdit.published || false,
          settings: formToEdit.settings || {
            multiPage: false
          }
        })
      } else {
        // New structure
        const pages = formToEdit.pages || [createFirstPage()]
        setFormData({
          title: formToEdit.title || '',
          description: formToEdit.description || '',
          pages: migrateFieldsToGrid(pages),
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
      title: `Tab ${formData.pages.length + 1}`,
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
      alert('Cannot delete the first tab')
      return
    }
    
    if (!confirm('Delete this tab and all its sections?')) return
    
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
  const handleAddField = (pageIndex, sectionIndex, fieldType = 'text') => {
    const section = formData.pages[pageIndex].sections[sectionIndex]
    
    // Calculate next available position
    let nextRow = 0
    let nextCol = 1 // Grid columns are 1-indexed in CSS
    
    if (section.fields.length > 0) {
      // Find the last field's position
      const lastField = section.fields[section.fields.length - 1]
      const lastRow = lastField.gridRow || 1
      const lastCol = lastField.gridColumn || 1
      const lastSpan = lastField.columnSpan || 4
      
      // Try to place in same row if space available
      if (lastCol + lastSpan - 1 + 4 <= 12) {
        nextRow = lastRow
        nextCol = lastCol + lastSpan
      } else {
        // Move to next row
        nextRow = lastRow + 1
        nextCol = 1
      }
    } else {
      nextRow = 1
      nextCol = 1
    }
    
    const newField = {
      id: uuidv4(),
      name: `field_${Date.now()}`,
      label: fieldType === 'text' ? 'Text Field' : fieldType === 'email' ? 'Email Address' : fieldType === 'number' ? 'Number' : fieldType === 'date' ? 'Date' : fieldType === 'textarea' ? 'Description' : fieldType === 'select' ? 'Select Option' : 'Checkbox',
      type: fieldType,
      required: false,
      placeholder: 'Enter value...',
      hint: '',
      columnSpan: 4, // One-third width by default (4 out of 12 columns)
      gridRow: nextRow, // Explicit row position
      gridColumn: nextCol, // Explicit column start (1-12)
      validation: {}
    }
    
    const updatedPages = [...formData.pages]
    updatedPages[pageIndex].sections[sectionIndex] = {
      ...section,
      fields: [...section.fields, newField]
    }
    
    setFormData({ ...formData, pages: updatedPages })
    
    // Keep selector open for adding multiple fields - user can close it manually or add more fields
  }
  
  const handleStartAddingField = (pageIndex, sectionIndex) => {
    // Check if there are unsaved changes in current config
    if (editingConfig && configHasChanges) {
      if (!confirm('You have unsaved changes. Switching will discard them. Continue?')) {
        return
      }
    }
    
    // Close config panel if open
    if (editingConfig) {
      setEditingConfig(null)
      setConfigHasChanges(false)
    }
    
    setAddingFieldTo({ pageIndex, sectionIndex })
  }
  
  const handleCancelAddingField = () => {
    setAddingFieldTo(null)
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

  const handleResizeField = (pageIndex, sectionIndex, fieldIndex, newSpan, edge = 'right', isLive = false) => {
    const updatedPages = [...formData.pages]
    const section = updatedPages[pageIndex].sections[sectionIndex]
    const field = section.fields[fieldIndex]
    const fieldRow = field.gridRow || 1
    const fieldCol = field.gridColumn || 1
    const oldSpan = field.columnSpan || 4
    
    let newFieldCol = fieldCol
    let adjustedSpan = newSpan
    
    if (edge === 'right') {
      // Dragging right edge - keep left column fixed, expand right
      // Simple validation: can't exceed 12 columns
      if (fieldCol + newSpan - 1 > 12) {
        adjustedSpan = 12 - fieldCol + 1
      }
    } else if (edge === 'left') {
      // Dragging left edge - keep right column fixed, expand left
      const currentRightCol = fieldCol + oldSpan - 1
      newFieldCol = currentRightCol - newSpan + 1
      
      // Can't go below column 1
      if (newFieldCol < 1) {
        newFieldCol = 1
        adjustedSpan = currentRightCol // Adjust span to fit
      } else {
        adjustedSpan = newSpan
      }
    }
    
    const updatedFields = [...section.fields]
    
    // Update the field's span and column
    updatedFields[fieldIndex] = { 
      ...field, 
      columnSpan: adjustedSpan,
      gridColumn: newFieldCol
    }
    
    // If growing and not in live preview mode, check for overlaps and shift fields
    if (!isLive && adjustedSpan > oldSpan) {
      const newFieldEndCol = newFieldCol + adjustedSpan - 1
      
      // Find fields on the same row that would overlap
      section.fields.forEach((otherField, otherIdx) => {
        if (otherIdx === fieldIndex) return
        
        const otherRow = otherField.gridRow || 1
        const otherCol = otherField.gridColumn || 1
        const otherSpan = otherField.columnSpan || 4
        const otherEndCol = otherCol + otherSpan - 1
        
        // Only check fields on the same row
        if (otherRow === fieldRow) {
          // Check if this field overlaps with the new position
          const hasOverlap = (
            (otherCol >= newFieldCol && otherCol <= newFieldEndCol) || // Other starts within new field
            (otherEndCol >= newFieldCol && otherEndCol <= newFieldEndCol) || // Other ends within new field
            (otherCol < newFieldCol && otherEndCol > newFieldEndCol) // Other completely contains new field
          )
          
          if (hasOverlap) {
            // This field is being overlapped, shift it
            if (edge === 'right') {
              // Growing right - shift overlapped field to the right
              const newCol = newFieldEndCol + 1
              
              if (newCol + otherSpan - 1 <= 12) {
                // Fits on same row, shift right
                updatedFields[otherIdx] = {
                  ...otherField,
                  gridColumn: newCol
                }
              } else {
                // Doesn't fit, move to next row
                updatedFields[otherIdx] = {
                  ...otherField,
                  gridRow: fieldRow + 1,
                  gridColumn: 1
                }
              }
            } else if (edge === 'left') {
              // Growing left - shift overlapped field to the left
              const newCol = newFieldCol - otherSpan
              
              if (newCol >= 1) {
                // Fits on same row to the left
                updatedFields[otherIdx] = {
                  ...otherField,
                  gridColumn: newCol
                }
              } else {
                // Doesn't fit, move to next row
                updatedFields[otherIdx] = {
                  ...otherField,
                  gridRow: fieldRow + 1,
                  gridColumn: 1
                }
              }
            }
          }
        }
      })
    }
    
    updatedPages[pageIndex].sections[sectionIndex] = {
      ...section,
      fields: updatedFields
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleOpenTabConfig = (pageIndex) => {
    const page = formData.pages[pageIndex]
    
    // Check if already editing the same tab
    const isSameConfig = editingConfig && 
                         editingConfig.type === 'page' && 
                         editingConfig.pageIndex === pageIndex
    
    if (isSameConfig) {
      return // Already open, do nothing
    }
    
    // Check if there are unsaved changes in current config
    if (editingConfig && configHasChanges) {
      if (!confirm('You have unsaved changes. Switching will discard them. Continue?')) {
        return
      }
    }
    
    // Cancel adding field if active
    if (addingFieldTo) {
      setAddingFieldTo(null)
    }
    
    setEditingConfig({
      type: 'page',
      pageIndex,
      data: { ...page } // Create a new object reference
    })
    setConfigHasChanges(false)
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
    
    // Cancel adding field if active
    if (addingFieldTo) {
      setAddingFieldTo(null)
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
    
    // Cancel adding field if active
    if (addingFieldTo) {
      setAddingFieldTo(null)
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
    
    if (editingConfig.type === 'page') {
      handleUpdatePage(editingConfig.pageIndex, updatedData)
    } else if (editingConfig.type === 'section') {
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
    const section = updatedPages[pageIndex].sections[sectionIndex]
    
    // Remove the field
    const remainingFields = section.fields.filter((_, i) => i !== fieldIndex)
    
    // Compact rows - remove empty rows and renumber
    const compactedFields = compactGridRows(remainingFields)
    
    updatedPages[pageIndex].sections[sectionIndex] = {
      ...section,
      fields: compactedFields
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }
  
  // Helper function to compact grid rows (remove empty rows)
  const compactGridRows = (fields) => {
    if (fields.length === 0) return fields
    
    // Get all unique row numbers, sorted
    const usedRows = [...new Set(fields.map(f => f.gridRow || 1))].sort((a, b) => a - b)
    
    // Create a mapping from old row to new row
    const rowMapping = {}
    usedRows.forEach((oldRow, index) => {
      rowMapping[oldRow] = index + 1 // New rows start from 1
    })
    
    // Update all fields with new row numbers
    return fields.map(field => ({
      ...field,
      gridRow: rowMapping[field.gridRow || 1]
    }))
  }

  // Improved compactGridColumns: assigns columns left-to-right, wraps to next row if span exceeds 12
  const compactGridColumns = (fields) => {
    if (fields.length === 0) return fields;

    let currentRow = 1;
    let nextCol = 1;
    const newFields = [];

    fields.forEach((field) => {
      const span = field.columnSpan || 4;
      // Always assign, do not reuse any prior value
      if (nextCol + span - 1 > 12) {
        currentRow++;
        nextCol = 1;
      }
      newFields.push({
        ...field,
        gridRow: currentRow,
        gridColumn: nextCol
      });
      nextCol += span;
    });

    // DIAGNOSTIC: Warn if any two fields have the same gridRow+gridColumn
    const seen = new Set();
    newFields.forEach(f => {
      const key = `${f.gridRow}:${f.gridColumn}`;
      if (seen.has(key)) {
        console.warn('Duplicate grid position found after normalization:', key, newFields);
      }
      seen.add(key);
    });

    return newFields;
  };

  const handleDuplicateField = (pageIndex, sectionIndex, fieldIndex) => {
    // DIAGNOSTIC LOG (watch console for double/triple triggers)
    const fieldName = formData?.pages?.[pageIndex]?.sections?.[sectionIndex]?.fields?.[fieldIndex]?.name
    console.log('[DUPLICATE] Triggered at', new Date().toISOString(), 'page', pageIndex, 'section', sectionIndex, 'fieldIndex', fieldIndex, 'name', fieldName)
    if (isDuplicatingRef.current) {
      return;
    }
    isDuplicatingRef.current = true;

    setFormData(prevFormData => {
      // Deep copy the entire form data structure to avoid any shared references
      const updatedPages = prevFormData.pages.map(page => ({
        ...page,
        sections: page.sections.map(section => ({ ...section, fields: [...section.fields] }))
      }));
      const section = updatedPages[pageIndex].sections[sectionIndex];
      const fieldToDuplicate = section.fields[fieldIndex];

      if (!fieldToDuplicate) {
        isDuplicatingRef.current = false;
        return prevFormData;
      }

      const duplicateId = uuidv4();
      // Count existing copies for intelligent label/name numbering
      const baseLabel = fieldToDuplicate.label.replace(/\s*\(Copy( \d+)?\)\s*$/, '');
      const baseName = fieldToDuplicate.name.replace(/_copy(_\d+)?$/, '');
      let maxCopyNumber = 1;
      let maxNameCopyNumber = 1;
      section.fields.forEach(f => {
        const match = f.label.match(new RegExp(`^${baseLabel} \\(Copy( \\d+)?\\)$`));
        if (match) {
          const num = match[1] ? parseInt(match[1].replace(' ', ''), 10) : 1;
          if (num >= maxCopyNumber) maxCopyNumber = num + 1;
        }
        const nameMatch = f.name.match(new RegExp(`^${baseName}_copy(_(\\d+))?$`));
        if (nameMatch) {
          const num = nameMatch[2] ? parseInt(nameMatch[2], 10) : 1;
          if (num >= maxNameCopyNumber) maxNameCopyNumber = num + 1;
        }
      });
      
      const copyLabel = maxCopyNumber === 2 ? `${baseLabel} (Copy 2)` :
                        maxCopyNumber > 2 ? `${baseLabel} (Copy ${maxCopyNumber})` : `${baseLabel} (Copy)`;
      const copyName = maxNameCopyNumber === 2 ? `${baseName}_copy_2` :
                       maxNameCopyNumber > 2 ? `${baseName}_copy_${maxNameCopyNumber}` : `${baseName}_copy`;

      const duplicatedField = {
        ...fieldToDuplicate,
        id: duplicateId,
        name: copyName,
        label: copyLabel,
        columnSpan: fieldToDuplicate.columnSpan || 4
      };

      // Insert the duplicate right after the original (no mutation)
      const newFields = [
        ...section.fields.slice(0, fieldIndex + 1),
        duplicatedField,
        ...section.fields.slice(fieldIndex + 1),
      ];
      // Remove accidental double-insertion by id
      const seen = new Set();
      const uniqueFields = [];
      for (const f of newFields) {
        if (!seen.has(f.id)) {
          uniqueFields.push(f);
          seen.add(f.id);
        } else {
          // log warning if we filtered out a duplicate by id
          console.warn('Filtered accidental duplicate field by id (dev safety):', f);
        }
      }

      // First compact rows, then ensure columns are unique and compact.
      let compactedFields = compactGridRows(uniqueFields);
      compactedFields = compactGridColumns(compactedFields);

      updatedPages[pageIndex].sections[sectionIndex] = {
        ...section,
        fields: compactedFields
      };

      setTimeout(() => {
        isDuplicatingRef.current = false;
      }, 50);

      return {
        ...prevFormData,
        pages: updatedPages
      };
    });
  };

  const handleMoveField = (pageIndex, sectionIndex, fieldIndex, direction) => {
    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1
    const updatedPages = [...formData.pages]
    const section = updatedPages[pageIndex].sections[sectionIndex]
    const fields = [...section.fields]
    
    ;[fields[fieldIndex], fields[newIndex]] = [fields[newIndex], fields[fieldIndex]]
    
    updatedPages[pageIndex].sections[sectionIndex] = { ...section, fields }
    setFormData({ ...formData, pages: updatedPages })
  }

  // Drag and Drop Handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
    
    // Extract field info for drag preview
    const activeData = event.active.id.split('-')
    if (activeData[0] === 'field') {
      const [, pageIdx, sectionIdx, fieldIdx] = activeData.map(Number)
      const field = formData.pages[pageIdx].sections[sectionIdx].fields[fieldIdx]
      setDragPreview({
        pageIndex: pageIdx,
        sectionIndex: sectionIdx,
        row: field.gridRow || 1,
        col: field.gridColumn || 1,
        span: field.columnSpan || 4
      })
    }
  }

  const handleDragOver = (event) => {
    const { over } = event
    if (!over || !dragPreview) return
    
    // Update preview position based on where we're hovering
    const overData = over.id.split('-')
    
    if (overData[0] === 'field') {
      // Hovering over an existing field - swap position
      const [, pageIdx, sectionIdx, fieldIdx] = overData.map(Number)
      const targetField = formData.pages[pageIdx].sections[sectionIdx].fields[fieldIdx]
      setDragPreview({
        ...dragPreview,
        pageIndex: pageIdx,
        sectionIndex: sectionIdx,
        row: targetField.gridRow || 1,
        col: targetField.gridColumn || 1
      })
    } else if (overData[0] === 'empty') {
      // Hovering over an empty cell
      const [, pageIdx, sectionIdx, row, col] = overData.map(Number)
      setDragPreview({
        ...dragPreview,
        pageIndex: pageIdx,
        sectionIndex: sectionIdx,
        row: row,
        col: col
      })
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    setDragPreview(null) // Clear drag preview

    if (!over || active.id === over.id) return

    // Parse drag item IDs (format: "field-pageIdx-sectionIdx-fieldIdx" or "section-pageIdx-sectionIdx" or "empty-pageIdx-sectionIdx-row-col")
    const activeData = active.id.split('-')
    const overData = over.id.split('-')

    if (activeData[0] === 'field' && overData[0] === 'field') {
      // Field reordering - swap positions
      handleFieldDrop(activeData, overData)
    } else if (activeData[0] === 'field' && overData[0] === 'empty') {
      // Dropping field on empty space - move to that position
      handleFieldDropOnEmpty(activeData, overData)
    } else if (activeData[0] === 'section' && overData[0] === 'section') {
      // Section reordering
      handleSectionDrop(activeData, overData)
    }
  }

  const handleFieldDrop = (activeData, overData) => {
    const [, activePageIdx, activeSectionIdx, activeFieldIdx] = activeData.map(Number)
    const [, overPageIdx, overSectionIdx, overFieldIdx] = overData.map(Number)

    const updatedPages = [...formData.pages]
    
    // Get the fields (create copies to avoid mutation issues)
    const movingField = { ...updatedPages[activePageIdx].sections[activeSectionIdx].fields[activeFieldIdx] }
    const targetField = { ...updatedPages[overPageIdx].sections[overSectionIdx].fields[overFieldIdx] }
    
    // Store original positions
    const movingRow = movingField.gridRow || 1
    const movingCol = movingField.gridColumn || 1
    const targetRow = targetField.gridRow || 1
    const targetCol = targetField.gridColumn || 1
    
    // Swap grid positions
    movingField.gridRow = targetRow
    movingField.gridColumn = targetCol
    
    targetField.gridRow = movingRow
    targetField.gridColumn = movingCol
    
    // Update in place
    if (activePageIdx === overPageIdx && activeSectionIdx === overSectionIdx) {
      // Same section - just swap the fields
      const newFields = [...updatedPages[activePageIdx].sections[activeSectionIdx].fields]
      newFields[activeFieldIdx] = movingField
      newFields[overFieldIdx] = targetField
      updatedPages[activePageIdx].sections[activeSectionIdx].fields = newFields
    } else {
      // Different sections - move the field and keep target
      updatedPages[activePageIdx].sections[activeSectionIdx].fields = 
        updatedPages[activePageIdx].sections[activeSectionIdx].fields.filter((_, i) => i !== activeFieldIdx)
      
      updatedPages[overPageIdx].sections[overSectionIdx].fields = [
        ...updatedPages[overPageIdx].sections[overSectionIdx].fields,
        movingField
      ]
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleFieldDropOnEmpty = (activeData, overData) => {
    const [, activePageIdx, activeSectionIdx, activeFieldIdx] = activeData.map(Number)
    const [, targetPageIdx, targetSectionIdx, targetRow, targetCol] = overData.map(Number)

    const updatedPages = [...formData.pages]
    
    // Get the field being moved (create a copy to avoid mutation)
    const movingField = { ...updatedPages[activePageIdx].sections[activeSectionIdx].fields[activeFieldIdx] }
    const fieldSpan = movingField.columnSpan || 4
    
    // Check if field can fit at target position (basic check)
    if (targetCol + fieldSpan - 1 > 12) {
      // Field won't fit - don't drop
      console.log('Field won\'t fit at this position - exceeds 12 columns')
      return
    }
    
    // Get the target section
    let targetSection = updatedPages[targetPageIdx].sections[targetSectionIdx]
    
    // If moving within the same section, we need to exclude the moving field from collision detection
    const isMovingWithinSection = activePageIdx === targetPageIdx && activeSectionIdx === targetSectionIdx
    
    // Get all fields in the target section (excluding the moving field if same section)
    let fieldsToCheck = isMovingWithinSection 
      ? targetSection.fields.filter((_, i) => i !== activeFieldIdx)
      : targetSection.fields
    
    // Check for collisions and shift fields if needed
    const newFieldEndCol = targetCol + fieldSpan - 1
    
    fieldsToCheck = fieldsToCheck.map(field => {
      const fieldRow = field.gridRow || 1
      const fieldCol = field.gridColumn || 1
      const fieldSpanSize = field.columnSpan || 4
      const fieldEndCol = fieldCol + fieldSpanSize - 1
      
      // Check if this field is on the same row and would overlap
      if (fieldRow === targetRow) {
        // Check for overlap: field occupies some space that the new field needs
        const hasOverlap = (
          (fieldCol >= targetCol && fieldCol <= newFieldEndCol) || // Field starts within new field
          (fieldEndCol >= targetCol && fieldEndCol <= newFieldEndCol) || // Field ends within new field
          (fieldCol < targetCol && fieldEndCol > newFieldEndCol) // Field completely contains new field
        )
        
        if (hasOverlap) {
          // This field needs to be shifted
          const newCol = newFieldEndCol + 1
          
          if (newCol + fieldSpanSize - 1 <= 12) {
            // Can fit on same row, shift right
            return { ...field, gridColumn: newCol }
          } else {
            // Can't fit on same row, move to next row
            return { ...field, gridRow: targetRow + 1, gridColumn: 1 }
          }
        }
      }
      
      return field
    })
    
    // Update the moving field's position
    movingField.gridRow = targetRow
    movingField.gridColumn = targetCol
    
    // Reconstruct the fields array
    if (isMovingWithinSection) {
      // Same section - update the moving field and apply shifted fields
      const newFields = [...fieldsToCheck]
      newFields.splice(activeFieldIdx, 0, movingField) // Insert at original index
      updatedPages[activePageIdx].sections[activeSectionIdx].fields = newFields
    } else {
      // Different sections
      // Remove from source section
      updatedPages[activePageIdx].sections[activeSectionIdx].fields = 
        updatedPages[activePageIdx].sections[activeSectionIdx].fields.filter((_, i) => i !== activeFieldIdx)
      
      // Add to target section with shifted fields
      updatedPages[targetPageIdx].sections[targetSectionIdx].fields = [
        ...fieldsToCheck,
        movingField
      ]
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleSectionDrop = (activeData, overData) => {
    const [, activePageIdx, activeSectionIdx] = activeData.map(Number)
    const [, overPageIdx, overSectionIdx] = overData.map(Number)

    // Only allow reordering within the same page for now
    if (activePageIdx !== overPageIdx) {
      // Moving section across pages
      const updatedPages = [...formData.pages]
      const section = updatedPages[activePageIdx].sections[activeSectionIdx]
      
      // Remove from source page
      updatedPages[activePageIdx].sections.splice(activeSectionIdx, 1)
      
      // Add to destination page
      updatedPages[overPageIdx].sections.splice(overSectionIdx, 0, section)
      
      setFormData({ ...formData, pages: updatedPages })
    } else {
      // Reordering within same page
      const updatedPages = [...formData.pages]
      const sections = [...updatedPages[activePageIdx].sections]
      const [movedSection] = sections.splice(activeSectionIdx, 1)
      sections.splice(overSectionIdx, 0, movedSection)
      
      updatedPages[activePageIdx].sections = sections
      setFormData({ ...formData, pages: updatedPages })
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    if (formData.pages.length === 0) {
      alert('Form must have at least one tab')
      return
    }
    
    // Check if all tabs have titles
    const missingTitles = formData.pages.some(page => !page.title || !page.title.trim())
    if (missingTitles) {
      alert('Please provide a title for all tabs')
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
      alert('Form must have at least one tab')
      return
    }
    
    // Check if all tabs have titles
    const missingTitles = formData.pages.some(page => !page.title || !page.title.trim())
    if (missingTitles) {
      alert('Please provide a title for all tabs')
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
  // Note: Label and hint are rendered in SortableField wrapper, so we don't render them here
  const renderFieldPreview = (field, pageIndex, sectionIndex, fieldIndex) => {
    // Render fields without labels/hints since they're shown in the SortableField wrapper
    // This provides a true WYSIWYG experience for admins
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'date':
        return (
          <input
            type={field.type || 'text'}
            placeholder={field.placeholder || ''}
            disabled
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-600"
          />
        )
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || ''}
            rows={field.rows || 4}
            disabled
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-600"
          />
        )
      
      case 'select':
        return (
          <select 
            disabled
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-600"
          >
            <option value="">Select {field.label || 'an option'}</option>
            {(field.options || []).map((opt, i) => {
              const optValue = typeof opt === 'object' ? opt.value : opt
              const optLabel = typeof opt === 'object' ? opt.label : opt
              return (
                <option key={i} value={optValue}>{optLabel}</option>
              )
            })}
          </select>
        )
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              disabled
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.placeholder || 'Check this box'}</span>
          </label>
        )
      
      case 'radio':
        return (
          <div className="space-y-2">
            {(field.options || ['Option 1', 'Option 2']).map((opt, i) => {
              const optLabel = typeof opt === 'object' ? opt.label : opt
              return (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={field.name}
                    disabled
                    className="border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{optLabel}</span>
                </label>
              )
            })}
          </div>
        )
      
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder || ''}
            disabled
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-600"
          />
        )
    }
  }

  const currentPage = formData.pages[currentPageIndex]

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <form onSubmit={handleSubmit} id="form-builder-form">
          {/* Hidden submit button for external trigger */}
          <button type="submit" id="form-builder-submit" className="hidden" />
          <button type="button" id="form-builder-publish" onClick={handleSaveAndPublish} className="hidden" />
          
          {/* Page Tabs */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-end gap-2 overflow-x-auto -mb-px">
                  {formData.pages.map((page, index) => (
                    <div 
                      key={page.id} 
                      className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                        currentPageIndex === index
                          ? 'border-primary-600'
                          : 'border-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPageIndex(index)
                          // Cancel adding field when switching pages
                          if (addingFieldTo) {
                            setAddingFieldTo(null)
                          }
                        }}
                        className={`text-sm font-medium transition-colors whitespace-nowrap ${
                          currentPageIndex === index
                            ? 'text-primary-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {page.title}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenTabConfig(index)
                        }}
                        className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="Tab settings"
                      >
                        <FiSettings size={14} />
                      </button>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePage(index)
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete tab"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <Button type="button" size="sm" onClick={handleAddPage} className="flex-shrink-0">
                <FiPlus className="mr-1" /> Add Tab
              </Button>
            </div>
          </div>

        {/* Current Page Content */}
        {currentPage && (
          <Card className="mb-4">
            {/* Sections with Drag & Drop */}
            <SortableContext
              items={currentPage.sections.map((s, i) => `section-${currentPageIndex}-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {currentPage.sections.map((section, sectionIndex) => (
                  <div 
                    key={section.id} 
                    ref={el => sectionRefs.current[section.id] = el}
                    data-section-id={section.id}
                  >
                    <SortableSection
                      id={`section-${currentPageIndex}-${sectionIndex}`}
                      section={section}
                      pageIndex={currentPageIndex}
                      sectionIndex={sectionIndex}
                      isCollapsed={collapsedSections[section.id]}
                      onToggleCollapse={() => toggleSection(section.id)}
                      onOpenConfig={handleOpenSectionConfig}
                      onDelete={handleDeleteSection}
                    >
                      {/* Fields - Explicit 12 Column Grid */}
                      <SortableContext
                        items={section.fields.map((f, i) => `field-${currentPageIndex}-${sectionIndex}-${i}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="mb-3 pl-4 relative">
                          
                          {(() => {
                            // Calculate total rows needed (always add 1 extra row for dragging)
                            const maxRow = section.fields.reduce((max, field) => 
                              Math.max(max, field.gridRow || 1), 0
                            ) || 1
                            
                            const totalRows = maxRow + 1 // Always show 1 extra row for drag targets
                            
                            const rows = []
                            
                            // Create each row explicitly (including empty rows for drag targets)
                            for (let row = 1; row <= totalRows; row++) {
                              const rowFields = section.fields.filter(f => (f.gridRow || 1) === row)
                              const cells = []
                              
                              // Create all 12 columns for this row
                              for (let col = 1; col <= 12; col++) {
                                // Check if a field starts at this column
                                const fieldAtCol = rowFields.find(f => (f.gridColumn || 1) === col)
                                
                                if (fieldAtCol) {
                                  const fieldIndex = section.fields.indexOf(fieldAtCol)
                                  const span = fieldAtCol.columnSpan || 4
                                  
                                  cells.push(
                                    <div
                                      key={`field-${row}-${col}`}
                                      className="relative"
                                      style={{
                                        gridColumn: `${col} / span ${span}`,
                                        gridRow: row
                                      }}
                                    >
                                      <SortableField
                                        id={`field-${currentPageIndex}-${sectionIndex}-${fieldIndex}`}
                                        field={fieldAtCol}
                                        pageIndex={currentPageIndex}
                                        sectionIndex={sectionIndex}
                                        fieldIndex={fieldIndex}
                                        columnSpan={span}
                                        renderFieldPreview={renderFieldPreview}
                                        onOpenConfig={handleOpenFieldConfig}
                                        onDelete={handleDeleteField}
                                        onDuplicate={handleDuplicateField}
                                        onResize={handleResizeField}
                                        onResizeComplete={handleResizeField}
                                      />
                                    </div>
                                  )
                                  
                                  // Skip the columns occupied by this field
                                  col += span - 1
                                } else {
                                  // Check if this column is occupied by a field that started earlier
                                  const occupiedByField = rowFields.find(f => {
                                    const fCol = f.gridColumn || 1
                                    const fSpan = f.columnSpan || 4
                                    return col >= fCol && col < fCol + fSpan
                                  })
                                  
                                  if (!occupiedByField) {
                                    // Check if this is where the drag preview should show
                                    const isPreviewLocation = dragPreview &&
                                      dragPreview.pageIndex === currentPageIndex &&
                                      dragPreview.sectionIndex === sectionIndex &&
                                      dragPreview.row === row &&
                                      col >= dragPreview.col &&
                                      col < dragPreview.col + dragPreview.span
                                    
                                    // Always render the droppable cell
                                    cells.push(
                                      <div
                                        key={`empty-${row}-${col}`}
                                        style={{
                                          gridColumn: col,
                                          gridRow: row,
                                          position: 'relative'
                                        }}
                                      >
                                        {/* Droppable zone - always present */}
                                        <DroppableCell
                                          id={`empty-${currentPageIndex}-${sectionIndex}-${row}-${col}`}
                                          row={row}
                                          col={col}
                                          isDragging={!!activeId}
                                          onHover={() => {
                                            if (dragPreview) {
                                              setDragPreview({
                                                ...dragPreview,
                                                pageIndex: currentPageIndex,
                                                sectionIndex: sectionIndex,
                                                row: row,
                                                col: col
                                              })
                                            }
                                          }}
                                        />
                                        
                                        {/* Visual preview overlay - only at preview start column */}
                                        {isPreviewLocation && col === dragPreview.col && (() => {
                                          const canFit = col + dragPreview.span - 1 <= 12
                                          
                                          // Check if there are fields that would need shifting
                                          const activeFieldId = activeId?.split('-')
                                          const isFromSameSection = activeFieldId && 
                                            activeFieldId[0] === 'field' &&
                                            Number(activeFieldId[1]) === currentPageIndex &&
                                            Number(activeFieldId[2]) === sectionIndex
                                          
                                          const fieldsInWay = section.fields.filter((f, i) => {
                                            // Skip the field being moved if from same section
                                            if (isFromSameSection && i === Number(activeFieldId[3])) return false
                                            
                                            const fRow = f.gridRow || 1
                                            const fCol = f.gridColumn || 1
                                            const fSpan = f.columnSpan || 4
                                            const fEndCol = fCol + fSpan - 1
                                            const newFieldEndCol = col + dragPreview.span - 1
                                            
                                            // Check if on same row and overlaps
                                            if (fRow === row) {
                                              return (
                                                (fCol >= col && fCol <= newFieldEndCol) ||
                                                (fEndCol >= col && fEndCol <= newFieldEndCol) ||
                                                (fCol < col && fEndCol > newFieldEndCol)
                                              )
                                            }
                                            return false
                                          })
                                          
                                          const willShift = fieldsInWay.length > 0
                                          
                                          return (
                                            <div
                                              className={`absolute inset-0 border-4 border-dashed rounded-lg flex flex-col items-center justify-center shadow-xl z-50 pointer-events-none ${
                                                canFit 
                                                  ? (willShift ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-green-50')
                                                  : 'border-red-500 bg-red-50'
                                              }`}
                                              style={{
                                                width: `calc(${Math.min(dragPreview.span, 12 - col + 1)} * 100% + ${Math.min(dragPreview.span, 12 - col + 1) - 1} * 1rem)`,
                                                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                                left: 0,
                                                top: 0
                                              }}
                                            >
                                              <div className={`absolute inset-0 opacity-70 rounded-lg ${
                                                canFit 
                                                  ? (willShift ? 'bg-gradient-to-br from-yellow-100 to-yellow-50' : 'bg-gradient-to-br from-green-100 to-green-50')
                                                  : 'bg-gradient-to-br from-red-100 to-red-50'
                                              }`} />
                                              <div className={`relative font-bold text-center z-10 ${
                                                canFit 
                                                  ? (willShift ? 'text-yellow-700' : 'text-green-700')
                                                  : 'text-red-700'
                                              }`}>
                                                <div className="text-4xl mb-2 animate-bounce">
                                                  {canFit ? (willShift ? '⇄' : '↓') : '✕'}
                                                </div>
                                                <div className="text-base mb-1">
                                                  {canFit ? (willShift ? 'Will Shift Fields' : 'Drop Here') : 'Won\'t Fit'}
                                                </div>
                                                <div className="flex flex-col items-center gap-1 mt-1">
                                                  <div className={`text-white text-xs font-bold px-2 py-1 rounded-full ${
                                                    canFit 
                                                      ? (willShift ? 'bg-yellow-600' : 'bg-green-600')
                                                      : 'bg-red-600'
                                                  }`}>
                                                    {dragPreview.span} / 12 cols
                                                  </div>
                                                  {willShift && (
                                                    <div className="text-xs text-yellow-800 mt-1">
                                                      {fieldsInWay.length} field{fieldsInWay.length > 1 ? 's' : ''} will move
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        })()}
                                      </div>
                                    )
                                  }
                                }
                              }
                              
                              rows.push(
                                <div key={`row-${row}`} className="grid grid-cols-12 gap-3 mb-3">
                                  {cells}
                                </div>
                              )
                            }
                            
                            return rows
                          })()}
                        </div>
                      </SortableContext>

                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartAddingField(currentPageIndex, sectionIndex)}
                        >
                          <FiPlus className="mr-1" /> Add Field
                        </Button>
                      </div>
                    </SortableSection>
                  </div>
                ))}
              </div>
            </SortableContext>

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
      {currentPage.sections && currentPage.sections.length > 1 && (
        <RightResizableSidebar
          minWidth={200}
          maxWidth={400}
          defaultWidth={256}
          collapsedWidth={48}
          storageKey="formBuilderSectionSidebarWidth"
          className="flex-shrink-0 h-full"
        >
          {({ isCollapsed }) => (
            <>
              {!isCollapsed && (
                <div className="h-full p-4 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Sections ({currentPage.sections?.length || 0})
                  </h3>
                  
                  <div className="space-y-2">
                    {currentPage.sections?.map((section, index) => {
                      const sectionId = section.id
                      const status = sectionStatus[sectionId] || 'empty'
                      const isActive = activeSectionId === sectionId
                      
                      return (
                        <button
                          key={sectionId}
                          type="button"
                          onClick={() => scrollToSection(sectionId)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                            isActive
                              ? 'bg-primary-50 border-2 border-primary-500 ring-2 ring-primary-100 dark:bg-primary-900/20 dark:border-primary-400'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {/* Status Icon */}
                            <div className="mt-0.5 flex-shrink-0">
                              {status === 'valid' && (
                                <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              )}
                              {status === 'empty' && (
                                <FiCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              )}
                              {status === 'error' && (
                                <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            
                            {/* Section Title */}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${
                                isActive 
                                  ? 'text-primary-700 dark:text-primary-300' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {section.title}
                              </div>
                              
                              {/* Field Count */}
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {section.fields?.length || 0} fields
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

      {/* Field Type Selector or Field/Section Config Panel */}
      {addingFieldTo ? (
        <FieldTypeSelectorPanel
          sectionTitle={formData.pages[addingFieldTo.pageIndex]?.sections[addingFieldTo.sectionIndex]?.title}
          onSelect={(fieldType) => {
            handleAddField(addingFieldTo.pageIndex, addingFieldTo.sectionIndex, fieldType)
            // Keep selector open for adding multiple fields
          }}
          onClose={handleCancelAddingField}
        />
      ) : editingConfig && (
        <FieldConfigPanel
          field={editingConfig.data}
          type={editingConfig.type}
          onSave={handleSaveConfig}
          onClose={handleCloseConfig}
          onConfigChange={handleConfigChange}
        />
      )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && activeId.startsWith('field') && (() => {
          const [, pageIdx, sectionIdx, fieldIdx] = activeId.split('-').map(Number)
          const field = formData.pages[pageIdx]?.sections[sectionIdx]?.fields[fieldIdx]
          return field ? (
            <DragOverlayField 
              field={field} 
              columnSpan={field.columnSpan || 4} 
            />
          ) : null
        })()}
      </DragOverlay>
      </DndContext>
    </div>
  )
}

export default FormBuilder

