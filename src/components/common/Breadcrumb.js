'use client'

import Link from 'next/link'
import { FiHome, FiChevronRight } from 'react-icons/fi'

const Breadcrumb = ({ items = [] }) => {
  if (items.length === 0) return null

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link
        href="/"
        className="flex items-center text-gray-500 hover:text-primary-600 transition-colors"
        title="Home"
      >
        <FiHome size={16} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center space-x-2">
            <FiChevronRight className="text-gray-400" size={14} />
            {isLast || !item.href ? (
              <span className="text-gray-900 font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-primary-600 transition-colors"
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

