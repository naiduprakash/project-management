import { cn } from '@/lib/utils'

const Card = ({ children, className, padding = true, hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200',
        padding && 'p-6',
        hover && 'hover:shadow-md transition-shadow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card

