'use client'

import Breadcrumb from './Breadcrumb'

/**
 * ContentHeader Component
 * Shows breadcrumb navigation and primary actions at the top of content area
 * Fully responsive for mobile, tablet, and desktop
 */
const ContentHeader = ({ breadcrumbItems, actions }) => {
  if (!breadcrumbItems && !actions) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4">
      {/* Mobile: Stacked layout, Desktop: Side-by-side */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Breadcrumb - Always visible, scrollable on mobile */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          {breadcrumbItems && breadcrumbItems.length > 0 && (
            <Breadcrumb items={breadcrumbItems} />
          )}
        </div>
        
        {/* Primary Actions - Full width on mobile, auto on desktop */}
        {actions && (
          <div className="flex items-center gap-2 w-full md:w-auto md:flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentHeader

