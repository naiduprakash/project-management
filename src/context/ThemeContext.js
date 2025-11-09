'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Helper function to lighten/darken color
const adjustColor = (hex, percent) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  
  const adjust = (value) => {
    const adjusted = Math.round(value + (255 - value) * percent)
    return Math.max(0, Math.min(255, adjusted))
  }
  
  if (percent > 0) {
    // Lighten
    return {
      r: adjust(rgb.r),
      g: adjust(rgb.g),
      b: adjust(rgb.b)
    }
  } else {
    // Darken
    const darken = (value) => Math.round(value * (1 + percent))
    return {
      r: Math.max(0, darken(rgb.r)),
      g: Math.max(0, darken(rgb.g)),
      b: Math.max(0, darken(rgb.b))
    }
  }
}

// Generate color shades from base color
const generateColorShades = (baseHex) => {
  const base = hexToRgb(baseHex)
  if (!base) return {}
  
  return {
    50: adjustColor(baseHex, 0.90),
    100: adjustColor(baseHex, 0.80),
    200: adjustColor(baseHex, 0.60),
    300: adjustColor(baseHex, 0.40),
    400: adjustColor(baseHex, 0.20),
    500: base,
    600: adjustColor(baseHex, -0.15),
    700: adjustColor(baseHex, -0.30),
    800: adjustColor(baseHex, -0.45),
    900: adjustColor(baseHex, -0.60)
  }
}

// Color palette definitions
export const COLOR_PALETTES = {
  light: {
    default: {
      name: 'Ocean Blue',
      primary: '#2563eb', // blue-600
      description: 'Classic blue theme',
      preview: 'from-blue-500 to-blue-600'
    },
    emerald: {
      name: 'Emerald Green',
      primary: '#10b981', // emerald-500
      description: 'Fresh and vibrant',
      preview: 'from-emerald-500 to-emerald-600'
    },
    purple: {
      name: 'Royal Purple',
      primary: '#9333ea', // purple-600
      description: 'Bold and creative',
      preview: 'from-purple-500 to-purple-600'
    },
    rose: {
      name: 'Rose Pink',
      primary: '#f43f5e', // rose-500
      description: 'Warm and inviting',
      preview: 'from-rose-500 to-rose-600'
    },
    amber: {
      name: 'Golden Amber',
      primary: '#f59e0b', // amber-500
      description: 'Energetic and warm',
      preview: 'from-amber-500 to-amber-600'
    },
    cyan: {
      name: 'Cyan Sky',
      primary: '#06b6d4', // cyan-500
      description: 'Cool and modern',
      preview: 'from-cyan-500 to-cyan-600'
    }
  },
  dark: {
    default: {
      name: 'Midnight Blue',
      primary: '#3b82f6', // blue-500
      description: 'Classic dark blue',
      preview: 'from-blue-600 to-blue-700'
    },
    emerald: {
      name: 'Forest Emerald',
      primary: '#10b981', // emerald-500
      description: 'Natural and calm',
      preview: 'from-emerald-600 to-emerald-700'
    },
    violet: {
      name: 'Deep Violet',
      primary: '#8b5cf6', // violet-500
      description: 'Mysterious and elegant',
      preview: 'from-violet-600 to-violet-700'
    },
    orange: {
      name: 'Sunset Orange',
      primary: '#f97316', // orange-500
      description: 'Warm and cozy',
      preview: 'from-orange-600 to-orange-700'
    },
    teal: {
      name: 'Ocean Teal',
      primary: '#14b8a6', // teal-500
      description: 'Deep and tranquil',
      preview: 'from-teal-600 to-teal-700'
    },
    pink: {
      name: 'Neon Pink',
      primary: '#ec4899', // pink-500
      description: 'Vibrant and modern',
      preview: 'from-pink-600 to-pink-700'
    }
  }
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const [colorPalette, setColorPalette] = useState('default')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load theme and palette from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    const savedPalette = localStorage.getItem('colorPalette') || 'default'
    
    setTheme(savedTheme)
    setColorPalette(savedPalette)
    
    // Apply theme to document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Apply color palette
    applyColorPalette(savedTheme, savedPalette)
  }, [])

  const applyColorPalette = (currentTheme, palette) => {
    const paletteConfig = COLOR_PALETTES[currentTheme]?.[palette] || COLOR_PALETTES[currentTheme]?.default
    if (paletteConfig) {
      const shades = generateColorShades(paletteConfig.primary)
      
      // Set all CSS variables
      Object.entries(shades).forEach(([shade, rgb]) => {
        document.documentElement.style.setProperty(`--primary-${shade}`, `${rgb.r} ${rgb.g} ${rgb.b}`)
      })
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Reapply color palette for new theme
    applyColorPalette(newTheme, colorPalette)
  }

  const changeColorPalette = (palette) => {
    setColorPalette(palette)
    localStorage.setItem('colorPalette', palette)
    applyColorPalette(theme, palette)
  }

  const value = {
    theme,
    colorPalette,
    toggleTheme,
    changeColorPalette,
    isDark: theme === 'dark',
    mounted,
    availablePalettes: COLOR_PALETTES[theme] || {}
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

