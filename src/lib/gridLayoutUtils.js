/**
 * Grid Layout Utilities
 * Shared logic for responsive grid positioning between FormBuilder and DynamicFormRenderer
 * Ensures consistent 12-column grid layout with responsive column spans
 */

/**
 * Get responsive Tailwind column span classes
 * Supports both old format (number) and new format (object with mobile/tablet/desktop)
 * @param {number|object} columnSpan - Column span configuration
 * @returns {string} Tailwind responsive classes
 */
export const getResponsiveColSpan = (columnSpan) => {
  // Default values for responsive behavior
  if (typeof columnSpan === 'number' || !columnSpan) {
    // Backward compatibility: use same span for all sizes
    const span = columnSpan || 12
    return `col-span-${span}`
  }

  // New format: { mobile: 12, tablet: 6, desktop: 4 }
  const mobile = columnSpan.mobile || 12
  const tablet = columnSpan.tablet || 6
  const desktop = columnSpan.desktop || 4

  // Use Tailwind responsive classes for responsive layout
  // Base (mobile): col-span-X
  // md (>= 768px, tablet): md:col-span-X
  // lg (>= 1024px, desktop and up): lg:col-span-X
  return `col-span-${mobile} md:col-span-${tablet} lg:col-span-${desktop}`
}

/**
 * Get grid column CSS style for absolute positioning
 * Used for non-responsive column spans to render at explicit grid positions
 * @param {number|object} columnSpan - Column span configuration
 * @param {number} gridColumn - Starting grid column (1-12)
 * @returns {string|undefined} CSS grid style value or undefined
 */
export const getGridColumnStyle = (columnSpan, gridColumn = 1) => {
  // If responsive column span is used, don't use inline styles
  // The responsive Tailwind classes will handle the layout
  if (typeof columnSpan === 'object') {
    return undefined // Let the responsive classes handle it
  }

  // For backward compatibility with numeric columnSpan
  const span = columnSpan || 12
  return `${gridColumn} / span ${span}`
}

/**
 * Calculate grid positioning for fields in a section
 * Arranges fields in a 12-column grid, wrapping to next row when full
 * @param {array} fields - Array of fields to position
 * @returns {array} Fields with calculated gridRow and gridColumn
 */
export const calculateGridPositions = (fields) => {
  if (!fields || !Array.isArray(fields)) return []
  
  return fields.map((field, idx) => {
    if (!field) return field
    
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
      const prevField = fields[i]
      if (!prevField) continue
      
      const prevSpan = typeof prevField.columnSpan === 'object'
        ? (prevField.columnSpan.desktop || 4)
        : (prevField.columnSpan || 4)

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
}

/**
 * Get CSS grid template style for desktop view
 * Calculates total rows needed for all fields
 * @param {array} fields - Array of fields with gridRow and gridColumn
 * @returns {object} CSS style object for grid container
 */
export const getGridContainerStyle = (fields) => {
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return { display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '0.75rem' }
  }

  const maxRow = fields.reduce((max, field) => {
    if (!field) return max
    return Math.max(max, field.gridRow || 1)
  }, 0) || 1

  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
    gridAutoRows: 'min-content',
    gap: '0.75rem',
    // Optionally set height based on rows
    // minHeight: `calc(${maxRow} * auto)`
  }
}

/**
 * Migrate fields to explicit grid positioning
 * Converts old structure to new structure with explicit grid rows/columns
 * @param {array} pages - Array of pages with sections
 * @returns {array} Pages with migrated field grid positioning
 */
export const migrateFieldsToGrid = (pages) => {
  return (pages || []).map(page => ({
    ...page,
    sections: (page?.sections || []).map(section => {
      if (!section) return section
      return {
        ...section,
        fields: calculateGridPositions(section.fields || [])
      }
    })
  }))
}

/**
 * Sort fields by grid position for consistent ordering
 * Used for rendering fields in mobile view or ensuring proper visual order
 * @param {array} fields - Array of fields to sort
 * @returns {array} Sorted fields by gridRow then gridColumn
 */
export const sortFieldsByGridPosition = (fields) => {
  if (!fields || !Array.isArray(fields)) return []
  return [...fields].sort((a, b) => {
    if (!a || !b) return 0
    const aRow = a.gridRow || 1
    const bRow = b.gridRow || 1
    const aCol = a.gridColumn || 1
    const bCol = b.gridColumn || 1

    if (aRow !== bRow) return aRow - bRow
    return aCol - bCol
  })
}

/**
 * Get next available grid position for a new field
 * Finds the last occupied position and calculates next available spot
 * @param {array} fields - Array of existing fields
 * @param {string} fieldType - Type of field being added
 * @returns {object} {row, col} for the new field's position
 */
export const getNextGridPosition = (fields, fieldType = 'text') => {
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return { row: 1, col: 1 }
  }

  // Find the last field
  const lastField = fields[fields.length - 1]
  if (!lastField) {
    return { row: 1, col: 1 }
  }

  const lastRow = lastField.gridRow || 1
  const lastCol = lastField.gridColumn || 1
  const lastSpan = typeof lastField.columnSpan === 'object'
    ? (lastField.columnSpan.desktop || 4)
    : (lastField.columnSpan || 4)

  // Nested sections and tabs always start on a new row at column 1
  if (fieldType === 'section' || fieldType === 'tab') {
    return { row: lastRow + 1, col: 1 }
  }

  // Try to place in same row if space available
  const nextCol = lastCol + lastSpan
  if (nextCol + 3 <= 12) {
    // Assuming default field span is 4
    return { row: lastRow, col: nextCol }
  }

  // Move to next row
  return { row: lastRow + 1, col: 1 }
}

/**
 * Validate grid positioning for fields
 * Checks for overlaps and invalid positions
 * @param {array} fields - Array of fields to validate
 * @returns {object} Validation result {isValid, errors}
 */
export const validateGridPositions = (fields) => {
  const errors = []
  const occupied = new Set()

  if (!fields || !Array.isArray(fields)) {
    return { isValid: true, errors: [] }
  }

  fields.forEach((field, idx) => {
    if (!field) return
    
    const row = field.gridRow || 1
    const col = field.gridColumn || 1
    const span = typeof field.columnSpan === 'object'
      ? (field.columnSpan.desktop || 4)
      : (field.columnSpan || 4)

    // Check if column exceeds grid width
    if (col < 1 || col > 12) {
      errors.push(`Field ${idx} has invalid column: ${col}`)
    }

    if (col + span - 1 > 12) {
      errors.push(`Field ${idx} exceeds grid width: column ${col} + span ${span}`)
    }

    // Check for overlaps (simplified check)
    for (let c = col; c < col + span; c++) {
      const key = `${row}-${c}`
      if (occupied.has(key)) {
        errors.push(`Field ${idx} overlaps with another field`)
      }
      occupied.add(key)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

export default {
  getResponsiveColSpan,
  getGridColumnStyle,
  calculateGridPositions,
  getGridContainerStyle,
  migrateFieldsToGrid,
  sortFieldsByGridPosition,
  getNextGridPosition,
  validateGridPositions
}
