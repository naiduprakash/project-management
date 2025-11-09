'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FiFileText, 
  FiUsers, 
  FiShield, 
  FiHome,
  FiSettings,
  FiActivity
} from 'react-icons/fi'
import ResizableSidebar from '@/components/common/ResizableSidebar'

const AdminSidebar = () => {
  const pathname = usePathname()

  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/admin',
      icon: FiHome,
      description: 'Admin dashboard'
    },
    {
      id: 'pages',
      label: 'Pages',
      href: '/admin/pages',
      icon: FiFileText,
      description: 'Manage pages and forms'
    },
    {
      id: 'users',
      label: 'Users',
      href: '/admin/users',
      icon: FiUsers,
      description: 'User management'
    },
    {
      id: 'roles',
      label: 'Roles & Permissions',
      href: '/admin/roles',
      icon: FiShield,
      description: 'Role management'
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/admin/settings',
      icon: FiSettings,
      description: 'System settings',
      disabled: true
    },
    {
      id: 'activity',
      label: 'Activity Logs',
      href: '/admin/activity',
      icon: FiActivity,
      description: 'View activity logs',
      disabled: true
    }
  ]

  const isActive = (href) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <ResizableSidebar storageKey="adminSidebarWidth">
      {({ isCollapsed }) => (
        <>
          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-2 pt-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                if (item.disabled) {
                  return (
                    <li key={item.id}>
                      <div
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-400 cursor-not-allowed"
                        title={item.description}
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <span className="block truncate text-sm">{item.label}</span>
                            <span className="block text-xs text-gray-400 truncate">Coming soon</span>
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
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                      }`}
                      title={isCollapsed ? item.label : item.description}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate text-sm">{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <div className="bg-primary-50 rounded-lg p-3">
                <p className="text-xs font-medium text-primary-900 mb-1">
                  Admin Access
                </p>
                <p className="text-xs text-primary-700">
                  Full system control
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </ResizableSidebar>
  )
}

export default AdminSidebar

