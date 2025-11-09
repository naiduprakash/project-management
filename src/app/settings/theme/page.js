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
import { FiSun, FiMoon, FiCheck, FiImage, FiX, FiRotateCcw } from 'react-icons/fi'
import { COLOR_PALETTES } from '@/context/ThemeContext'

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

  // Preview state (not applied to app until saved)
  const [previewTheme, setPreviewTheme] = useState(theme)
  const [previewPalette, setPreviewPalette] = useState(colorPalette)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Sync preview with actual theme when component mounts or theme changes externally
  useEffect(() => {
    setPreviewTheme(theme)
    setPreviewPalette(colorPalette)
  }, [theme, colorPalette])

  // Check if there are unsaved changes
  const hasChanges = previewTheme !== theme || previewPalette !== colorPalette

  // Get preview palette data
  const previewIsDark = previewTheme === 'dark'
  const previewAvailablePalettes = COLOR_PALETTES[previewTheme] || {}
  
  const getPreviewPaletteConfig = () => {
    return previewAvailablePalettes[previewPalette] || previewAvailablePalettes.default
  }
  
  const previewPaletteConfig = getPreviewPaletteConfig()
  const previewPrimaryColor = previewPaletteConfig?.primary || '#2563eb'

  if (authLoading || !user) {
    return (
      <SettingsLayout>
        <Loading fullScreen />
      </SettingsLayout>
    )
  }

  const handleThemeChange = (newTheme) => {
    setPreviewTheme(newTheme)
  }

  const handlePaletteChange = (palette) => {
    setPreviewPalette(palette)
  }

  const handleSaveAll = () => {
    // Apply theme changes
    if (previewTheme !== theme) {
      toggleTheme()
    }
    
    // Apply palette changes
    if (previewPalette !== colorPalette) {
      changeColorPalette(previewPalette)
    }

    // Save brand settings
    // TODO: Implement save to backend/localStorage
    
    success('Settings saved successfully!')
  }

  const handleReset = () => {
    setPreviewTheme(theme)
    setPreviewPalette(colorPalette)
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
            <div className="flex gap-2">
              {hasChanges && (
                <Button variant="outline" onClick={handleReset}>
                  <FiRotateCcw className="mr-2" />
                  Reset
                </Button>
              )}
              <Button onClick={handleSaveAll} disabled={!hasChanges && !isAdmin}>
                Save Changes
              </Button>
            </div>
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
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Theme Mode</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Choose between light and dark mode</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Light Theme */}
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      previewTheme === 'light'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        previewTheme === 'light' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <FiSun className={`w-5 h-5 ${
                          previewTheme === 'light' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Light</h3>
                          {previewTheme === 'light' && (
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
                      previewTheme === 'dark'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        previewTheme === 'dark' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <FiMoon className={`w-5 h-5 ${
                          previewTheme === 'dark' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dark</h3>
                          {previewTheme === 'dark' && (
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
                    Choose a palette for {previewIsDark ? 'dark' : 'light'} mode
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(previewAvailablePalettes).map(([key, palette]) => (
                    <button
                      key={key}
                      onClick={() => handlePaletteChange(key)}
                      className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                        previewPalette === key
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
                        {previewPalette === key && (
                          <FiCheck className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Preview:</span>{' '}
                    {previewAvailablePalettes[previewPalette]?.name}
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

              {/* Preview Container with theme simulation */}
              <div 
                className="space-y-4 rounded-lg p-4 transition-colors"
                style={{
                  backgroundColor: previewIsDark ? '#1f2937' : '#f9fafb',
                  border: `1px solid ${previewIsDark ? '#374151' : '#e5e7eb'}`
                }}
              >
                {/* Brand Preview */}
                <div 
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: previewIsDark ? '#111827' : '#ffffff',
                    borderColor: previewIsDark ? '#374151' : '#e5e7eb'
                  }}
                >
                  <p 
                    className="text-xs font-medium uppercase tracking-wide mb-3"
                    style={{ color: previewIsDark ? '#9ca3af' : '#6b7280' }}
                  >
                    Brand
                  </p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center shadow"
                      style={{
                        background: `linear-gradient(135deg, ${previewPrimaryColor}, ${previewPrimaryColor}dd)`
                      }}
                    >
                      <span className="text-white font-bold text-lg">
                        {brandSettings.appName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-sm font-bold truncate"
                        style={{
                          background: `linear-gradient(90deg, ${previewPrimaryColor}, ${previewPrimaryColor}cc)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {brandSettings.appName}
                      </div>
                      <p 
                        className="text-xs truncate"
                        style={{ color: previewIsDark ? '#9ca3af' : '#6b7280' }}
                      >
                        {brandSettings.appTagline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* UI Elements Preview */}
                <div 
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: previewIsDark ? '#111827' : '#ffffff',
                    borderColor: previewIsDark ? '#374151' : '#e5e7eb'
                  }}
                >
                  <p 
                    className="text-xs font-medium uppercase tracking-wide mb-3"
                    style={{ color: previewIsDark ? '#9ca3af' : '#6b7280' }}
                  >
                    Buttons
                  </p>
                  <div className="space-y-2">
                    <button
                      className="w-full px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                      style={{ backgroundColor: previewPrimaryColor }}
                    >
                      Primary
                    </button>
                    <button
                      className="w-full px-4 py-2 text-sm font-medium rounded-md transition-colors"
                      style={{
                        border: `1px solid ${previewPrimaryColor}`,
                        color: previewPrimaryColor
                      }}
                    >
                      Outline
                    </button>
                  </div>
                </div>

                {/* Links & Badges */}
                <div 
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: previewIsDark ? '#111827' : '#ffffff',
                    borderColor: previewIsDark ? '#374151' : '#e5e7eb'
                  }}
                >
                  <p 
                    className="text-xs font-medium uppercase tracking-wide mb-3"
                    style={{ color: previewIsDark ? '#9ca3af' : '#6b7280' }}
                  >
                    Links & Badges
                  </p>
                  <div className="space-y-2">
                    <a 
                      href="#" 
                      className="text-sm font-medium block"
                      style={{ color: previewPrimaryColor }}
                    >
                      Sample Link
                    </a>
                    <div className="flex gap-2">
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: previewIsDark ? `${previewPrimaryColor}20` : `${previewPrimaryColor}20`,
                          color: previewPrimaryColor
                        }}
                      >
                        Badge
                      </span>
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded"
                        style={{
                          backgroundColor: previewIsDark ? `${previewPrimaryColor}15` : `${previewPrimaryColor}15`,
                          color: previewPrimaryColor
                        }}
                      >
                        Label
                      </span>
                    </div>
                  </div>
                </div>

                {/* Color Swatches */}
                <div 
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: previewIsDark ? '#111827' : '#ffffff',
                    borderColor: previewIsDark ? '#374151' : '#e5e7eb'
                  }}
                >
                  <p 
                    className="text-xs font-medium uppercase tracking-wide mb-3"
                    style={{ color: previewIsDark ? '#9ca3af' : '#6b7280' }}
                  >
                    Sample Colors
                  </p>
                  <div className="flex gap-2">
                    {[0.3, 0.5, 0.7, 0.9, 1].map((opacity, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div 
                          className="w-full h-8 rounded border"
                          style={{
                            backgroundColor: `${previewPrimaryColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                            borderColor: previewIsDark ? '#374151' : '#e5e7eb'
                          }}
                        />
                        <span 
                          className="text-xs mt-0.5 block"
                          style={{ color: previewIsDark ? '#9ca3af' : '#6b7280' }}
                        >
                          {Math.round(opacity * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Note */}
                {hasChanges && (
                  <div 
                    className="rounded-lg p-3 text-xs text-center"
                    style={{
                      backgroundColor: previewIsDark ? '#1e40af20' : '#dbeafe',
                      color: previewIsDark ? '#93c5fd' : '#1e40af'
                    }}
                  >
                    Click "Save Changes" to apply
                  </div>
                )}
              </div>
            </Card>
          </div>

        </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
