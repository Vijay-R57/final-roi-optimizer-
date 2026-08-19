import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export const KpiCard = ({
  title,
  value,
  description,
  trend,
  trendLabel,
  icon: Icon,
  iconBg = 'bg-blue-50 text-blue-600',
  variant = 'default',
}) => {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className="mt-1.5 text-2xl font-bold font-display text-slate-900">
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconBg} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {trend !== undefined && (
          <div
            className={`inline-flex items-center gap-1 font-semibold ${
              isPositive
                ? 'text-emerald-600'
                : isNegative
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}
          >
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5" />}
            <span>{trendLabel || (trend > 0 ? `+${trend}%` : `${trend}%`)}</span>
          </div>
        )}
        {description && (
          <span className="text-slate-400 text-[11px] truncate ml-auto">
            {description}
          </span>
        )}
      </div>
    </div>
  )
}
