'use client'

import { cn } from '@/lib/utils'

const ToggleButton = ({ 
  value, 
  onChange, 
  trueLabel = 'Yes', 
  falseLabel = 'No',
  disabled = false,
  className 
}) => {
  return (
    <div className={cn('inline-flex rounded-md shadow-sm', className)}>
      <button
        type="button"
        onClick={() => !disabled && onChange(true)}
        disabled={disabled}
        className={cn(
          'px-4 py-2 text-sm font-semibold rounded-l-md border transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10',
          value === true
            ? 'bg-white text-gray-700 border-gray-300 z-10'
            : 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={() => !disabled && onChange(false)}
        disabled={disabled}
        className={cn(
          'px-4 py-2 text-sm font-semibold rounded-r-md border border-l-0 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10',
          value === false
            ? 'bg-white text-gray-700 border-gray-300 z-10'
            : 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {falseLabel}
      </button>
    </div>
  )
}

export default ToggleButton

