import React from 'react'
import { MapPin, Globe, Users, Package, TrendingUp } from 'lucide-react'
import { useCampaign } from '../context/CampaignContext'
import { TerritoryCards } from '../components/geography/TerritoryCards'
import { TerritoryComparisonChart } from '../components/geography/TerritoryComparisonChart'
import { formatNumber } from '../utils/formatters'

export const GeographicAllocationPage = () => {
  const { campaignData, setCurrentTab } = useCampaign()
  const { zones, settings } = campaignData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900">
              Geographic & Territory Allocation
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {zones.length} Territories Balanced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Understand how optimized physical sample drops are deployed across regional territories to ensure balanced geographic physician coverage and maximize commercial territory revenue.
          </p>
        </div>
      </div>

      {/* Territory KPI Cards */}
      <TerritoryCards
        zones={zones}
      />

      {/* Territory Comparison Charts with Toggle */}
      <TerritoryComparisonChart
        zones={zones}
      />

      {/* Geographic Strategy Notice */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Field Force & Supply Chain Alignment</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Territory managers receive pre-allocated sample batch sheets organized by locality clusters, ensuring medical representatives target top-tier prescribers within minimal transit time.
          </p>
        </div>

        <div className="shrink-0 text-xs font-semibold text-slate-400 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
          Total Territory Allocation: <strong className="text-white">{formatNumber(settings.total_samples || 10000)} units</strong>
        </div>
      </div>

      {/* Bottom Navigation CTA */}
      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={() => setCurrentTab('ROI Simulator')}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <span>Continue to ROI Simulator →</span>
        </button>
      </div>
    </div>
  )
}
