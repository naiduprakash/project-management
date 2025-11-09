'use client'

import Link from 'next/link'
import { FiHome, FiChevronRight } from 'react-icons/fi'

const Breadcrumb = ({ items = [], className = '' }) => {
  if (items.length === 0) return null

  return (
    <nav className={`flex items-center space-x-1 text-xs ${className}`} aria-label="Breadcrumb">
      <Link
        href="/"
        className="flex items-center text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        title="Home"
      >
        <FiHome size={12} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center space-x-1">
            <FiChevronRight className="text-gray-300 dark:text-gray-600" size={10} />
            {isLast || !item.href ? (
              <span className="text-gray-500 dark:text-gray-400 font-normal">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-normal"
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

