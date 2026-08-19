import React from 'react'
import { Award, Zap, Shield, Info, SlidersHorizontal } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'

export const AllocationStrategyCard = ({ totalSamples = 10000 }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 font-display">
              Hare-Niemeyer Allocation Strategy
            </h4>
            <p className="text-xs text-slate-500">
              Integer-constrained largest-remainder mathematical distribution of {formatNumber(totalSamples)} samples
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          Capacity Capped ≤ 500 / HCP
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Tier 1 Strategy */}
        <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 relative">
          <div className="flex items-center justify-between font-bold text-emerald-950 mb-1">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Top 25% HCPs</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-display">
              48% Budget
            </span>
          </div>
          <div className="text-emerald-800 font-semibold mt-1">
            Priority Heavy Drop (150 – 217 samples / doctor)
          </div>
          <p className="text-emerald-700 text-[11px] mt-2 leading-relaxed">
            Concentrates sample volume on high-velocity prescribers with high statin affinity to drive maximum initial adoption.
          </p>
        </div>

        {/* Tier 2 Strategy */}
        <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/40 relative">
          <div className="flex items-center justify-between font-bold text-amber-950 mb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Middle 50% HCPs</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-display">
              42% Budget
            </span>
          </div>
          <div className="text-amber-800 font-semibold mt-1">
            Optimized Moderate Drop (90 – 149 samples / doctor)
          </div>
          <p className="text-amber-700 text-[11px] mt-2 leading-relaxed">
            Balances inventory efficiency to capture steady second-tier prescription lift across regional health centers.
          </p>
        </div>

        {/* Tier 3 Strategy */}
        <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 relative">
          <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Bottom 25% HCPs</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-display">
              10% Budget
            </span>
          </div>
          <div className="text-slate-700 font-semibold mt-1">
            Low Maintenance Drop (30 – 60 samples / doctor)
          </div>
          <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">
            Maintains baseline commercial brand visibility in outlying territories without diluting core inventory ROI.
          </p>
        </div>
      </div>
    </div>
  )
}
