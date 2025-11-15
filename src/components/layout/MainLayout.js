'use client'

import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const MainLayout = ({ 
  children, 
  showSidebar = true,
  pageTitle = null
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar 
        pageTitle={pageTitle}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        showMenuButton={showSidebar}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout

