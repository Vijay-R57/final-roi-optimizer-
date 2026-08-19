import React from 'react'

export const Badge = ({ children, variant = 'blue', className = '', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  
  const variants = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    red: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant] || variants.blue} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  )
}
