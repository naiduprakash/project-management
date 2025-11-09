'use client'

import Navbar from './Navbar'
import Sidebar from './Sidebar'

const MainLayout = ({ 
  children, 
  showSidebar = true,
  pageTitle = null
}) => {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar 
        pageTitle={pageTitle}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout

