'use client'

import { FiCheckCircle, FiAlertCircle, FiCircle } from 'react-icons/fi'

/**
 * Right sidebar navigation for form sections
 * Shows section status and allows quick navigation
 */
const FormSectionNav = ({ pages, currentPageIndex, onSectionClick, sectionStatus = {}, activeSectionId }) => {
  const currentPage = pages[currentPageIndex]
  
  if (!currentPage) return null

  const getStatusIcon = (sectionId) => {
    const status = sectionStatus[sectionId] || 'empty'
    
    switch (status) {
      case 'valid':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <FiAlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <FiCircle className="w-4 h-4 text-gray-300" />
    }
  }

  const getStatusColor = (sectionId) => {
    const status = sectionStatus[sectionId] || 'empty'
    const isActive = activeSectionId === sectionId
    
    if (isActive) {
      return 'border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-200'
    }
    
    switch (status) {
      case 'valid':
        return 'border-green-200 bg-green-50 hover:bg-green-100'
      case 'error':
        return 'border-red-200 bg-red-50 hover:bg-red-100'
      default:
        return 'border-gray-200 bg-white hover:bg-gray-50'
    }
  }

  return (
    <div className="sticky top-24 h-fit">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Sections ({currentPage.sections?.length || 0})
        </h3>
        
        <div className="space-y-2">
          {currentPage.sections?.map((section, index) => {
            const isActive = activeSectionId === section.id
            return (
              <button
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition-all ${getStatusColor(section.id)}`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getStatusIcon(section.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isActive ? 'text-primary-900' : 'text-gray-900'
                    }`}>
                      {section.title}
                      {isActive && (
                        <span className="ml-2 text-xs text-primary-600">● Viewing</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {section.fields?.length || 0} fields
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <FiCheckCircle className="w-3 h-3 text-green-500" />
              <span>Filled</span>
            </div>
            <div className="flex items-center gap-1">
              <FiCircle className="w-3 h-3 text-gray-300" />
              <span>Empty</span>
            </div>
            <div className="flex items-center gap-1">
              <FiAlertCircle className="w-3 h-3 text-red-500" />
              <span>Errors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormSectionNav

