'use client'

import { useState } from 'react'
import Navbar from './Navbar'
import SettingsSidebar from './SettingsSidebar'

const SettingsLayout = ({ 
  children,
  pageTitle = null
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar 
        pageTitle={pageTitle}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        showMenuButton={true}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <SettingsSidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default SettingsLayout

