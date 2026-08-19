import React from 'react'
import { Users, Award, TrendingUp, Target, ShieldCheck } from 'lucide-react'
import { useCampaign } from '../context/CampaignContext'
import { KpiCard } from '../components/common/KpiCard'
import { HcpRankingTable } from '../components/hcp/HcpRankingTable'
import { HcpDistributionChart } from '../components/hcp/HcpDistributionChart'
import { HcpDetailDrawer } from '../components/hcp/HcpDetailDrawer'
import { formatNumber } from '../utils/formatters'

export const HcpIntelligencePage = () => {
  const { campaignData, selectedHcp, isDrawerOpen, openHcpDrawer, closeHcpDrawer, setCurrentTab } = useCampaign()
  const { hcpUniverse, hcps, roi } = campaignData

  const eligibleCount = hcpUniverse.eligible || 100
  const highTierCount = hcpUniverse.high_potential || 28
  const baselineDemand = roi.baseline_demand || 213.07
  const avgScore = 46.3

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900">
              HCP Intelligence & Physician Potential
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> 12,000 Universe Filtered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Identify and prioritize high-value prescribers using two-stage ML hurdle demand forecasting, specialty affinity, and historical prescription velocity.
          </p>
        </div>
      </div>

      {/* 5 HCP KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Eligible HCPs"
          value={`${eligibleCount}`}
          description="Target Prescribers"
          trend={0}
          trendLabel="Qualified Pool"
          icon={Users}
          iconBg="bg-blue-50 text-blue-600"
        />

        <KpiCard
          title="High Potential Tier"
          value={`${highTierCount}`}
          description="Top 25% High Velocity"
          trend={28}
          trendLabel="Priority Focus"
          icon={Award}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <KpiCard
          title="Expected Future Rx"
          value={`${formatNumber(baselineDemand, 1)}`}
          description="3-Month Baseline Demand"
          trend={10}
          trendLabel="Hurdle Predicted"
          icon={TrendingUp}
          iconBg="bg-indigo-50 text-indigo-600"
        />

        <KpiCard
          title="Avg. Potential Score"
          value={`${avgScore}`}
          description="Scale: 0 – 100"
          trend={4.2}
          trendLabel="Territory Average"
          icon={Target}
          iconBg="bg-purple-50 text-purple-600"
        />

        <KpiCard
          title="Strategy Coverage"
          value="100%"
          description="Zero Unallocated Loss"
          trend={100}
          trendLabel="Fully Distributed"
          icon={ShieldCheck}
          iconBg="bg-slate-100 text-slate-700"
        />
      </div>

      {/* Model Summary Bar */}
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Selected Model</span>
            <span className="font-bold text-blue-300">DirectLog_XGBoost</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Validation Approach</span>
            <span className="font-semibold text-slate-200">Chronological Split</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Prediction Population</span>
            <span className="font-semibold text-slate-200">12,000 Doctors</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Model Status</span>
            <span className="font-bold text-emerald-400">Validated (Val MAE: 0.412)</span>
          </div>
        </div>
      </div>

      {/* HCP Potential Distribution Segment Visual */}
      <HcpDistributionChart
        hcps={hcps}
      />

      {/* HCP Ranking Data Table */}
      <HcpRankingTable
        hcps={hcps}
        onSelectHcp={openHcpDrawer}
      />

      {/* Slide-over HCP Detail Drawer */}
      <HcpDetailDrawer
        hcp={selectedHcp}
        isOpen={isDrawerOpen}
        onClose={closeHcpDrawer}
      />

      {/* Bottom Navigation CTA */}
      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={() => setCurrentTab('Allocation')}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <span>Continue to Allocation →</span>
        </button>
      </div>
    </div>
  )
}
