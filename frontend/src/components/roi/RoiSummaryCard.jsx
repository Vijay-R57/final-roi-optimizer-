import React from 'react'
import { TrendingUp, DollarSign, Package, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export const RoiSummaryCard = ({ roiResults, currentPrice, currentLift }) => {
  const {
    sampleInvestment,
    expectedIncrementalRx,
    expectedRevenue,
    expectedIncrementalProfit,
    projectedRoiPercent,
    breakevenSampleLift,
  } = roiResults

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-7 shadow-elevated border border-slate-700/80">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Real-Time Commercial Impact Simulator
          </span>
          <h3 className="text-2xl lg:text-3xl font-extrabold font-display mt-1 text-white">
            Projected Promotional Return
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Simulated incremental sales, contribution margin, and financial ROI for {formatCurrency(currentPrice)} pack price at {(currentLift * 100).toFixed(1)}% lift.
          </p>
        </div>

        {/* Central ROI Highlight Metric */}
        <div className="shrink-0 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 backdrop-blur-sm text-center lg:text-right min-w-[200px]">
          <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
            Projected ROI
          </span>
          <div className="text-3xl lg:text-4xl font-black font-display text-emerald-400 mt-0.5">
            {projectedRoiPercent >= 0 ? `+${projectedRoiPercent.toFixed(1)}%` : `${projectedRoiPercent.toFixed(1)}%`}
          </div>
          <span className="text-[10px] text-emerald-200 mt-1 inline-flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            {(breakevenSampleLift * 100).toFixed(2)}% break-even lift
          </span>
        </div>
      </div>

      {/* 4 Bottom Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-xs">
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
          <span className="text-slate-400 text-[11px] block">Expected Incremental Profit</span>
          <div className="text-xl font-bold font-display text-emerald-400 mt-1">
            {formatCurrency(expectedIncrementalProfit, 0)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Net above sample cost</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
          <span className="text-slate-400 text-[11px] block">Expected Gross Revenue</span>
          <div className="text-xl font-bold font-display text-white mt-1">
            {formatCurrency(expectedRevenue, 0)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">At ₹{currentPrice} retail price</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
          <span className="text-slate-400 text-[11px] block">Total Sample Investment</span>
          <div className="text-xl font-bold font-display text-slate-200 mt-1">
            {formatCurrency(sampleInvestment, 2)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Physical production & drop</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
          <span className="text-slate-400 text-[11px] block">Expected Incremental Rx</span>
          <div className="text-xl font-bold font-display text-blue-400 mt-1">
            +{formatNumber(expectedIncrementalRx, 1)} Rx
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">From 100 targeted HCPs</span>
        </div>
      </div>
    </div>
  )
}
