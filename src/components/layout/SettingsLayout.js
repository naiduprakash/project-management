'use client'

import Navbar from './Navbar'
import SettingsSidebar from './SettingsSidebar'

const SettingsLayout = ({ 
  children,
  pageTitle = null
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar 
        pageTitle={pageTitle}
      />
      
      <div className="flex" style={{ height: 'calc(100vh - 4rem)' }}>
        <SettingsSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default SettingsLayout

