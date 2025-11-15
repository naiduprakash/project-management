'use client'

import Card from './Card'
import Button from './Button'

const GridCard = ({ 
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
      {/* Custom Content */}
      {children && (
        <div className="flex-1 p-3 sm:p-4">
          {children}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-1.5 p-3 sm:p-4 pt-2 sm:pt-2 border-t border-gray-200 dark:border-gray-700 justify-between sm:justify-start min-h-[44px] sm:min-h-[36px]">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'ghost'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
              }}
              className={`flex-1 min-h-[36px] sm:min-h-[28px] max-h-[36px] sm:max-h-[28px] ${action.className} ${action.showLabel === false ? 'aspect-square p-1' : ''}`}
              title={action.label}
            >
              {action.icon && <action.icon className={`${action.showLabel === false ? '' : 'mr-1.5 sm:mr-1'}`} />}
              {action.showLabel !== false && <span>{action.label}</span>}
            </Button>
          ))}
        </div>
      )}
    </Card>
  )
}

export default GridCard

