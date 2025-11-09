'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiChevronDown, FiChevronRight, FiMonitor, FiMoon, FiSun } from 'react-icons/fi'
import Avatar from '@/components/common/Avatar'
import Breadcrumb from '@/components/common/Breadcrumb'

const Navbar = ({ pageTitle }) => {
  const { user, logout, hasRole } = useAuth()
  const { theme = 'light', toggleTheme = () => {}, isDark = false } = useTheme() || {}
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const isAdmin = hasRole('admin')

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Page Title */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <Link href="/pages" className="flex items-center space-x-2.5 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400 bg-clip-text text-transparent">
                ProjectHub
              </span>
            </Link>
            
            {/* Page Title */}
            {pageTitle && (
              <>
                <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="hidden lg:flex items-center min-w-0 flex-1">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {pageTitle}
                  </h1>
                </div>
              </>
            )}
          </div>

          {/* Desktop Navigation - Right Aligned */}
          <div className="hidden md:flex items-center space-x-3">
            {/* User Menu */}
            <div className="ml-2">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none group"
                >
                  <Avatar name={user?.name} size="sm" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</span>
                  <FiChevronDown className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FiUser className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      
                      {isAdmin && (
                        <>
                          <Link
                            href="/admin"
                            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FiMonitor className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FiSettings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                        </>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                      
                      {/* Dark Mode Toggle */}
                      <button
                        onClick={() => {
                          toggleTheme()
                        }}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {isDark ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
                          <span>Theme</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{isDark ? 'Dark' : 'Light'}</span>
                      </button>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          logout()
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {showMobileMenu ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAdmin && (
              <Link
                href="/admin"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                onClick={() => setShowMobileMenu(false)}
              >
                Admin Panel
              </Link>
            )}
            <Link
              href="/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setShowMobileMenu(false)}
            >
              Profile
            </Link>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
            >
              <span>Theme</span>
              <span className="text-sm text-gray-500">{isDark ? 'Dark' : 'Light'}</span>
            </button>
            <button
              onClick={() => {
                setShowMobileMenu(false)
                logout()
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar

