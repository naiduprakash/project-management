'use client'

import Breadcrumb from './Breadcrumb'

/**
 * ContentHeader Component
 * Shows breadcrumb navigation and primary actions at the top of content area
 */
const ContentHeader = ({ breadcrumbItems, actions }) => {
  if (!breadcrumbItems && !actions) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Breadcrumb */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          {breadcrumbItems && breadcrumbItems.length > 0 && (
            <Breadcrumb items={breadcrumbItems} />
          )}
        </div>
        
        {/* Primary Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentHeader

