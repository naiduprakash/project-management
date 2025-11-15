'use client'

import Link from 'next/link'
import { FiHome, FiChevronRight } from 'react-icons/fi'

const Breadcrumb = ({ items = [], className = '' }) => {
  if (items.length === 0) return null

  return (
    <nav 
      className={`flex items-center space-x-0.5 sm:space-x-1 text-xs sm:text-sm whitespace-nowrap overflow-x-auto pb-1 ${className}`} 
      aria-label="Breadcrumb"
    >
      {/* Home icon */}
      <Link
        href="/"
        className="flex items-center text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex-shrink-0"
        title="Home"
      >
        <FiHome size={14} className="sm:w-4 sm:h-4" />
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center space-x-0.5 sm:space-x-1 flex-shrink-0">
            <FiChevronRight 
              className="text-gray-300 dark:text-gray-600 flex-shrink-0" 
              size={12}
            />
            {isLast || !item.href ? (
              <span className="text-gray-600 dark:text-gray-400 font-medium truncate">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-normal truncate"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default Breadcrumb

