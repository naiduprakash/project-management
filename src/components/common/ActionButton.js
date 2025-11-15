'use client'

import Button from './Button'

/**
 * ActionButton - Responsive action button with configurable text display
 * 
 * Usage - Table Actions (with abbreviations on mobile):
 * <ActionButton
 *   fullText="Edit Details"
 *   shortText="Edit"
 *   icon={<FiEdit2 />}
 *   showFullTextAlways={false}
 *   onClick={handleEdit}
 *   variant="ghost"
 * />
 * 
 * Usage - Header Actions (always full text):
 * <ActionButton
 *   fullText="Save & Publish"
 *   icon={<FiSave />}
 *   showFullTextAlways={true}
 *   size="sm"
 *   onClick={handlePublish}
 * />
 */
const ActionButton = ({ 
  fullText, 
  shortText, 
  icon,
  onClick,
  variant = 'ghost',
  size = 'sm',
  disabled = false,
  title,
  className = '',
  showFullTextAlways = true // NEW: Control text display behavior
}) => {
  // If shortText not provided and showFullTextAlways is false, use first word
  const abbrevText = showFullTextAlways ? fullText : (shortText || fullText?.split(' ')[0] || fullText)

  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      title={title || fullText}
      className={`${className} gap-1 sm:gap-2`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      
      {/* Show text based on showFullTextAlways flag */}
      {showFullTextAlways ? (
        // Always show full text
        <span>{fullText}</span>
      ) : (
        // Show abbreviated on mobile, full on sm+
        <>
          <span className="hidden sm:inline">{fullText}</span>
          <span className="sm:hidden inline">{abbrevText}</span>
        </>
      )}
    </Button>
  )
}

export default ActionButton
