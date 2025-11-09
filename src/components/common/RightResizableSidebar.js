'use client'

import { useState, useEffect, useRef } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const RightResizableSidebar = ({
  children,
  minWidth = 200,
  maxWidth = 500,
  defaultWidth = 256,
  collapsedWidth = 64,
  storageKey = 'rightSidebarWidth',
  className = '',
  enableCollapse = true
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showResizeHandle, setShowResizeHandle] = useState(false)
  const sidebarRef = useRef(null)
  const lastWidthRef = useRef(defaultWidth)

  useEffect(() => {
    // Load saved width from localStorage
    const savedWidth = localStorage.getItem(storageKey)
    if (savedWidth) {
      const width = parseInt(savedWidth, 10)
      setSidebarWidth(width)
      lastWidthRef.current = width
    }
  }, [storageKey])

  // Handle mouse move for resizing (from right edge)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !sidebarRef.current) return

      const rect = sidebarRef.current.getBoundingClientRect()
      const newWidth = rect.right - e.clientX
      
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
  }, [isResizing, minWidth, maxWidth, storageKey])

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
      setSidebarWidth(collapsedWidth)
      setIsCollapsed(true)
    }
  }

  return (
    <aside
      ref={sidebarRef}
      className={`bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col relative ${className}`}
      style={{
        width: isCollapsed ? `${collapsedWidth}px` : `${sidebarWidth}px`,
        transition: isResizing ? 'none' : 'width 0.3s ease'
      }}
      onMouseEnter={() => !isCollapsed && setShowResizeHandle(true)}
      onMouseLeave={() => !isResizing && setShowResizeHandle(false)}
    >
      {/* Children with collapsed state */}
      {typeof children === 'function' ? children({ isCollapsed }) : children}

      {/* Resize/Collapse Handle */}
      <div
        className={`absolute top-0 left-0 h-full transition-all duration-300 ${
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
            className={`absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
              isCollapsed || showResizeHandle || isResizing ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="bg-gray-400 dark:bg-gray-600 rounded-full p-1 shadow-sm hover:bg-gray-500 dark:hover:bg-gray-500 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleCollapse(e)
              }}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <FiChevronLeft className="text-white" size={12} />
              ) : (
                <FiChevronRight className="text-white" size={12} />
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default RightResizableSidebar

