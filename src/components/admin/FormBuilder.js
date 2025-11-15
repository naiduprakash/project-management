'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Card from '@/components/common/Card'
import RightResizableSidebar from '@/components/common/RightResizableSidebar'
import FieldConfigPanel from '@/components/admin/FieldConfigPanel'
import { FiPlus, FiTrash2, FiSettings, FiChevronRight, FiChevronLeft, FiMove, FiMenu, FiType, FiHash, FiCalendar, FiAlignLeft, FiCheckSquare, FiChevronDown, FiMail, FiCheckCircle, FiCircle, FiAlertCircle, FiX, FiCopy, FiToggleLeft, FiLayers, FiMinus, FiMaximize2, FiFolder, FiInfo } from 'react-icons/fi'
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
import { getNextGridPosition, migrateFieldsToGrid } from '@/lib/gridLayoutUtils'

// Custom styles for section/tab hover actions
const hoverStyles = `
  .hover-parent:hover > .section-actions {
    opacity: 1;
  }
`

/**
 * Sortable Field Component with Resizable Edges
 */
const SortableField = ({ id, field, pageIndex, sectionIndex, fieldIndex, fieldPath = [], isDesktop, renderFieldPreview, onOpenConfig, onDelete, onDuplicate, columnSpan, onResize, onResizeComplete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const [duplicateDisabled, setDuplicateDisabled] = useState(false)

  // Use the desktop detection passed from parent
  const isMobile = !isDesktop

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1
  }

  const handleResize = (newSpan) => {
    if (onResizeComplete) {
      const fullPath = [...fieldPath, fieldIndex]
      onResizeComplete(pageIndex, sectionIndex, fullPath, newSpan)
    }
  }

  if (!field) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group h-full"
    >
      {/* Field Preview */}
      <div 
        className="relative border-2 border-dashed rounded-md p-2 transition-all select-none border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500"
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 select-none">
          {field.label}
          {(field.required || field.validation?.required) && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          <span className="ml-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
            {typeof field.columnSpan === 'object' ? (
              <span title={`Mobile: ${field.columnSpan.mobile || 12}/12, Tablet: ${field.columnSpan.tablet || 6}/12, Desktop: ${field.columnSpan.desktop || 4}/12`} className="inline-flex items-center gap-1">
                <span className="text-blue-500">↔️</span>
                (📱 {field.columnSpan.mobile || 12} | 📱 {field.columnSpan.tablet || 6} | 🖥️ {field.columnSpan.desktop || 4})
              </span>
            ) : (
              `(${columnSpan}/12)`
            )}
          </span>
        </label>
        {renderFieldPreview(field, pageIndex, sectionIndex, fieldIndex)}
        {field.hint && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 select-none">{field.hint}</p>
        )}

        {/* Action controls */}
        <div className={`absolute flex gap-1 ${isMobile ? 'top-2 right-2' : 'bottom-2 left-2 opacity-0 group-hover:opacity-100'} transition-opacity`}>
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <FiMove className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>

            <button
              type="button"
              onClick={() => onOpenConfig(pageIndex, sectionIndex, fieldIndex, fieldPath)}
              className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Configure field"
            >
              <FiSettings className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Decrease Width Button */}
            <button
              type="button"
              onClick={() => handleResize(columnSpan - 1)}
              disabled={columnSpan <= 1}
              className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
              title={columnSpan <= 1 ? "Minimum width reached" : "Decrease width"}
            >
              <FiMinus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </button>

            {/* Increase Width Button */}
            <button
              type="button"
              onClick={() => handleResize(columnSpan + 1)}
              disabled={columnSpan >= 12}
              className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
              title={columnSpan >= 12 ? "Maximum width reached" : "Increase width"}
            >
              <FiMaximize2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDuplicateDisabled(true)
                setTimeout(() => setDuplicateDisabled(false), 700) // Prevent rapid double triggers
                onDuplicate(pageIndex, sectionIndex, fieldIndex, fieldPath)
              }}
              disabled={duplicateDisabled}
              className={`p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${duplicateDisabled ? 'opacity-50 pointer-events-none' : ''}`}
              title="Duplicate field"
            >
              <FiCopy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(pageIndex, sectionIndex, fieldIndex, fieldPath)}
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
          {typeof columnSpan === 'object' ? (columnSpan.desktop || 4) : columnSpan}/12
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Lock body scroll when mobile panel is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isMobile])
  
  const fieldTypes = [
    { type: 'text', label: 'Text', icon: FiType, description: 'Single line text input', color: 'blue' },
    { type: 'email', label: 'Email', icon: FiMail, description: 'Email address input', color: 'purple' },
    { type: 'number', label: 'Number', icon: FiHash, description: 'Numeric input', color: 'green' },
    { type: 'date', label: 'Date', icon: FiCalendar, description: 'Date picker', color: 'orange' },
    { type: 'textarea', label: 'Textarea', icon: FiAlignLeft, description: 'Multi-line text', color: 'indigo' },
    { type: 'select', label: 'Dropdown', icon: FiChevronDown, description: 'Select from options', color: 'pink' },
    { type: 'checkbox', label: 'Checkbox', icon: FiCheckSquare, description: 'Yes/No checkbox', color: 'teal' },
    { type: 'checkbox_group', label: 'Checkbox Group', icon: FiCheckSquare, description: 'Multiple checkboxes', color: 'cyan' },
    { type: 'radio_group', label: 'Radio Group', icon: FiCircle, description: 'Choose one from options', color: 'yellow' },
    { type: 'toggle', label: 'Toggle', icon: FiToggleLeft, description: 'On/Off toggle', color: 'lime' },
    { type: 'info', label: 'Text Display', icon: FiInfo, description: 'Customizable text (heading, info, warning, etc)', color: 'sky' },
    { type: 'section', label: 'Nested Section', icon: FiLayers, description: 'Group of fields (supports nesting & repeating)', color: 'violet' },
    { type: 'tab', label: 'Nested Tabs', icon: FiFolder, description: 'Nested tab pages with sections (tabs within tabs)', color: 'amber' },
  ]
  
  return (
    <>
      {/* Mobile: Backdrop overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          style={{ transition: 'opacity 0.3s ease' }}
        />
      )}

      {/* Panel */}
      <div className={`bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 overflow-y-auto ${
        isMobile
          ? 'fixed inset-y-0 right-0 w-full max-w-sm'
          : 'fixed inset-y-0 right-0 w-96'
      }`}>
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
    </>
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
 * Helper to parse field path from ID (handles mixed string/number paths)
 */
const parseFieldPathFromId = (pathParts) => {
  return pathParts.map(part => {
    const num = Number(part)
    return !isNaN(num) ? num : part // Keep strings as strings, numbers as numbers
  })
}

/**
 * Recursive Section Renderer - Handles both top-level and nested sections
 */
const RecursiveSectionContent = ({
  section,
  pageIndex,
  sectionIndex,
  fieldPath = [], // Array tracking the path to nested field: [fieldIndex1, fieldIndex2, ...]
  isDesktop,
  renderFieldPreview,
  onStartAddingField,
  onOpenFieldConfig,
  onDeleteField,
  onDuplicateField,
  onResizeField,
  onUpdateField,
  activeId,
  dragPreview,
  setDragPreview,
  onAddSectionToNestedTab,
  onDeleteSectionFromNestedTab
}) => {
  const fields = section.fields || []
  const isNested = fieldPath.length > 0
  
  // Generate field ID for sortable context
  const getFieldId = (fieldIndex) => {
    // Always use consistent format with fieldPath (empty string for top-level)
    const pathStr = fieldPath.length > 0 ? fieldPath.join('-') + '-' : ''
    return `field-${pageIndex}-${sectionIndex}-${pathStr}${fieldIndex}`
  }
  
  // Render grid with fields
  const renderGrid = () => {
    if (fields.length === 0) {
      return (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-3">No fields yet</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onStartAddingField(pageIndex, sectionIndex, fieldPath)}
          >
            <FiPlus className="mr-2" /> Add First Field
          </Button>
        </div>
      )
    }

    // Mobile: Simple stacked layout without grid cells
    if (!isDesktop) {
      // Sort fields by their grid position to maintain desktop visual order
      const sortedFields = fields.map((field, index) => ({ field, originalIndex: index }))
        .sort((a, b) => {
          const aRow = a.field.gridRow || 1
          const bRow = b.field.gridRow || 1
          const aCol = a.field.gridColumn || 1
          const bCol = b.field.gridColumn || 1

          if (aRow !== bRow) return aRow - bRow
          return aCol - bCol
        })

      return (
        <div className="space-y-3">
          {sortedFields.map(({ field, originalIndex: fieldIndex }) => {
            const fieldId = getFieldId(fieldIndex)
            return (
              <div key={fieldId} className="relative w-full">
                {field.type === 'section' ? (
                  <SortableNestedSection
                    id={fieldId}
                    field={field}
                    pageIndex={pageIndex}
                    sectionIndex={sectionIndex}
                    fieldIndex={fieldIndex}
                    fieldPath={[...fieldPath, fieldIndex]}
                    columnSpan={typeof field.columnSpan === 'object' ? (field.columnSpan.desktop || 4) : (field.columnSpan || 4)}
                    isDesktop={isDesktop}
                    renderFieldPreview={renderFieldPreview}
                    onStartAddingField={onStartAddingField}
                    onOpenFieldConfig={onOpenFieldConfig}
                    onDeleteField={onDeleteField}
                    onDuplicateField={onDuplicateField}
                    onResizeField={onResizeField}
                    onUpdateField={onUpdateField}
                    activeId={activeId}
                    dragPreview={dragPreview}
                    setDragPreview={setDragPreview}
                    onAddSectionToNestedTab={onAddSectionToNestedTab}
                    onDeleteSectionFromNestedTab={onDeleteSectionFromNestedTab}
                  />
                ) : field.type === 'tab' ? (
                  <SortableNestedTabs
                    id={fieldId}
                    field={field}
                    pageIndex={pageIndex}
                    sectionIndex={sectionIndex}
                    fieldIndex={fieldIndex}
                    fieldPath={[...fieldPath, fieldIndex]}
                    columnSpan={typeof field.columnSpan === 'object' ? (field.columnSpan.desktop || 4) : (field.columnSpan || 4)}
                    onOpenFieldConfig={onOpenFieldConfig}
                    onDeleteField={onDeleteField}
                    onDuplicateField={onDuplicateField}
                    onUpdateField={onUpdateField}
                    activeId={activeId}
                    onAddSection={onAddSectionToNestedTab}
                    onDeleteSection={onDeleteSectionFromNestedTab}
                    renderFieldPreview={renderFieldPreview}
                    onStartAddingField={onStartAddingField}
                    onResizeField={onResizeField}
                    dragPreview={dragPreview}
                    setDragPreview={setDragPreview}
                  />
                ) : (
                  <SortableField
                    id={fieldId}
                    field={field}
                    pageIndex={pageIndex}
                    sectionIndex={sectionIndex}
                    fieldIndex={fieldIndex}
                    fieldPath={fieldPath}
                    columnSpan={typeof field.columnSpan === 'object' ? (field.columnSpan.desktop || 4) : (field.columnSpan || 4)}
                    isDesktop={isDesktop}
                    renderFieldPreview={renderFieldPreview}
                    onOpenConfig={onOpenFieldConfig}
                    onDelete={onDeleteField}
                    onDuplicate={onDuplicateField}
                    onResize={onResizeField}
                    onResizeComplete={onResizeField}
                  />
                )}
              </div>
            )
          })}
        </div>
      )
    }

    // Calculate total rows needed (always add 1 extra row for dragging)
    const maxRow = fields.reduce((max, field) =>
      Math.max(max, field.gridRow || 1), 0
    ) || 1
    const totalRows = maxRow + 1 // Always show 1 extra row for drag targets

    const rows = []

    // Create each row explicitly (including empty rows for drag targets)
    for (let row = 1; row <= totalRows; row++) {
      const rowFields = fields.filter(f => (f.gridRow || 1) === row)
      const cells = []

      // Create all 12 columns for this row
      for (let col = 1; col <= 12; col++) {
        // Check if a field starts at this column
        const fieldAtCol = rowFields.find(f => (f.gridColumn || 1) === col)

        if (fieldAtCol) {
          const fieldIndex = fields.indexOf(fieldAtCol)
          const span = typeof fieldAtCol.columnSpan === 'object' ? (fieldAtCol.columnSpan.desktop || 4) : (fieldAtCol.columnSpan || 4)

          cells.push(
            <div
              key={`field-${row}-${col}`}
              className={`relative ${!isDesktop ? 'w-full' : ''}`}
              style={{
                // Only use absolute positioning on desktop, no styles on mobile/tablet
                ...(isDesktop ? {
                  gridColumn: getGridColumnStyleForBuilder(fieldAtCol.columnSpan, col),
                  gridRow: row
                } : {})
              }}
            >
              {fieldAtCol.type === 'section' ? (
                // Render nested section with drag support
                <SortableNestedSection
                  id={getFieldId(fieldIndex)}
                  field={fieldAtCol}
                  pageIndex={pageIndex}
                  sectionIndex={sectionIndex}
                  fieldIndex={fieldIndex}
                  fieldPath={[...fieldPath, fieldIndex]}
                  columnSpan={span}
                  isDesktop={isDesktop}
                  renderFieldPreview={renderFieldPreview}
                  onStartAddingField={onStartAddingField}
                  onOpenFieldConfig={onOpenFieldConfig}
                  onDeleteField={onDeleteField}
                  onDuplicateField={onDuplicateField}
                  onResizeField={onResizeField}
                  onUpdateField={onUpdateField}
                  activeId={activeId}
                  dragPreview={dragPreview}
                  setDragPreview={setDragPreview}
                  onAddSectionToNestedTab={onAddSectionToNestedTab}
                  onDeleteSectionFromNestedTab={onDeleteSectionFromNestedTab}
                />
              ) : fieldAtCol.type === 'tab' ? (
                // Render nested tabs with drag support
                <SortableNestedTabs
                  id={getFieldId(fieldIndex)}
                  field={fieldAtCol}
                  pageIndex={pageIndex}
                  sectionIndex={sectionIndex}
                  fieldIndex={fieldIndex}
                  fieldPath={[...fieldPath, fieldIndex]}
                  columnSpan={span}
                  isDesktop={isDesktop}
                  onOpenFieldConfig={onOpenFieldConfig}
                  onDeleteField={onDeleteField}
                  onDuplicateField={onDuplicateField}
                  onUpdateField={onUpdateField}
                  activeId={activeId}
                  onAddSection={onAddSectionToNestedTab}
                  onDeleteSection={onDeleteSectionFromNestedTab}
                  renderFieldPreview={renderFieldPreview}
                  onStartAddingField={onStartAddingField}
                  onResizeField={onResizeField}
                  dragPreview={dragPreview}
                  setDragPreview={setDragPreview}
                />
              ) : (
                // Render regular field with drag support
                <SortableField
                  id={getFieldId(fieldIndex)}
                  field={fieldAtCol}
                  pageIndex={pageIndex}
                  sectionIndex={sectionIndex}
                  fieldIndex={fieldIndex}
                  fieldPath={fieldPath}
                  columnSpan={span}
                  isDesktop={isDesktop}
                  renderFieldPreview={renderFieldPreview}
                  onOpenConfig={onOpenFieldConfig}
                  onDelete={onDeleteField}
                  onDuplicate={onDuplicateField}
                  onResize={onResizeField}
                  onResizeComplete={onResizeField}
                />
              )}
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
              dragPreview.pageIndex === pageIndex &&
              dragPreview.sectionIndex === sectionIndex &&
              JSON.stringify(dragPreview.fieldPath || []) === JSON.stringify(fieldPath) &&
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
                  id={`empty-${pageIndex}-${sectionIndex}-${fieldPath.length > 0 ? fieldPath.join('-') + '-' : ''}${row}-${col}`}
                  row={row}
                  col={col}
                  isDragging={!!activeId}
                  onHover={() => {
                    if (dragPreview) {
                      setDragPreview({
                        ...dragPreview,
                        pageIndex: pageIndex,
                        sectionIndex: sectionIndex,
                        fieldPath: fieldPath,
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
                  // Check if dragging from same section/path
                  const activeFieldPath = activeFieldId ? parseFieldPathFromId(activeFieldId.slice(3, -1)) : []
                  const isFromSameSection = activeFieldId &&
                    activeFieldId[0] === 'field' &&
                    Number(activeFieldId[1]) === pageIndex &&
                    Number(activeFieldId[2]) === sectionIndex &&
                    JSON.stringify(activeFieldPath) === JSON.stringify(fieldPath)

                  const fieldsInWay = fields.filter((f, i) => {
                    // Skip the field being moved if from same section
                    if (isFromSameSection && i === Number(activeFieldId[activeFieldId.length - 1])) return false

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
                          ? (willShift ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-green-500 bg-green-50 dark:bg-green-900/20')
                          : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      }`}
                      style={{
                        width: `calc(${Math.min(dragPreview.span, 12 - col + 1)} * 100% + ${Math.min(dragPreview.span, 12 - col + 1) - 1} * 0.75rem)`,
                        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        left: 0,
                        top: 0
                      }}
                    >
                      <div className={`absolute inset-0 opacity-70 rounded-lg ${
                        canFit
                          ? (willShift ? 'bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/10' : 'bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10')
                          : 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/10'
                      }`} />
                      <div className={`relative font-bold text-center z-10 ${
                        canFit
                          ? (willShift ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300')
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        <div className="text-4xl mb-2 animate-bounce">
                          {canFit ? (willShift ? '⚠️' : '✓') : '✗'}
                        </div>
                        <p className="text-sm font-semibold">
                          {canFit ? (willShift ? 'Will shift fields' : 'Drop here') : 'Not enough space'}
                        </p>
                        <p className="text-xs mt-1 opacity-75">
                          {dragPreview.span} column{dragPreview.span > 1 ? 's' : ''}
                        </p>
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
        <div
          key={row}
          className={isDesktop ? "grid grid-cols-12 gap-3" : "space-y-3"}
          style={isDesktop ? { gridAutoRows: 'min-content' } : {}}
        >
          {cells}
        </div>
      )
    }

    return <div className="space-y-3">{rows}</div>
  }

  return (
    <SortableContext
      items={fields.map((f, i) => getFieldId(i))}
      strategy={verticalListSortingStrategy}
    >
      {renderGrid()}
      
      {/* Add Field Button */}
      {fields.length > 0 && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onStartAddingField(pageIndex, sectionIndex, fieldPath)}
          >
            <FiPlus className="mr-2" /> Add Field
          </Button>
        </div>
      )}
    </SortableContext>
  )
}

/**
 * Sortable Nested Section Component - Wraps nested sections with drag support
 */
const SortableNestedSection = ({
  id,
  field,
  pageIndex,
  sectionIndex,
  fieldIndex,
  fieldPath,
  columnSpan,
  isDesktop,
  renderFieldPreview,
  onStartAddingField,
  onOpenFieldConfig,
  onDeleteField,
  onDuplicateField,
  onResizeField,
  onUpdateField,
  activeId,
  dragPreview,
  setDragPreview,
  onAddSectionToNestedTab,
  onDeleteSectionFromNestedTab
}) => {
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
    opacity: isDragging ? 0.2 : 1
  }

  return (
    <div ref={setNodeRef} style={style}>
      <NestedSectionWrapper
        field={field}
        pageIndex={pageIndex}
        sectionIndex={sectionIndex}
        fieldIndex={fieldIndex}
        fieldPath={fieldPath}
        columnSpan={columnSpan}
        renderFieldPreview={renderFieldPreview}
        onStartAddingField={onStartAddingField}
        onOpenFieldConfig={onOpenFieldConfig}
        onDeleteField={onDeleteField}
        onDuplicateField={onDuplicateField}
        onResizeField={onResizeField}
        onUpdateField={onUpdateField}
        activeId={activeId}
        dragPreview={dragPreview}
        setDragPreview={setDragPreview}
        dragHandleProps={{ attributes, listeners }}
        onAddSectionToNestedTab={onAddSectionToNestedTab}
        onDeleteSectionFromNestedTab={onDeleteSectionFromNestedTab}
      />
    </div>
  )
}

/**
 * Nested Section Wrapper - Wraps a section field with proper styling
 */
const NestedSectionWrapper = ({
  field,
  pageIndex,
  sectionIndex,
  fieldIndex,
  fieldPath,
  renderFieldPreview,
  onStartAddingField,
  onOpenFieldConfig,
  onDeleteField,
  onDuplicateField,
  onResizeField,
  onUpdateField,
  activeId,
  columnSpan,
  dragPreview,
  setDragPreview,
  dragHandleProps,
  onAddSectionToNestedTab,
  onDeleteSectionFromNestedTab
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isRepeater = field.sectionType === 'repeater'

  return (
    <Card className="border-2 border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10 relative hover-parent">
      {/* Nested Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded transition-colors"
        >
          <FiChevronRight
            className={`w-4 h-4 text-primary-600 dark:text-primary-400 transition-transform ${
              isCollapsed ? '' : 'rotate-90'
            }`}
          />
        </button>
        <FiLayers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
          {field.title || field.label || 'Nested Section'}
        </h3>
        {isRepeater && (
          <span className="px-2 py-0.5 text-xs font-medium bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200 rounded">
            Repeater
          </span>
        )}
        {columnSpan && (
          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {typeof columnSpan === 'object' ? (columnSpan.desktop || 4) : columnSpan}/12
          </span>
        )}
      </div>

      {field.description && !isCollapsed && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{field.description}</p>
      )}

      {/* Nested Section Content - Recursive */}
      {!isCollapsed && (
        <div className="mt-3">
          <RecursiveSectionContent
            section={field}
            pageIndex={pageIndex}
            sectionIndex={sectionIndex}
            fieldPath={fieldPath}
            isDesktop={isDesktop}
            renderFieldPreview={renderFieldPreview}
            onStartAddingField={onStartAddingField}
            onOpenFieldConfig={onOpenFieldConfig}
            onDeleteField={onDeleteField}
            onDuplicateField={onDuplicateField}
            onResizeField={onResizeField}
            onUpdateField={onUpdateField}
            activeId={activeId}
            dragPreview={dragPreview}
            setDragPreview={setDragPreview}
            onAddSectionToNestedTab={onAddSectionToNestedTab}
            onDeleteSectionFromNestedTab={onDeleteSectionFromNestedTab}
          />
        </div>
      )}

      {/* Action buttons - bottom left */}
      <div className="absolute bottom-2 left-2 opacity-0 hover-parent:hover:opacity-100 transition-opacity flex gap-1 z-10 section-actions">
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <FiMove className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenFieldConfig(pageIndex, sectionIndex, fieldIndex, fieldPath)}
          className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          title="Configure"
        >
          <FiSettings className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => onDuplicateField(pageIndex, sectionIndex, fieldPath)}
          className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          title="Duplicate Section"
        >
          <FiCopy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteField(pageIndex, sectionIndex, fieldIndex, fieldPath)}
          className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete"
        >
          <FiTrash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </Card>
  )
}

/**
 * Sortable Nested Tabs Component - Wraps nested tabs with drag support
 */
const SortableNestedTabs = ({ 
  id, 
  field, 
  pageIndex, 
  sectionIndex, 
  fieldIndex,
  fieldPath,
  columnSpan,
  isDesktop,
  onOpenFieldConfig,
  onDeleteField,
  onDuplicateField,
  onUpdateField,
  activeId,
  onAddSection,
  onDeleteSection,
  renderFieldPreview,
  onStartAddingField,
  onResizeField,
  dragPreview,
  setDragPreview
}) => {
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
    opacity: isDragging ? 0.2 : 1
  }

  return (
    <div ref={setNodeRef} style={style}>
      <NestedTabsWrapper
        field={field}
        pageIndex={pageIndex}
        sectionIndex={sectionIndex}
        fieldIndex={fieldIndex}
        fieldPath={fieldPath}
        columnSpan={columnSpan}
        isDesktop={isDesktop}
        onOpenFieldConfig={onOpenFieldConfig}
        onDeleteField={onDeleteField}
        onDuplicateField={onDuplicateField}
        onUpdateField={onUpdateField}
        activeId={activeId}
        dragHandleProps={{ attributes, listeners }}
        onAddSection={onAddSection}
        onDeleteSection={onDeleteSection}
        renderFieldPreview={renderFieldPreview}
        onStartAddingField={onStartAddingField}
        onResizeField={onResizeField}
        dragPreview={dragPreview}
        setDragPreview={setDragPreview}
      />
    </div>
  )
}

/**
 * Nested Tabs Wrapper - Wraps a tab field with proper styling
 */
const NestedTabsWrapper = ({
  field,
  pageIndex,
  sectionIndex,
  fieldIndex,
  fieldPath,
  columnSpan,
  isDesktop,
  onOpenFieldConfig,
  onDeleteField,
  onDuplicateField,
  onUpdateField,
  activeId,
  dragHandleProps,
  onAddSection,
  onDeleteSection,
  renderFieldPreview,
  onStartAddingField,
  onResizeField,
  dragPreview,
  setDragPreview
}) => {
  const [activeTab, setActiveTab] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [pendingTabSwitch, setPendingTabSwitch] = useState(null)
  const pages = field.pages || []
  const currentPage = pages[activeTab] || { sections: [] }
  
  // Handle switching to newly added tab
  useEffect(() => {
    if (pendingTabSwitch !== null && pendingTabSwitch < pages.length) {
      setActiveTab(pendingTabSwitch)
      setPendingTabSwitch(null)
    }
  }, [pages.length, pendingTabSwitch])
  
  // Ensure activeTab is within bounds when pages array changes
  useEffect(() => {
    if (activeTab >= pages.length && pages.length > 0) {
      setActiveTab(pages.length - 1)
    }
  }, [pages.length, activeTab])

  return (
    <Card className="border-2 border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10 relative hover-parent">
      {/* Nested Tabs Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
        >
          <FiChevronRight
            className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform ${
              isCollapsed ? '' : 'rotate-90'
            }`}
          />
        </button>
        <FiFolder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          {field.label || 'Nested Tabs'}
        </h3>
        {columnSpan && (
          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {typeof columnSpan === 'object' ? (columnSpan.desktop || 4) : columnSpan}/12
          </span>
        )}
        <span className="px-2 py-0.5 text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
          {pages.length} {pages.length === 1 ? 'Tab' : 'Tabs'}
        </span>
      </div>

      {/* Tab Navigation */}
      {!isCollapsed && pages.length > 0 && (
        <div className="flex items-center gap-2 mb-4 border-b border-blue-200 dark:border-blue-800">
          <div className="flex-1 flex items-center gap-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:dark:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            {pages.map((page, idx) => (
              <div 
                key={page.id || idx}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors flex-shrink-0 ${
                  activeTab === idx
                    ? 'border-blue-600 dark:border-blue-400'
                    : 'border-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === idx
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {page.title || `Tab ${idx + 1}`}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Update the field with a prompt to edit the tab title
                    const newTitle = prompt('Enter tab title:', page.title || `Tab ${idx + 1}`)
                    if (newTitle !== null && newTitle.trim() !== '') {
                      const updatedPages = [...pages]
                      updatedPages[idx] = { ...page, title: newTitle.trim() }
                      // Remove last element from fieldPath as it contains this field's index
                      const parentPath = fieldPath.slice(0, -1)
                      onUpdateField(pageIndex, sectionIndex, fieldIndex, { pages: updatedPages }, parentPath)
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit tab title"
                >
                  <FiSettings size={14} />
                </button>
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete tab "${page.title || `Tab ${idx + 1}`}"?`)) {
                        const updatedPages = pages.filter((_, i) => i !== idx)
                        // If deleting the active tab, switch to the previous tab or tab 0
                        if (activeTab === idx) {
                          setActiveTab(Math.max(0, idx - 1))
                        } else if (activeTab > idx) {
                          setActiveTab(activeTab - 1)
                        }
                        // Remove last element from fieldPath as it contains this field's index
                        const parentPath = fieldPath.slice(0, -1)
                        onUpdateField(pageIndex, sectionIndex, fieldIndex, { pages: updatedPages }, parentPath)
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete tab"
                  >
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const newTab = {
                id: uuidv4(),
                title: `Tab ${pages.length + 1}`,
                sections: [{
                  id: uuidv4(),
                  title: 'New Section',
                  description: '',
                  fields: []
                }]
              }
              const updatedPages = [...pages, newTab]
              // Remove last element from fieldPath as it contains this field's index
              const parentPath = fieldPath.slice(0, -1)
              onUpdateField(pageIndex, sectionIndex, fieldIndex, { pages: updatedPages }, parentPath)
              setPendingTabSwitch(pages.length) // Mark tab switch as pending
            }}
            className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex items-center gap-1 whitespace-nowrap"
            title="Add new tab"
          >
            <FiPlus size={14} />
            Add Tab
          </button>
        </div>
      )}

      {/* Active Tab Content */}
      {!isCollapsed && pages.length > 0 && (
        <div className="mt-3 space-y-4">
          {/* Sections in the active tab */}
          {currentPage?.sections && currentPage.sections.length > 0 ? (
            currentPage.sections.map((section, secIdx) => {
              if (!section) return null
              const isCollapsed = collapsedSections[`${activeTab}-${secIdx}`]
              return (
                <Card key={section.id || secIdx} className="border-2 border-gray-200 dark:border-gray-700" padding={true}>
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setCollapsedSections(prev => ({
                        ...prev,
                        [`${activeTab}-${secIdx}`]: !prev[`${activeTab}-${secIdx}`]
                      }))}
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
                        {section.title || `Section ${secIdx + 1}`}
                      </h2>
                      {section.description && !isCollapsed && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onDeleteSection(pageIndex, sectionIndex, fieldIndex, fieldPath, activeTab, secIdx)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Delete Section"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Section Content */}
                  {!isCollapsed && (
                    <>
                      {/* Render section fields using RecursiveSectionContent */}
                      <RecursiveSectionContent
                        section={section}
                        pageIndex={pageIndex}
                        sectionIndex={sectionIndex}
                        fieldPath={[...fieldPath, 'pages', activeTab, 'sections', secIdx]}
                        isDesktop={isDesktop}
                        renderFieldPreview={renderFieldPreview}
                        onStartAddingField={onStartAddingField}
                        onOpenFieldConfig={onOpenFieldConfig}
                        onDeleteField={onDeleteField}
                        onDuplicateField={onDuplicateField}
                        onResizeField={onResizeField}
                        onUpdateField={onUpdateField}
                        activeId={activeId}
                        dragPreview={dragPreview}
                        setDragPreview={setDragPreview}
                        onAddSectionToNestedTab={onAddSection}
                        onDeleteSectionFromNestedTab={onDeleteSection}
                      />
                    </>
                  )}
                </Card>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No sections in this tab yet
            </div>
          )}

          {/* Add Section Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => onAddSection(pageIndex, sectionIndex, fieldIndex, fieldPath, activeTab)}
            className="mt-2"
          >
            <FiPlus className="mr-1" /> Add Section
          </Button>
        </div>
      )}

      {/* Action buttons - bottom left */}
      <div className="absolute bottom-2 left-2 opacity-0 transition-opacity flex gap-1 z-10 section-actions">
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <FiMove className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenFieldConfig(pageIndex, sectionIndex, fieldIndex, fieldPath)}
          className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          title="Configure"
        >
          <FiSettings className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => onDuplicateField(pageIndex, sectionIndex, fieldPath)}
          className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          title="Duplicate Tabs"
        >
          <FiCopy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteField(pageIndex, sectionIndex, fieldIndex, fieldPath)}
          className="p-1.5 bg-white dark:bg-gray-800 shadow-md rounded border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete"
        >
          <FiTrash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </Card>
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
/**
 * Helper function to get responsive column span classes for FormBuilder
 */
// Note: On mobile, we use w-full instead of responsive grid classes
// Desktop uses absolute positioning, so no responsive classes needed

/**
 * Helper function to get grid column style for FormBuilder
 * Uses desktop value for absolute positioning
 */
const getGridColumnStyleForBuilder = (columnSpan, gridColumn = 1) => {
  const span = typeof columnSpan === 'object' ? (columnSpan.desktop || 4) : (columnSpan || 4)
  return `${gridColumn} / span ${span}`
}

const FormBuilder = ({ form = null, initialData = null, onSave, onCancel }) => {
  const formToEdit = form || initialData
  const [isDesktop, setIsDesktop] = useState(false)

  // Detect desktop screen size
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])
  
  const createFirstPage = (pageTitle = '', pageDescription = '') => ({
    id: uuidv4(),
    title: 'Tab 1',
    sections: []
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
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false) // Mobile right sidebar state
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

  // Using shared migrateFieldsToGrid from gridLayoutUtils
  // import { migrateFieldsToGrid } from '@/lib/gridLayoutUtils'

  useEffect(() => {
    console.log('FormBuilder received form data:', formToEdit)
    if (formToEdit) {
      // Convert old structure to new if needed
      if (formToEdit.sections && !formToEdit.pages) {
        // Old structure - convert to new
        const pages = formToEdit.settings?.multiPage
          ? (formToEdit.sections || []).filter(s => s).map((section, index) => ({
              id: section.id || uuidv4(),
              title: `Page ${index + 1}`,
              sections: [section]
            }))
          : [{
              id: uuidv4(),
              title: 'Tab 1',
              sections: (formToEdit.sections || []).filter(s => s)
            }]
        
        setFormData({
          title: formToEdit.title || '',
          description: formToEdit.description || '',
          pages: migrateFieldsToGrid(pages.length > 0 ? pages : [{ id: uuidv4(), title: 'Tab 1', sections: [] }]),
          published: formToEdit.published || false,
          settings: formToEdit.settings || {
            multiPage: false
          }
        })
      } else {
        // New structure
        const pages = formToEdit.pages || [{ id: uuidv4(), title: 'Tab 1', sections: [] }]
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
    } else {
      // New form
      setFormData({
        title: '',
        description: '',
        pages: [{ id: uuidv4(), title: 'Tab 1', sections: [] }],
        published: false,
        settings: {
          multiPage: false
        }
      })
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
      fields: [],
      type: 'regular' // All sections start as regular, can be converted to repeater
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
    const section = formData.pages?.[pageIndex]?.sections?.[sectionIndex]
    if (!section) return
    
    if (!confirm(`Delete section "${section.title}" and all its fields?`)) return
    
    const updatedPages = [...formData.pages]
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      sections: (updatedPages[pageIndex].sections || []).filter((_, i) => i !== sectionIndex)
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  // Add section to a nested tab
  const handleAddSectionToNestedTab = (pageIndex, sectionIndex, fieldIndex, fieldPath, tabIndex) => {
    const newSection = {
      id: uuidv4(),
      title: 'New Section',
      description: '',
      fields: [],
      type: 'regular'
    }

    const updatedPages = [...formData.pages]
    
    // Navigate to the nested tab field (handles mixed paths)
    let container = updatedPages[pageIndex].sections[sectionIndex]
    let currentFields = container.fields || []
    
    for (let i = 0; i < fieldPath.length; i++) {
      const pathElement = fieldPath[i]
      
      if (typeof pathElement === 'string') {
        // String keys like 'pages' or 'sections'
        container = container[pathElement]
        if (Array.isArray(container)) {
          currentFields = container
        }
      } else {
        // Numeric index
        container = currentFields[pathElement]
        if (container?.fields) {
          currentFields = container.fields
        } else if (container?.pages) {
          currentFields = container.pages
        } else if (container?.sections) {
          currentFields = container.sections
        }
      }
    }
    
    // Add section to the specific tab within the nested tabs
    if (!container.pages[tabIndex].sections) {
      container.pages[tabIndex].sections = []
    }
    container.pages[tabIndex].sections.push(newSection)
    
    setFormData({ ...formData, pages: updatedPages })
  }

  // Delete section from a nested tab
  const handleDeleteSectionFromNestedTab = (pageIndex, sectionIndex, fieldIndex, fieldPath, tabIndex, secIdx) => {
    const updatedPages = [...formData.pages]
    
    // Navigate to the nested tab field (handles mixed paths)
    let container = updatedPages[pageIndex].sections[sectionIndex]
    let currentFields = container.fields || []
    
    for (let i = 0; i < fieldPath.length; i++) {
      const pathElement = fieldPath[i]
      
      if (typeof pathElement === 'string') {
        // String keys like 'pages' or 'sections'
        container = container[pathElement]
        if (Array.isArray(container)) {
          currentFields = container
        }
      } else {
        // Numeric index
        container = currentFields[pathElement]
        if (container?.fields) {
          currentFields = container.fields
        } else if (container?.pages) {
          currentFields = container.pages
        } else if (container?.sections) {
          currentFields = container.sections
        }
      }
    }
    
    const section = container.pages[tabIndex].sections[secIdx]
    if (!confirm(`Delete section "${section.title}" and all its fields?`)) return
    
    // Remove the section
    container.pages[tabIndex].sections = container.pages[tabIndex].sections.filter((_, i) => i !== secIdx)
    
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
  const handleAddField = (pageIndex, sectionIndex, fieldType = 'text', fieldPath = []) => {
    // Navigate to the target container using fieldPath
    const section = formData.pages?.[pageIndex]?.sections?.[sectionIndex]
    if (!section) return
    
    let targetContainer = section
    let targetFields = section.fields || []
    
    // Navigate through nested structure using fieldPath
    // fieldPath can contain numeric indices for fields and strings for nested structures
    // e.g., [fieldIndex, 'pages', tabIndex, 'sections', sectionIndex]
    for (let i = 0; i < fieldPath.length; i++) {
      const pathElement = fieldPath[i]
      
      if (typeof pathElement === 'string') {
        // String keys like 'pages' or 'sections'
        targetContainer = targetContainer[pathElement]
        // If we just navigated to an array (pages/sections), set it as targetFields
        // so the next numeric index can use it
        if (Array.isArray(targetContainer)) {
          targetFields = targetContainer
        }
      } else {
        // Numeric index - navigate into the current array
        if (Array.isArray(targetFields)) {
          targetContainer = targetFields[pathElement]
        } else {
          // Shouldn't happen, but fallback to fields array
          targetContainer = targetFields[pathElement]
        }
        // After navigating to an indexed item, check what kind of item it is
        // Tab fields have 'pages', sections have 'fields', pages have 'sections'
        if (targetContainer?.fields) {
          targetFields = targetContainer.fields
        } else if (targetContainer?.pages) {
          targetFields = targetContainer.pages
        } else if (targetContainer?.sections) {
          targetFields = targetContainer.sections
        } else {
          targetFields = []
        }
      }
    }
    
    // Final step: determine the actual target fields array where we'll add the new field
    // The target container should now be at the right location
    if (targetContainer?.fields) {
      targetFields = targetContainer.fields
    } else {
      targetFields = []
    }
    
    // Calculate next available position using shared utility
    const { row: nextRow, col: nextCol } = getNextGridPosition(targetFields, fieldType)
    
    const newField = {
      id: uuidv4(),
      name: `field_${Date.now()}`,
      label: fieldType === 'text' ? 'Text Field'
        : fieldType === 'email' ? 'Email Address'
        : fieldType === 'number' ? 'Number'
        : fieldType === 'date' ? 'Date'
        : fieldType === 'textarea' ? 'Description'
        : fieldType === 'select' ? 'Select Option'
        : fieldType === 'checkbox' ? 'Checkbox'
        : fieldType === 'checkbox_group' ? 'Checkbox Group'
        : fieldType === 'radio_group' ? 'Radio Group'
        : fieldType === 'toggle' ? 'Toggle Switch'
        : fieldType === 'section' ? 'Nested Section'
        : fieldType === 'tab' ? 'Nested Tabs'
        : 'Field',
      type: fieldType,
      required: false,
      placeholder: 'Enter value...',
      hint: '',
      options: (fieldType === 'select' || fieldType === 'checkbox_group' || fieldType === 'radio_group') ? ['Option 1', 'Option 2'] : undefined,
      // Section-specific properties
      title: fieldType === 'section' ? 'Nested Section' : undefined,
      description: fieldType === 'section' ? '' : undefined,
      fields: fieldType === 'section' ? [] : undefined,
      sectionType: fieldType === 'section' ? 'regular' : undefined,
      // Tab-specific properties
      pages: fieldType === 'tab' ? [{
        id: uuidv4(),
        title: 'Tab 1',
        sections: [{
          id: uuidv4(),
          title: 'New Section',
          description: '',
          fields: []
        }]
      }] : undefined,
      columnSpan: (fieldType === 'section' || fieldType === 'tab')
        ? { mobile: 12, tablet: 12, desktop: 12 } // Full width for sections and tabs
        : { mobile: 12, tablet: 6, desktop: 4 }, // Responsive for regular fields
      gridRow: nextRow, // Explicit row position
      gridColumn: nextCol, // Explicit column start (1-12)
      validation: {}
    }
    
    // Helper function to update nested structure with mixed path (numbers and strings)
    const updateNestedStructure = (container, path, newFieldsArray) => {
      if (path.length === 0) {
        return { ...container, fields: newFieldsArray }
      }
      
      const [currentElement, ...restPath] = path
      
      if (typeof currentElement === 'string') {
        // String key like 'pages' or 'sections'
        const nextElement = restPath[0] // Should be a numeric index
        if (typeof nextElement === 'number') {
          const [index, ...remainingPath] = restPath
          const updatedArray = [...container[currentElement]]
          updatedArray[index] = updateNestedStructure(updatedArray[index], remainingPath, newFieldsArray)
          return { ...container, [currentElement]: updatedArray }
        }
      } else {
        // Numeric index - navigate into fields array
        const updatedFields = [...(container.fields || [])]
        updatedFields[currentElement] = updateNestedStructure(updatedFields[currentElement], restPath, newFieldsArray)
        return { ...container, fields: updatedFields }
      }
      
      return container
    }
    
    const updatedPages = [...formData.pages]
    const updatedSection = updateNestedStructure(
      section,
      fieldPath,
      [...targetFields, newField]
    )
    
    updatedPages[pageIndex].sections[sectionIndex] = updatedSection
    
    setFormData({ ...formData, pages: updatedPages })
    
    // Keep selector open for adding multiple fields - user can close it manually or add more fields
  }
  
  const handleStartAddingField = (pageIndex, sectionIndex, fieldPath = []) => {
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
    
    setAddingFieldTo({ pageIndex, sectionIndex, fieldPath })
  }
  
  const handleCancelAddingField = () => {
    setAddingFieldTo(null)
  }

  const handleUpdateField = (pageIndex, sectionIndex, fieldIndex, updates, fieldPath = []) => {
    const updatedPages = [...formData.pages]
    
    // Navigate to the correct container using fieldPath
    let container = updatedPages[pageIndex].sections[sectionIndex]
    let currentFields = container.fields || []
    
    for (let i = 0; i < fieldPath.length; i++) {
      const pathElement = fieldPath[i]
      
      if (typeof pathElement === 'string') {
        // String keys like 'pages' or 'sections'
        container = container[pathElement]
        if (Array.isArray(container)) {
          currentFields = container
        }
      } else {
        // Numeric index
        container = currentFields[pathElement]
        if (container?.fields) {
          currentFields = container.fields
        } else if (container?.pages) {
          currentFields = container.pages
        } else if (container?.sections) {
          currentFields = container.sections
        }
      }
    }
    
    // Update the field in the current fields array
    if (fieldPath.length === 0) {
      // Top-level field
      updatedPages[pageIndex].sections[sectionIndex].fields = currentFields.map((field, i) =>
        i === fieldIndex ? { ...field, ...updates } : field
      )
    } else {
      // Nested field - update in the container
      container.fields = currentFields.map((field, i) =>
        i === fieldIndex ? { ...field, ...updates } : field
      )
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  // Helper function to resolve cascading collisions
  const resolveCollisionsCascading = (fields, excludeIdx = -1) => {
    // Helper to check if two fields overlap on the same row
    const fieldsOverlap = (field1Row, field1Col, field1Span, field2Row, field2Col, field2Span) => {
      if (field1Row !== field2Row) return false
      
      const field1EndCol = field1Col + field1Span - 1
      const field2EndCol = field2Col + field2Span - 1
      
      return (
        (field2Col >= field1Col && field2Col <= field1EndCol) || // Field2 starts within field1
        (field2EndCol >= field1Col && field2EndCol <= field1EndCol) || // Field2 ends within field1
        (field2Col < field1Col && field2EndCol > field1EndCol) // Field2 completely contains field1
      )
    }
    
    let currentFields = [...fields]
    let hasChanges = true
    let iterations = 0
    const maxIterations = 100 // Prevent infinite loops
    
    while (hasChanges && iterations < maxIterations) {
      hasChanges = false
      iterations++
      
      // Check each field for collisions
      for (let i = 0; i < currentFields.length; i++) {
        if (i === excludeIdx) continue
        
        const currentField = currentFields[i]
        const currentRow = currentField.gridRow || 1
        const currentCol = currentField.gridColumn || 1
        const currentSpan = currentField.columnSpan || 4
        
        // Check against all other fields on the same row
        for (let j = 0; j < currentFields.length; j++) {
          if (i === j || j === excludeIdx) continue
          
          const otherField = currentFields[j]
          const otherRow = otherField.gridRow || 1
          const otherCol = otherField.gridColumn || 1
          const otherSpan = otherField.columnSpan || 4
          
          // Check for overlap
          if (fieldsOverlap(currentRow, currentCol, currentSpan, otherRow, otherCol, otherSpan)) {
            // Collision detected! Shift the field with higher index down
            const fieldToShift = i > j ? i : j
            const shiftedField = currentFields[fieldToShift]
            const shiftedSpan = shiftedField.columnSpan || 4
            const isShiftedFullWidth = shiftedSpan === 12 || shiftedField.type === 'section'
            
            // Move to next row, preserving column unless full-width
            currentFields[fieldToShift] = {
              ...shiftedField,
              gridRow: currentRow + 1,
              gridColumn: isShiftedFullWidth ? 1 : (shiftedField.gridColumn || 1)
            }
            
            hasChanges = true
            break
          }
        }
        
        if (hasChanges) break
      }
    }
    
    return currentFields
  }

  const handleResizeField = (pageIndex, sectionIndex, fieldPathOrIndex, newSpan, edge = 'right', isLive = false) => {
    const updatedPages = [...formData.pages]
    
    // Handle both old API (fieldIndex) and new API (fieldPath)
    let fieldPath = []
    let fieldIndex = 0
    
    if (Array.isArray(fieldPathOrIndex)) {
      // New API: fieldPath is an array
      fieldPath = fieldPathOrIndex
      fieldIndex = fieldPath[fieldPath.length - 1]
      fieldPath = fieldPath.slice(0, -1) // Remove the last element
    } else {
      // Old API: direct fieldIndex
      fieldIndex = fieldPathOrIndex
    }
    
    // Navigate to the correct container using fieldPath (handles mixed paths)
    let container = updatedPages[pageIndex].sections[sectionIndex]
    let currentFields = container.fields || []
    
    for (let i = 0; i < fieldPath.length; i++) {
      const pathElement = fieldPath[i]
      
      if (typeof pathElement === 'string') {
        // String keys like 'pages' or 'sections'
        container = container[pathElement]
        // If we just navigated to an array, set it as currentFields
        if (Array.isArray(container)) {
          currentFields = container
        }
      } else {
        // Numeric index - navigate into the current array
        container = currentFields[pathElement]
        // After navigating, check what the container has
        if (container?.fields) {
          currentFields = container.fields
        } else if (container?.pages) {
          currentFields = container.pages
        } else if (container?.sections) {
          currentFields = container.sections
        } else {
          currentFields = []
        }
      }
    }
    
    // Final step: get the actual fields array we're resizing in
    if (container?.fields) {
      currentFields = container.fields
    } else {
      currentFields = []
    }
    
    const field = currentFields[fieldIndex]
    const fieldRow = field.gridRow || 1
    const fieldCol = field.gridColumn || 1
    const oldSpan = typeof field.columnSpan === 'object' ? (field.columnSpan.desktop || 4) : (field.columnSpan || 4)
    
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
    
    let updatedFields = [...container.fields]
    
    // Update the field's span and column - handle responsive column spans
    const updatedColumnSpan = typeof field.columnSpan === 'object'
      ? { ...field.columnSpan, desktop: adjustedSpan }
      : adjustedSpan

    updatedFields[fieldIndex] = {
      ...field,
      columnSpan: updatedColumnSpan,
      gridColumn: newFieldCol
    }
    
    // If growing and not in live preview mode, check for overlaps and shift fields with cascading
    if (!isLive && adjustedSpan > oldSpan) {
      const newFieldEndCol = newFieldCol + adjustedSpan - 1
      
      // First pass: shift fields directly affected by the resize
      container.fields.forEach((otherField, otherIdx) => {
        if (otherIdx === fieldIndex) return
        
        const otherRow = otherField.gridRow || 1
        const otherCol = otherField.gridColumn || 1
        const otherSpan = otherField.columnSpan || 4
        const otherEndCol = otherCol + otherSpan - 1
        const isOtherFullWidth = otherSpan === 12 || otherField.type === 'section'
        
        // Only check fields on the same row
        if (otherRow === fieldRow) {
          // Full-width fields (nested sections) always get pushed to next row
          if (isOtherFullWidth) {
            updatedFields[otherIdx] = {
              ...otherField,
              gridRow: fieldRow + 1,
              gridColumn: 1
            }
            return
          }
          
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
    
      // Second pass: resolve cascading collisions
      updatedFields = resolveCollisionsCascading(updatedFields, fieldIndex)
    }
    
    // Update the container with the new fields
    container.fields = updatedFields
    
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
    const section = formData.pages?.[pageIndex]?.sections?.[sectionIndex]
    if (!section) return
    
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

  const handleOpenFieldConfig = (pageIndex, sectionIndex, fieldIndex, fieldPath = []) => {
    // Navigate to the correct field using fieldPath
    const page = formData.pages?.[pageIndex]
    const section = page?.sections?.[sectionIndex]
    if (!section) return
    
    let container = section
    let currentFields = container.fields || []
    
    for (let i = 0; i < fieldPath.length; i++) {
      const pathElement = fieldPath[i]
      
      if (typeof pathElement === 'string') {
        // String keys like 'pages' or 'sections'
        container = container[pathElement]
        if (Array.isArray(container)) {
          currentFields = container
        }
      } else {
        // Numeric index
        container = currentFields[pathElement]
        if (container?.fields) {
          currentFields = container.fields
        } else if (container?.pages) {
          currentFields = container.pages
        } else if (container?.sections) {
          currentFields = container.sections
        }
      }
    }
    
    // Get the actual field
    const field = currentFields[fieldIndex]
    
    // Check if already editing the same field
    const isSameConfig = editingConfig && 
                         editingConfig.type === 'field' && 
                         editingConfig.pageIndex === pageIndex && 
                         editingConfig.sectionIndex === sectionIndex && 
                         editingConfig.fieldIndex === fieldIndex &&
                         JSON.stringify(editingConfig.fieldPath || []) === JSON.stringify(fieldPath)
    
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
      fieldPath,
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
        updatedData,
        editingConfig.fieldPath || []
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

  const handleDeleteField = (pageIndex, sectionIndex, fieldIndex, fieldPath = []) => {
    if (!confirm('Delete this field?')) return
    
    const updatedPages = [...formData.pages]
    
    // Navigate to the correct container using fieldPath (handles mixed paths)
    let container = updatedPages[pageIndex].sections[sectionIndex]
    let currentFields = container.fields || []
    
    for (let i = 0; i < fieldPath.length; i++) {
      const pathElement = fieldPath[i]
      
      if (typeof pathElement === 'string') {
        // String keys like 'pages' or 'sections'
        container = container[pathElement]
        // If we just navigated to an array, set it as currentFields
        if (Array.isArray(container)) {
          currentFields = container
        }
      } else {
        // Numeric index - navigate into the current array
        container = currentFields[pathElement]
        // After navigating, check what the container has
        if (container?.fields) {
          currentFields = container.fields
        } else if (container?.pages) {
          currentFields = container.pages
        } else if (container?.sections) {
          currentFields = container.sections
        } else {
          currentFields = []
        }
      }
    }
    
    // Final step: get the actual fields array we're deleting from
    if (container?.fields) {
      currentFields = container.fields
    } else {
      currentFields = []
    }
    
    // Remove the field
    const remainingFields = currentFields.filter((_, i) => i !== fieldIndex)
    
    // Compact rows - remove empty rows and renumber
    const compactedFields = compactGridRows(remainingFields)
    
    // Update the container's fields
    container.fields = compactedFields
    
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
      const pageIdx = Number(activeData[1])
      const sectionIdx = Number(activeData[2])
      const fieldPath = parseFieldPathFromId(activeData.slice(3, -1))
      const fieldIdx = Number(activeData[activeData.length - 1])
      
      // Navigate to field using fieldPath (handles mixed paths)
      let container = formData.pages[pageIdx].sections[sectionIdx]
      let currentFields = container.fields || []
      
      for (let i = 0; i < fieldPath.length; i++) {
        const pathElement = fieldPath[i]
        
        if (typeof pathElement === 'string') {
          // String keys like 'pages' or 'sections'
          container = container[pathElement]
          if (Array.isArray(container)) {
            currentFields = container
          }
        } else {
          // Numeric index
          container = currentFields[pathElement]
          if (container?.fields) {
            currentFields = container.fields
          } else if (container?.pages) {
            currentFields = container.pages
          } else if (container?.sections) {
            currentFields = container.sections
          }
        }
      }
      
      // Get the actual field
      const field = currentFields[fieldIdx]
      
      setDragPreview({
        pageIndex: pageIdx,
        sectionIndex: sectionIdx,
        fieldPath: fieldPath,
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
      const pageIdx = Number(overData[1])
      const sectionIdx = Number(overData[2])
      const fieldPath = parseFieldPathFromId(overData.slice(3, -1))
      const fieldIdx = Number(overData[overData.length - 1])
      
      // Navigate to field using fieldPath (handles mixed paths)
      let container = formData.pages[pageIdx].sections[sectionIdx]
      let currentFields = container.fields || []
      
      for (let i = 0; i < fieldPath.length; i++) {
        const pathElement = fieldPath[i]
        
        if (typeof pathElement === 'string') {
          // String keys like 'pages' or 'sections'
          container = container[pathElement]
          if (Array.isArray(container)) {
            currentFields = container
          }
        } else {
          // Numeric index
          container = currentFields[pathElement]
          if (container?.fields) {
            currentFields = container.fields
          } else if (container?.pages) {
            currentFields = container.pages
          } else if (container?.sections) {
            currentFields = container.sections
          }
        }
      }
      
      // Get the target field
      const targetField = currentFields[fieldIdx]
      
      setDragPreview({
        ...dragPreview,
        pageIndex: pageIdx,
        sectionIndex: sectionIdx,
        fieldPath: fieldPath,
        row: targetField.gridRow || 1,
        col: targetField.gridColumn || 1
      })
    } else if (overData[0] === 'empty') {
      // Hovering over an empty cell
      const pageIdx = Number(overData[1])
      const sectionIdx = Number(overData[2])
      const fieldPath = parseFieldPathFromId(overData.slice(3, -2))
      const row = Number(overData[overData.length - 2])
      const col = Number(overData[overData.length - 1])
      
      setDragPreview({
        ...dragPreview,
        pageIndex: pageIdx,
        sectionIndex: sectionIdx,
        fieldPath: fieldPath,
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

    // Parse drag item IDs 
    // Formats:
    // - Field: "field-pageIdx-sectionIdx-fieldIdx" or "field-pageIdx-sectionIdx-path1-path2-...-fieldIdx"
    // - Section: "section-pageIdx-sectionIdx"
    // - Empty: "empty-pageIdx-sectionIdx-row-col" or "empty-pageIdx-sectionIdx-path1-path2-...-row-col"
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
    // Parse field IDs - format: field-pageIdx-sectionIdx-[fieldPath...]-fieldIdx
    // Extract indices: first 3 are type, pageIdx, sectionIdx; last is fieldIdx; middle are fieldPath
    const activePageIdx = Number(activeData[1])
    const activeSectionIdx = Number(activeData[2])
    const activeFieldPath = parseFieldPathFromId(activeData.slice(3, -1))
    const activeFieldIdx = Number(activeData[activeData.length - 1])
    
    const overPageIdx = Number(overData[1])
    const overSectionIdx = Number(overData[2])
    const overFieldPath = parseFieldPathFromId(overData.slice(3, -1))
    const overFieldIdx = Number(overData[overData.length - 1])

    const updatedPages = [...formData.pages]
    
    // Navigate to the source container using fieldPath (handles mixed paths)
    let sourceContainer = updatedPages[activePageIdx].sections[activeSectionIdx]
    let sourceFields = sourceContainer.fields || []
    
    for (let i = 0; i < activeFieldPath.length; i++) {
      const pathElement = activeFieldPath[i]
      
      if (typeof pathElement === 'string') {
        sourceContainer = sourceContainer[pathElement]
        if (Array.isArray(sourceContainer)) {
          sourceFields = sourceContainer
        }
      } else {
        sourceContainer = sourceFields[pathElement]
        if (sourceContainer?.fields) {
          sourceFields = sourceContainer.fields
        } else if (sourceContainer?.pages) {
          sourceFields = sourceContainer.pages
        } else if (sourceContainer?.sections) {
          sourceFields = sourceContainer.sections
        }
      }
    }
    
    // Final step: ensure sourceFields is the actual fields array
    if (sourceContainer?.fields && activeFieldPath.length > 0) {
      sourceFields = sourceContainer.fields
    }
    
    // Navigate to the target container using fieldPath (handles mixed paths)
    let targetContainer = updatedPages[overPageIdx].sections[overSectionIdx]
    let targetFields = targetContainer.fields || []
    
    for (let i = 0; i < overFieldPath.length; i++) {
      const pathElement = overFieldPath[i]
      
      if (typeof pathElement === 'string') {
        targetContainer = targetContainer[pathElement]
        if (Array.isArray(targetContainer)) {
          targetFields = targetContainer
        }
      } else {
        targetContainer = targetFields[pathElement]
        if (targetContainer?.fields) {
          targetFields = targetContainer.fields
        } else if (targetContainer?.pages) {
          targetFields = targetContainer.pages
        } else if (targetContainer?.sections) {
          targetFields = targetContainer.sections
        }
      }
    }
    
    // Final step: ensure targetFields is the actual fields array
    if (targetContainer?.fields && overFieldPath.length > 0) {
      targetFields = targetContainer.fields
    }

    // Check if moving within same container
    const isSameContainer = activePageIdx === overPageIdx && 
                           activeSectionIdx === overSectionIdx &&
                           JSON.stringify(activeFieldPath) === JSON.stringify(overFieldPath)

    const movingField = { ...sourceFields[activeFieldIdx] }
    const movingFieldSpan = movingField.columnSpan || 4
    const isMovingFieldFullWidth = movingFieldSpan === 12 || movingField.type === 'section'

    if (isSameContainer) {
      // Same container
      const targetField = { ...sourceFields[overFieldIdx] }
    const targetRow = targetField.gridRow || 1
    const targetCol = targetField.gridColumn || 1
      const targetFieldSpan = targetField.columnSpan || 4
      const isTargetFieldFullWidth = targetFieldSpan === 12 || targetField.type === 'section'
      
      if (isMovingFieldFullWidth) {
        // Moving field is full-width - shift all fields on target row down
        movingField.gridRow = targetRow
        movingField.gridColumn = 1
        
        const newFields = sourceFields.map((field, idx) => {
          if (idx === activeFieldIdx) return movingField
          
          const fieldRow = field.gridRow || 1
          const fieldCol = field.gridColumn || 1
          
          // Shift all fields on target row to next row
          if (fieldRow === targetRow && idx !== activeFieldIdx) {
            return { ...field, gridRow: targetRow + 1, gridColumn: fieldCol }
          }
          
          return field
        })
        
        sourceContainer.fields = newFields
      } else if (isTargetFieldFullWidth) {
        // Target is full-width, moving field is regular
        // Place moving field at target row, push target full-width field down
        const movingRow = movingField.gridRow || 1
        
        movingField.gridRow = targetRow
        movingField.gridColumn = 1 // Start at column 1
        
        targetField.gridRow = targetRow + 1
        targetField.gridColumn = 1
        
        const newFields = [...sourceFields]
        newFields[activeFieldIdx] = movingField
        newFields[overFieldIdx] = targetField
        
        sourceContainer.fields = newFields
      } else {
        // Regular swap
        const movingRow = movingField.gridRow || 1
        const movingCol = movingField.gridColumn || 1
    
    // Swap grid positions
    movingField.gridRow = targetRow
    movingField.gridColumn = targetCol
    
    targetField.gridRow = movingRow
    targetField.gridColumn = movingCol
    
        // Swap the fields in the array
        const newFields = [...sourceFields]
      newFields[activeFieldIdx] = movingField
      newFields[overFieldIdx] = targetField
        
        sourceContainer.fields = newFields
      }
    } else {
      // Different containers
      const targetField = { ...targetFields[overFieldIdx] }
      const targetRow = targetField.gridRow || 1
      const targetCol = targetField.gridColumn || 1
      const targetFieldSpan = targetField.columnSpan || 4
      const isTargetFieldFullWidth = targetFieldSpan === 12 || targetField.type === 'section'
      
      if (isMovingFieldFullWidth) {
        // Moving field is full-width - shift all fields on target row down
        movingField.gridRow = targetRow
        movingField.gridColumn = 1
        
        // Remove from source
        sourceContainer.fields = sourceFields.filter((_, i) => i !== activeFieldIdx)
        
        // Update target - shift all fields on target row
        const newTargetFields = targetFields.map((field, idx) => {
          const fieldRow = field.gridRow || 1
          const fieldCol = field.gridColumn || 1
          
          if (fieldRow === targetRow) {
            return { ...field, gridRow: targetRow + 1, gridColumn: fieldCol }
          }
          
          return field
        })
        
        // Add the moving field
        newTargetFields.push(movingField)
        targetContainer.fields = newTargetFields
      } else if (isTargetFieldFullWidth) {
        // Target is full-width, moving field is regular
        const movingRow = movingField.gridRow || 1
        
        movingField.gridRow = targetRow
        movingField.gridColumn = 1 // Start at column 1
        
        targetField.gridRow = targetRow + 1
        targetField.gridColumn = 1
        
        // Remove from source and add target field
        const newSourceFields = [...sourceFields]
        newSourceFields[activeFieldIdx] = targetField
        sourceContainer.fields = newSourceFields
        
        // Replace target field with moving field
        const newTargetFields = [...targetFields]
        newTargetFields[overFieldIdx] = movingField
        targetContainer.fields = newTargetFields
      } else {
        // Regular swap between containers
        const movingRow = movingField.gridRow || 1
        const movingCol = movingField.gridColumn || 1
        
        movingField.gridRow = targetRow
        movingField.gridColumn = targetCol
        
        targetField.gridRow = movingRow
        targetField.gridColumn = movingCol
        
        // Update source container (replace moving field with target field)
        const newSourceFields = [...sourceFields]
        newSourceFields[activeFieldIdx] = targetField
        sourceContainer.fields = newSourceFields
        
        // Update target container (replace target field with moving field)
        const newTargetFields = [...targetFields]
        newTargetFields[overFieldIdx] = movingField
        targetContainer.fields = newTargetFields
      }
    }
    
    setFormData({ ...formData, pages: updatedPages })
  }

  const handleFieldDropOnEmpty = (activeData, overData) => {
    // Parse field IDs - format: field-pageIdx-sectionIdx-[fieldPath...]-fieldIdx
    const activePageIdx = Number(activeData[1])
    const activeSectionIdx = Number(activeData[2])
    const activeFieldPath = parseFieldPathFromId(activeData.slice(3, -1))
    const activeFieldIdx = Number(activeData[activeData.length - 1])
    
    // Parse empty cell IDs - format: empty-pageIdx-sectionIdx-[fieldPath...]-row-col
    const targetPageIdx = Number(overData[1])
    const targetSectionIdx = Number(overData[2])
    const targetFieldPath = parseFieldPathFromId(overData.slice(3, -2))
    const targetRow = Number(overData[overData.length - 2])
    const targetCol = Number(overData[overData.length - 1])

    const updatedPages = [...formData.pages]
    
    // Navigate to the source container using fieldPath (handles mixed paths)
    let sourceContainer = updatedPages[activePageIdx].sections[activeSectionIdx]
    let sourceFields = sourceContainer.fields || []
    
    for (let i = 0; i < activeFieldPath.length; i++) {
      const pathElement = activeFieldPath[i]
      
      if (typeof pathElement === 'string') {
        sourceContainer = sourceContainer[pathElement]
        if (Array.isArray(sourceContainer)) {
          sourceFields = sourceContainer
        }
      } else {
        sourceContainer = sourceFields[pathElement]
        if (sourceContainer?.fields) {
          sourceFields = sourceContainer.fields
        } else if (sourceContainer?.pages) {
          sourceFields = sourceContainer.pages
        } else if (sourceContainer?.sections) {
          sourceFields = sourceContainer.sections
        }
      }
    }
    
    // Final step: ensure sourceFields is the actual fields array
    if (sourceContainer?.fields && activeFieldPath.length > 0) {
      sourceFields = sourceContainer.fields
    }
    
    // Navigate to the target container using fieldPath (handles mixed paths)
    let targetContainer = updatedPages[targetPageIdx].sections[targetSectionIdx]
    let targetFields = targetContainer.fields || []
    
    for (let i = 0; i < targetFieldPath.length; i++) {
      const pathElement = targetFieldPath[i]
      
      if (typeof pathElement === 'string') {
        targetContainer = targetContainer[pathElement]
        if (Array.isArray(targetContainer)) {
          targetFields = targetContainer
        }
      } else {
        targetContainer = targetFields[pathElement]
        if (targetContainer?.fields) {
          targetFields = targetContainer.fields
        } else if (targetContainer?.pages) {
          targetFields = targetContainer.pages
        } else if (targetContainer?.sections) {
          targetFields = targetContainer.sections
        }
      }
    }
    
    // Final step: ensure targetFields is the actual fields array
    if (targetContainer?.fields && targetFieldPath.length > 0) {
      targetFields = targetContainer.fields
    }
    
    // Get the field being moved (create a copy to avoid mutation)
    const movingField = { ...sourceFields[activeFieldIdx] }
    const fieldSpan = movingField.columnSpan || 4
    
    // Check if field can fit at target position (basic check)
    if (targetCol + fieldSpan - 1 > 12) {
      // Field won't fit - don't drop
      console.log('Field won\'t fit at this position - exceeds 12 columns')
      return
    }
    
    // Check if moving within same container
    const isSameContainer = activePageIdx === targetPageIdx && 
                           activeSectionIdx === targetSectionIdx &&
                           JSON.stringify(activeFieldPath) === JSON.stringify(targetFieldPath)
    
    // Get fields to check for collisions (exclude moving field if same container)
    let fieldsToCheck = isSameContainer 
      ? targetFields.filter((_, i) => i !== activeFieldIdx)
      : [...targetFields]
    
    // Check if the moving field is full-width (nested section)
    const isMovingFieldFullWidth = fieldSpan === 12 || movingField.type === 'section'
    
    // Check for collisions and shift fields if needed
    const newFieldEndCol = targetCol + fieldSpan - 1
    
    fieldsToCheck = fieldsToCheck.map(field => {
      const fieldRow = field.gridRow || 1
      const fieldCol = field.gridColumn || 1
      const fieldSpanSize = field.columnSpan || 4
      const fieldEndCol = fieldCol + fieldSpanSize - 1
      const isFieldFullWidth = fieldSpanSize === 12 || field.type === 'section' || field.type === 'tab'
      
      // Check if this field is on the same row and would overlap
      if (fieldRow === targetRow) {
        // If moving field is full-width, ALL fields on target row must be shifted down
        if (isMovingFieldFullWidth) {
          return { ...field, gridRow: targetRow + 1, gridColumn: fieldCol }
        }
        
        // Full-width fields (nested sections) always get pushed to next row
        if (isFieldFullWidth) {
          return { ...field, gridRow: targetRow + 1, gridColumn: 1 }
        }
        
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
    
    if (isSameContainer) {
      // Moving within the same container
      const newFields = [...fieldsToCheck]
      newFields.splice(activeFieldIdx, 0, movingField) // Insert at original index
      // Resolve cascading collisions
      sourceContainer.fields = resolveCollisionsCascading(newFields, activeFieldIdx)
    } else {
      // Moving to a different container
      // Remove from source
      sourceContainer.fields = sourceFields.filter((_, i) => i !== activeFieldIdx)
      // Add to target with shifted fields
      const combinedFields = [...fieldsToCheck, movingField]
      // Resolve cascading collisions (no index to exclude in target)
      targetContainer.fields = resolveCollisionsCascading(combinedFields)
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
    if (!formData || !formData.pages) return
    
    const newStatus = {}
    formData.pages.forEach(page => {
      if (!page || !page.sections) return
      page.sections.forEach(section => {
        if (!section || !section.id) return
        const hasFields = (section.fields || []).length > 0
        const hasRequiredFields = (section.fields || []).some(f => f?.required)
        
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
      
      case 'checkbox_group':
        if (field.orientation === 'question-answer') {
          return (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  {field.label}
                  {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
              <div className="flex-1 mt-1 sm:mt-0 sm:text-right">
                <div className="flex flex-wrap gap-4 sm:justify-end">
                  {(field.options || ['Yes', 'No']).map((opt, i) => {
                    const optLabel = typeof opt === 'object' ? opt.label : opt
                    return (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{optLabel}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        }
        if (field.orientation === 'label-left') {
          return (
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
              <div className="flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  {field.label}
                  {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
              <div className="flex-1 mt-1 sm:mt-0">
                <div className="flex flex-wrap gap-4">
                  {(field.options || ['Yes', 'No']).map((opt, i) => {
                    const optLabel = typeof opt === 'object' ? opt.label : opt
                    return (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{optLabel}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        }
        return (
          <div className={`${
            field.orientation === 'horizontal'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-3 lg:gap-4'
              : 'space-y-2'
          }`}>
            {(field.options || ['Option 1', 'Option 2']).map((opt, i) => {
              const optLabel = typeof opt === 'object' ? opt.label : opt
              return (
                <label key={i} className={`flex items-center gap-2 cursor-pointer ${
                  field.orientation === 'horizontal' ? 'min-w-0' : ''
                }`}>
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{optLabel}</span>
                </label>
              )
            })}
          </div>
        )
      case 'radio_group':
        if (field.orientation === 'question-answer') {
          return (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  {field.label}
                  {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
              <div className="flex-1 mt-1 sm:mt-0 sm:text-right">
                <div className="flex flex-wrap gap-4 sm:justify-end">
                  {(field.options || ['Yes', 'No']).map((opt, i) => {
                    const optLabel = typeof opt === 'object' ? opt.label : opt
                    return (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`preview-${field.name}`}
                          disabled
                          className="border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{optLabel}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        }
        if (field.orientation === 'label-left') {
          return (
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
              <div className="flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  {field.label}
                  {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
              <div className="flex-1 mt-1 sm:mt-0">
                <div className="flex flex-wrap gap-4">
                  {(field.options || ['Yes', 'No']).map((opt, i) => {
                    const optLabel = typeof opt === 'object' ? opt.label : opt
                    return (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`preview-${field.name}`}
                          disabled
                          className="border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{optLabel}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        }
        return (
          <div className={`${
            field.orientation === 'horizontal'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-3 lg:gap-4'
              : 'space-y-2'
          }`}>
            {(field.options || ['Option 1', 'Option 2']).map((opt, i) => {
              const optLabel = typeof opt === 'object' ? opt.label : opt
              return (
                <label key={i} className={`flex items-center gap-2 cursor-pointer ${
                  field.orientation === 'horizontal' ? 'min-w-0' : ''
                }`}>
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
      case 'toggle':
        return (
          <label className="flex items-center gap-3">
            <span className="text-sm text-gray-700 dark:text-gray-300">Off</span>
            <input
              type="checkbox"
              disabled
              className="appearance-none w-11 h-6 bg-gray-200 rounded-full checked:bg-primary-600 transition-colors relative before:absolute before:content-[''] before:block before:w-5 before:h-5 before:bg-white before:rounded-full before:shadow-md before:left-0 checked:before:translate-x-full before:transition-transform"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">On</span>
          </label>
        )

      case 'info':
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
            {field.content || field.placeholder || 'Text will be displayed here'}
          </div>
        )

      case 'section':
        // Nested sections are handled by RecursiveSectionContent - shouldn't reach here
        return <div className="text-gray-500 italic">Nested Section (rendered separately)</div>

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

  const currentPage = formData.pages?.[currentPageIndex] || { id: uuidv4(), title: 'Tab 1', sections: [] }

  return (
    <div className="h-full w-full" data-form-builder="true">
      <style dangerouslySetInnerHTML={{ __html: hoverStyles }} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <form onSubmit={handleSubmit} id="form-builder-form">
            {/* Hidden submit button for external trigger */}
            <button type="submit" id="form-builder-submit" className="hidden" />
            <button type="button" id="form-builder-publish" onClick={handleSaveAndPublish} className="hidden" />

            {/* Page Tabs */}
            <div className="flex-shrink-0 mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 border-b border-gray-200 dark:border-gray-700" style={{ maxWidth: 'calc(100vw - 100px)' }}>
                  <div className="flex flex-nowrap items-end gap-1 sm:gap-2 overflow-x-auto overflow-y-hidden -mb-px pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:dark:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                    {formData.pages.map((page, index) => (
                      <div
                        key={page.id}
                        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b-2 transition-colors flex-shrink-0 min-w-fit ${
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
                          className={`text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-w-[60px] ${
                            currentPageIndex === index
                              ? 'text-primary-600'
                              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                          style={{ minWidth: '60px' }}
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
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete page"
                          >
                            <FiX className="w-3 h-3" />
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

            {/* Current Page Content - Scrollable */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
              {currentPage && (
                <Card className="mb-4">
                  {/* Sections with Drag & Drop */}
                  <SortableContext
                    items={(currentPage.sections || []).filter(s => s).map((s, i) => `section-${currentPageIndex}-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                  {(currentPage.sections || []).filter(s => s).map((section, sectionIndex) => {
                    if (!section || !section.id) return null
                    return (
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
                      {/* Fields - Using Recursive Render */}
                      {section.type === 'repeater' && (
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 text-[10px] font-bold">
                            R
                          </span>
                          Repeatable group preview — this section will repeat as a set when users add new items.
                        </div>
                      )}
                      
                      <RecursiveSectionContent
                        section={section}
                                        pageIndex={currentPageIndex}
                                        sectionIndex={sectionIndex}
                        fieldPath={[]}
                        isDesktop={isDesktop}
                                        renderFieldPreview={renderFieldPreview}
                        onStartAddingField={handleStartAddingField}
                        onOpenFieldConfig={handleOpenFieldConfig}
                        onDeleteField={handleDeleteField}
                        onDuplicateField={handleDuplicateField}
                        onResizeField={handleResizeField}
                        onUpdateField={handleUpdateField}
                        activeId={activeId}
                        dragPreview={dragPreview}
                        setDragPreview={setDragPreview}
                        onAddSectionToNestedTab={handleAddSectionToNestedTab}
                        onDeleteSectionFromNestedTab={handleDeleteSectionFromNestedTab}
                      />
                    </SortableSection>
                  </div>
                  )
                  })}
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
            </div>
          </form>
      </div>

      {/* Mobile: Floating button to open right sidebar */}
      {currentPage?.sections && currentPage.sections.length > 1 && (
        <button
          onClick={() => setIsRightSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-30 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all"
          aria-label="Show sections"
        >
          <FiMenu className="w-6 h-6" />
        </button>
      )}

      {/* Right Sidebar - Section Navigation */}
      {currentPage?.sections && currentPage.sections.length > 1 && (
        <RightResizableSidebar
          minWidth={200}
          maxWidth={400}
          defaultWidth={256}
          collapsedWidth={48}
          storageKey="formBuilderSectionSidebarWidth"
          className="flex-shrink-0 h-full"
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
        >
          {({ isCollapsed }) => (
            <>
              {!isCollapsed && (
                <div className="h-full p-4 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Sections ({currentPage.sections?.length || 0})
                  </h3>
                  
                  <div className="space-y-2">
                    {(currentPage.sections || []).filter(s => s && s.id).map((section, index) => {
                      const sectionId = section.id
                      const status = sectionStatus[sectionId] || 'empty'
                      const isActive = activeSectionId === sectionId
                      
                      return (
                        <button
                          key={sectionId}
                          type="button"
                          onClick={() => {
                            scrollToSection(sectionId)
                            setIsRightSidebarOpen(false) // Close sidebar on mobile after clicking
                          }}
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
          sectionTitle={
            addingFieldTo.fieldPath && addingFieldTo.fieldPath.length > 0
              ? (() => {
                  let container = formData.pages[addingFieldTo.pageIndex]?.sections[addingFieldTo.sectionIndex]
                  for (const pathElement of addingFieldTo.fieldPath) {
                    if (typeof pathElement === 'string') {
                      // String keys like 'pages' or 'sections'
                      container = container?.[pathElement]
                    } else if (typeof pathElement === 'number') {
                      // Numeric index - navigate into fields array
                      container = container?.fields?.[pathElement]
                    }
                  }
                  return container?.title || container?.label || 'Nested Section'
                })()
              : formData.pages[addingFieldTo.pageIndex]?.sections[addingFieldTo.sectionIndex]?.title
          }
          onSelect={(fieldType) => {
            handleAddField(
              addingFieldTo.pageIndex, 
              addingFieldTo.sectionIndex, 
              fieldType,
              addingFieldTo.fieldPath || []
            )
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

