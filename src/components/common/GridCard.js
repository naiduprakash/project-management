'use client'

import Card from './Card'
import Button from './Button'

const GridCard = ({ 
  title, 
  description, 
  badges = [],
  actions = [],
  children,
  onClick 
}) => {
  return (
    <Card 
      className={`flex flex-col h-full ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow active:shadow-sm' : ''}`}
      onClick={onClick}
      padding={false}
    >
      {/* Header with responsive padding */}
      <div className="p-4 sm:p-6 flex items-start justify-between gap-3 flex-wrap border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg truncate">
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${badge.className || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Custom Content */}
      {children && (
        <div className="flex-1 p-4 sm:p-6">
          {children}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2 p-4 sm:p-6 pt-3 sm:pt-3 border-t border-gray-200 dark:border-gray-700 flex-wrap">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'ghost'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
              }}
              className={`flex-1 sm:flex-none min-h-[40px] sm:min-h-[32px] ${action.className}`}
            >
              {action.icon && <action.icon className="mr-1" />}
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden text-xs">{action.label?.substring(0, 1)}</span>
            </Button>
          ))}
        </div>
      )}
    </Card>
  )
}

export default GridCard

