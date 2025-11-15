'use client'

import { useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { cn } from '@/lib/utils'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl sm:max-w-xl',
    lg: 'max-w-4xl sm:max-w-2xl',
    xl: 'max-w-6xl sm:max-w-4xl',
    full: 'max-w-full mx-4 sm:mx-auto'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full animate-slide-in max-h-[90vh] overflow-y-auto',
        sizes[size]
      )}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-4 p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX className="text-xl sm:text-2xl" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal

