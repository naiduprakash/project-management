'use client'

import { useState, useEffect, useRef } from 'react'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'

const ResizableSidebar = ({
  children,
  minWidth = 200,
  maxWidth = 500,
  defaultWidth = 256,
  collapsedWidth = 64,
  storageKey = 'sidebarWidth',
  className = '',
  enableCollapse = true,
  isOpen = true,
  onClose = () => {}
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showResizeHandle, setShowResizeHandle] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sidebarRef = useRef(null)
  const lastWidthRef = useRef(defaultWidth)
  const collapsedStateKey = `${storageKey}_collapsed`

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Load saved width and collapsed state from localStorage
    const savedWidth = localStorage.getItem(storageKey)
    if (savedWidth) {
      const width = parseInt(savedWidth, 10)
      setSidebarWidth(width)
      lastWidthRef.current = width
    }

    // Load saved collapsed state
    const savedCollapsedState = localStorage.getItem(collapsedStateKey)
    if (savedCollapsedState !== null) {
      setIsCollapsed(savedCollapsedState === 'true')
    }
  }, [storageKey, collapsedStateKey])

  // Handle mouse move for resizing (desktop only)
  useEffect(() => {
    if (isMobile) return

    const handleMouseMove = (e) => {
      if (!isResizing) return

      const newWidth = e.clientX
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth)
        localStorage.setItem(storageKey, newWidth.toString())
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
  }, [isResizing, minWidth, maxWidth, storageKey, isMobile])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isOpen])

  const handleResizeStart = (e) => {
    if (isMobile) return
    e.preventDefault()
    setIsResizing(true)
  }

  const handleToggleCollapse = (e) => {
    e.stopPropagation()
    if (isCollapsed) {
      // Expand: restore previous width
      setSidebarWidth(lastWidthRef.current)
      setIsCollapsed(false)
      localStorage.setItem(collapsedStateKey, 'false')
    } else {
      // Collapse: save current width and collapse
      lastWidthRef.current = sidebarWidth
      setSidebarWidth(collapsedWidth)
      setIsCollapsed(true)
      localStorage.setItem(collapsedStateKey, 'true')
    }
  }

  // Mobile: Don't render if not open
  if (isMobile && !isOpen) {
    return null
  }

  return (
    <>
      {/* Mobile: Backdrop overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          style={{ transition: 'opacity 0.3s ease' }}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col relative
          ${isMobile ? 'fixed top-0 left-0 h-full z-50 shadow-xl' : ''}
          ${className}`}
        style={{
          width: isMobile ? '280px' : (isCollapsed ? `${collapsedWidth}px` : `${sidebarWidth}px`),
          transition: isResizing ? 'none' : (isMobile ? 'transform 0.3s ease' : 'width 0.3s ease'),
          transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none'
        }}
        onMouseEnter={() => !isCollapsed && !isMobile && setShowResizeHandle(true)}
        onMouseLeave={() => !isResizing && setShowResizeHandle(false)}
      >
        {/* Mobile: Close button */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close sidebar"
            >
              <FiX size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}

        {/* Children with collapsed state */}
        {typeof children === 'function' ? children({ isCollapsed: isMobile ? false : isCollapsed }) : children}

        {/* Desktop: Resize/Collapse Handle */}
        {!isMobile && (
          <div
            className={`absolute top-0 right-0 h-full transition-all duration-300 ${
              isCollapsed
                ? 'w-1 cursor-pointer'
                : `w-1 cursor-col-resize ${
                    showResizeHandle || isResizing
                      ? 'bg-gray-300 dark:bg-gray-600 opacity-60'
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
            {enableCollapse && (
              <div
                className={`absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  isCollapsed || showResizeHandle || isResizing ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div
                  className="bg-gray-400 dark:bg-gray-600 rounded-full p-1 shadow-sm hover:bg-gray-500 hover:shadow-md transition-all duration-200 cursor-pointer"
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
            )}
          </div>
        )}
      </aside>
    </>
  )
}

export default ResizableSidebar

