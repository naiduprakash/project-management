'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiFileText } from 'react-icons/fi'
import api from '@/lib/api'
import ResizableSidebar from '@/components/common/ResizableSidebar'

const Sidebar = () => {
  const pathname = usePathname()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      const response = await api.get('/pages')
      // Filter only published pages (check both isPublished and published for backward compatibility)
      const publishedPages = response.data.filter(page => page.isPublished || page.published)
      setPages(publishedPages)
    } catch (err) {
      console.error('Failed to load pages:', err)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (pageSlug) => {
    return pathname.startsWith(`/pages/${pageSlug}`)
  }

  if (loading) {
    return (
      <ResizableSidebar storageKey="mainSidebarWidth">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </ResizableSidebar>
    )
  }

  return (
    <ResizableSidebar storageKey="mainSidebarWidth">
      {({ isCollapsed }) => (
        <>
          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-2">
            {pages.length === 0 ? (
              <div className={`text-center ${isCollapsed ? 'px-2' : 'px-4'} py-8`}>
                {!isCollapsed && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No pages available yet.
                  </p>
                )}
              </div>
            ) : (
              <ul className="space-y-1">
                {pages.map((page) => (
                  <li key={page.id}>
                    <Link
                      href={`/pages/${page.slug}`}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                        isActive(page.slug)
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                      title={isCollapsed ? page.title : ''}
                    >
                      <FiFileText size={18} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate text-sm">{page.title}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </nav>

          {/* Sidebar Footer */}
          {!isCollapsed && pages.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {pages.length} {pages.length === 1 ? 'page' : 'pages'} available
              </p>
            </div>
          )}
        </>
      )}
    </ResizableSidebar>
  )
}

export default Sidebar
