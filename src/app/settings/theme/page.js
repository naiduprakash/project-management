'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import SettingsLayout from '@/components/layout/SettingsLayout'
import ContentHeader from '@/components/common/ContentHeader'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Loading from '@/components/common/Loading'
import { FiSun, FiMoon, FiCheck, FiImage, FiX } from 'react-icons/fi'

export default function ThemeSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, hasRole } = useAuth()
  const { theme, colorPalette, toggleTheme, changeColorPalette, isDark, availablePalettes } = useTheme()
  const { success } = useToast()

  const isAdmin = hasRole('admin')

  const [brandSettings, setBrandSettings] = useState({
    appName: 'ProjectHub',
    appTagline: 'Manage your projects efficiently',
    logo: null,
    favicon: null
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <SettingsLayout>
        <Loading fullScreen />
      </SettingsLayout>
    )
  }

  const handleThemeChange = (newTheme) => {
    if ((newTheme === 'dark') !== isDark) {
      toggleTheme()
      success(`Switched to ${newTheme} mode`)
    }
  }

  const handlePaletteChange = (palette) => {
    changeColorPalette(palette)
    success(`Color palette changed to ${availablePalettes[palette]?.name}`)
  }

  const handleSaveBrand = () => {
    // TODO: Implement save to backend/localStorage
    success('Brand settings saved successfully!')
  }

  return (
    <SettingsLayout pageTitle="Theme & Appearance">
      <div className="h-full flex flex-col">
        <ContentHeader
          breadcrumbItems={[
            { label: 'Settings', href: '/settings/theme' },
            { label: 'Theme & Appearance' }
          ]}
          actions={
            isAdmin && (
              <Button onClick={handleSaveBrand}>
                Save Changes
              </Button>
            )
          }
        />
        
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Settings (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Brand Identity - Admin Only */}
              {isAdmin && (
                <Card>
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Brand Identity
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Customize your application name and tagline
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Application Name"
                      value={brandSettings.appName}
                      onChange={(e) => setBrandSettings({ ...brandSettings, appName: e.target.value })}
                      hint="Appears in navbar"
                    />

                    <Input
                      label="Tagline"
                      value={brandSettings.appTagline}
                      onChange={(e) => setBrandSettings({ ...brandSettings, appTagline: e.target.value })}
                      hint="Short description"
                    />
                  </div>
                </Card>
              )}

              {/* Logo & Favicon - Admin Only */}
              {isAdmin && (
                <Card>
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Logo & Favicon
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Upload your brand assets
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Application Logo
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                        {brandSettings.logo ? (
                          <div className="relative">
                            <img 
                              src={brandSettings.logo} 
                              alt="Logo preview" 
                              className="max-h-16 mx-auto"
                            />
                            <button
                              onClick={() => setBrandSettings({ ...brandSettings, logo: null })}
                              className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <FiImage className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                            <label className="cursor-pointer">
                              <span className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                                Click to upload
                              </span>
                              <input type="file" className="hidden" accept="image/*" />
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              120x120px
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Favicon Upload */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Favicon
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                        {brandSettings.favicon ? (
                          <div className="relative">
                            <img 
                              src={brandSettings.favicon} 
                              alt="Favicon preview" 
                              className="max-h-16 mx-auto"
                            />
                            <button
                              onClick={() => setBrandSettings({ ...brandSettings, favicon: null })}
                              className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <FiImage className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                            <label className="cursor-pointer">
                              <span className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                                Click to upload
                              </span>
                              <input type="file" className="hidden" accept="image/*" />
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              32x32px
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Theme Mode Selection */}
              <Card>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Theme Mode</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose between light and dark mode</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Theme */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    !isDark
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      !isDark ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <FiSun className={`w-5 h-5 ${
                        !isDark ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Light</h3>
                        {!isDark && (
                          <FiCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isDark
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isDark ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <FiMoon className={`w-5 h-5 ${
                        isDark ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dark</h3>
                        {isDark && (
                          <FiCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </Card>

            {/* Color Palette Selection */}
            <Card>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Color Palette
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Choose a palette for {isDark ? 'dark' : 'light'} mode
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(availablePalettes).map(([key, palette]) => (
                  <button
                    key={key}
                    onClick={() => handlePaletteChange(key)}
                    className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                      colorPalette === key
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {/* Color Preview */}
                    <div className={`h-8 rounded-md bg-gradient-to-r ${palette.preview} mb-2`} />
                    
                    {/* Palette Info */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {palette.name}
                      </h3>
                      {colorPalette === key && (
                        <FiCheck className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Current:</span>{' '}
                  {availablePalettes[colorPalette]?.name}
                </p>
              </div>
            </Card>

          </div>

          {/* Right Column - Live Preview (1/3 width) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Live Preview
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  See your changes in real-time
                </p>
              </div>

              <div className="space-y-4">
                {/* Brand Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Brand
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow">
                      <span className="text-white font-bold text-lg">
                        {brandSettings.appName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent truncate">
                        {brandSettings.appName}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{brandSettings.appTagline}</p>
                    </div>
                  </div>
                </div>

                {/* UI Elements Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Buttons
                  </p>
                  <div className="space-y-2">
                    <Button variant="primary" size="sm" fullWidth>Primary</Button>
                    <Button variant="outline" size="sm" fullWidth>Outline</Button>
                  </div>
                </div>

                {/* Links & Badges */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Links & Badges
                  </p>
                  <div className="space-y-2">
                    <a href="#" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium block">
                      Sample Link
                    </a>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-xs font-medium rounded-full">
                        Badge
                      </span>
                      <span className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium rounded">
                        Label
                      </span>
                    </div>
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Colors
                  </p>
                  <div className="grid grid-cols-5 gap-1">
                    {[50, 200, 400, 600, 900].map((shade) => (
                      <div key={shade} className="text-center">
                        <div 
                          className={`w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-primary-${shade}`}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 block">{shade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
