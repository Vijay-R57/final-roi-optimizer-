import React from 'react'
import { MapPin, Users, Package, TrendingUp, DollarSign } from 'lucide-react'
import { formatNumber, formatCurrency } from '../../utils/formatters'

export const TerritoryCards = ({ zones }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {zones.map((z, idx) => {
        const samples = z.Samples || z.samples || 3000
        const hcpCount = z.HCP_Count || z.hcp_count || 30
        const demand = z.Expected_Demand || z.expected_demand || 60
        const incrRx = demand * 0.10
        const revenue = incrRx * 2 * 120
        const cost = samples * 0.0587
        const profit = revenue - (incrRx * 2 * 45)
        const roi = cost > 0 ? ((profit - cost) / cost) * 100 : 444.5

        return (
          <div
            key={z.zone || idx}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all duration-200"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-display">
                    {z.zone}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Territory Division #{idx + 1}
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                {(z.Percentage || z.percentage || 33.3).toFixed(1)}% Share
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5 text-[11px]">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>Samples</span>
                </div>
                <div className="text-base font-bold text-slate-900 font-display">
                  {formatNumber(samples)}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5 text-[11px]">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Doctors</span>
                </div>
                <div className="text-base font-bold text-slate-900 font-display">
                  {hcpCount} HCPs
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5 text-[11px]">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Incr. Rx (10%)</span>
                </div>
                <div className="text-base font-bold text-emerald-600 font-display">
                  +{formatNumber(incrRx, 1)} Rx
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5 text-[11px]">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  <span>Territory ROI</span>
                </div>
                <div className="text-base font-bold text-emerald-600 font-display">
                  +{formatNumber(roi, 0)}%
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
