import React from 'react'

export const CircularScore = ({ score = 0.92, size = 120, strokeWidth = 10, label = "Similarity Match" }) => {
  const percentage = Math.round(score * 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  let strokeColor = '#2563eb' // blue-600
  if (percentage >= 90) strokeColor = '#10b981' // emerald-500
  else if (percentage >= 70) strokeColor = '#3b82f6' // blue-500
  else if (percentage >= 50) strokeColor = '#f59e0b' // amber-500
  else strokeColor = '#f43f5e' // rose-500

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold font-display text-slate-900 leading-none">
            {percentage}%
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 mt-1">
            Score
          </span>
        </div>
      </div>
      {label && <p className="mt-2 text-xs font-medium text-slate-600">{label}</p>}
    </div>
  )
}
