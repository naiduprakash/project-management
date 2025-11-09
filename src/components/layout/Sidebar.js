'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiFileText, FiMoreVertical, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import api from '@/lib/api'

const MIN_WIDTH = 200
const MAX_WIDTH = 500
const DEFAULT_WIDTH = 256 // 64 * 4 = w-64
const COLLAPSED_WIDTH = 64

const Sidebar = () => {
  const pathname = usePathname()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showResizeHandle, setShowResizeHandle] = useState(false)
  const sidebarRef = useRef(null)
  const lastWidthRef = useRef(DEFAULT_WIDTH) // Store last width before collapse

  useEffect(() => {
    loadPages()
    
    // Load saved width from localStorage
    const savedWidth = localStorage.getItem('sidebarWidth')
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10))
    }
  }, [])

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return

      const newWidth = e.clientX
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth)
        localStorage.setItem('sidebarWidth', newWidth.toString())
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleResizeStart = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleToggleCollapse = (e) => {
    e.stopPropagation()
    if (isCollapsed) {
      // Expand: restore previous width
      setSidebarWidth(lastWidthRef.current)
      setIsCollapsed(false)
    } else {
      // Collapse: save current width and collapse
      lastWidthRef.current = sidebarWidth
      setSidebarWidth(COLLAPSED_WIDTH)
      setIsCollapsed(true)
    }
  }

  const loadPages = async () => {
    try {
      const response = await api.get('/pages')
      // Filter only published pages
      const publishedPages = response.data.filter(page => page.isPublished)
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
      <aside 
        className="bg-white border-r border-gray-200 transition-all duration-300"
        style={{ width: isCollapsed ? `${COLLAPSED_WIDTH}px` : `${sidebarWidth}px` }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside 
      ref={sidebarRef}
      className="bg-white border-r border-gray-200 flex flex-col relative"
      style={{ 
        width: isCollapsed ? `${COLLAPSED_WIDTH}px` : `${sidebarWidth}px`,
        transition: isResizing ? 'none' : 'width 0.3s ease'
      }}
      onMouseEnter={() => !isCollapsed && setShowResizeHandle(true)}
      onMouseLeave={() => !isResizing && setShowResizeHandle(false)}
    >

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        {pages.length === 0 ? (
          <div className={`text-center ${isCollapsed ? 'px-2' : 'px-4'} py-8`}>
            {!isCollapsed && (
              <p className="text-sm text-gray-500">
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
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                  }`}
                  title={isCollapsed ? page.title : ''}
                >
                  <FiFileText size={18} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate">{page.title}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && pages.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'} available
          </p>
        </div>
      )}

      {/* Resize/Collapse Handle */}
      <div
        className={`absolute top-0 right-0 h-full transition-all duration-300 ${
          isCollapsed 
            ? 'w-1 cursor-pointer' 
            : `w-1 cursor-col-resize ${
                showResizeHandle || isResizing
                  ? 'bg-gray-300 opacity-60'
                  : 'bg-transparent opacity-0'
              }`
        }`}
        onMouseDown={(e) => {
          if (!isCollapsed) {
            handleResizeStart(e)
          }
        }}
        style={{ zIndex: 50 }}
      >
        {/* Drag/Toggle Icon */}
        <div
          className={`absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
            isCollapsed || showResizeHandle || isResizing ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className="bg-gray-400 rounded-full p-1 shadow-sm hover:bg-gray-500 hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleCollapse(e)
            }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <FiChevronRight className="text-white" size={12} />
            ) : (
              <FiChevronLeft className="text-white" size={12} />
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

