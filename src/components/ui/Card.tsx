import { type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-xl shadow-sm border border-gray-200',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div
      className={['px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div className={['px-4 sm:px-5 py-3 sm:py-4', className].join(' ')} {...props}>
      {children}
    </div>
  )
}
