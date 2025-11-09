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
      className={`flex flex-col ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg truncate">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 ml-2">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs font-medium rounded ${badge.className || 'bg-gray-100 text-gray-800'}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Custom Content */}
      {children && (
        <div className="flex-1 mb-3">
          {children}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'ghost'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
              }}
              className={action.className}
            >
              {action.icon && <action.icon className="mr-1" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  )
}

export default GridCard

