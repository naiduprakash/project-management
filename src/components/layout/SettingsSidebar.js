'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FiDroplet,
  FiLayout,
  FiGlobe,
  FiMail,
  FiDatabase,
  FiShield
} from 'react-icons/fi'
import ResizableSidebar from '@/components/common/ResizableSidebar'

const SettingsSidebar = ({ isOpen = true, onClose = () => {} }) => {
  const pathname = usePathname()

  const menuItems = [
    {
      id: 'theme',
      label: 'Theme & Appearance',
      href: '/settings/theme',
      icon: FiDroplet,
      description: 'Theme, colors, and branding'
    },
    {
      id: 'layout',
      label: 'Layout',
      href: '/settings/layout',
      icon: FiLayout,
      description: 'Spacing and structure'
    },
    {
      id: 'localization',
      label: 'Localization',
      href: '/settings/localization',
      icon: FiGlobe,
      description: 'Language and region',
      disabled: true
    },
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/settings/notifications',
      icon: FiMail,
      description: 'Email and alerts',
      disabled: true
    },
    {
      id: 'backup',
      label: 'Backup & Restore',
      href: '/settings/backup',
      icon: FiDatabase,
      description: 'Data management',
      disabled: true
    },
    {
      id: 'security',
      label: 'Security',
      href: '/settings/security',
      icon: FiShield,
      description: 'Authentication settings',
      disabled: true
    }
  ]

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <ResizableSidebar 
      storageKey="settingsSidebarWidth"
      isOpen={isOpen}
      onClose={onClose}
    >
      {({ isCollapsed }) => (
        <>
          {/* Header */}
          {!isCollapsed && (
            <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Customize your application</p>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-2 pt-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const disabled = item.disabled

                if (disabled) {
                  return (
                    <li key={item.id}>
                      <div
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        title={item.description}
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <span className="block truncate text-sm">{item.label}</span>
                            <span className="block text-xs text-gray-400 dark:text-gray-600 truncate">Coming soon</span>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                }

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                        active
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                      title={isCollapsed ? item.label : item.description}
                      onClick={onClose}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="block truncate text-sm">{item.label}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</span>
                        </div>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </>
      )}
    </ResizableSidebar>
  )
}

export default SettingsSidebar

