import { getInitials, getColorFromString, cn } from '@/lib/utils'

const Avatar = ({ name, size = 'md', className }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  }

  const colorClass = getColorFromString(name || 'User')

  return (
    <div className={cn(
      'flex items-center justify-center rounded-full text-white font-semibold',
      sizes[size],
      colorClass,
      className
    )}>
      {getInitials(name)}
    </div>
  )
}

export default Avatar

