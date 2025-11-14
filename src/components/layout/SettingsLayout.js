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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar 
        pageTitle={pageTitle}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        showMenuButton={true}
      />
      
      <div className="flex" style={{ height: 'calc(100vh - 4rem)' }}>
        <SettingsSidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default SettingsLayout

