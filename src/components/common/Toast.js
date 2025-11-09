'use client'

import { useEffect } from 'react'
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi'

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const types = {
    success: {
      icon: FiCheckCircle,
      className: 'bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-400 text-green-800 dark:text-green-200'
    },
    error: {
      icon: FiXCircle,
      className: 'bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-400 text-red-800 dark:text-red-200'
    },
    warning: {
      icon: FiAlertTriangle,
      className: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200'
    },
    info: {
      icon: FiInfo,
      className: 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 text-blue-800 dark:text-blue-200'
    }
  }

  const { icon: Icon, className } = types[type]

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg min-w-[300px] max-w-md animate-slide-in ${className}`}>
      <Icon className="text-xl flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <FiX className="text-lg" />
      </button>
    </div>
  )
}

export default Toast

