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
      className: 'bg-green-50 border-green-500 text-green-800'
    },
    error: {
      icon: FiXCircle,
      className: 'bg-red-50 border-red-500 text-red-800'
    },
    warning: {
      icon: FiAlertTriangle,
      className: 'bg-yellow-50 border-yellow-500 text-yellow-800'
    },
    info: {
      icon: FiInfo,
      className: 'bg-blue-50 border-blue-500 text-blue-800'
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

