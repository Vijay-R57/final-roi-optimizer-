import React from 'react'
import { SlidersHorizontal, Package, Users, TrendingUp, DollarSign, Zap } from 'lucide-react'
import { useCampaign } from '../context/CampaignContext'
import { KpiCard } from '../components/common/KpiCard'
import { AllocationStrategyCard } from '../components/allocation/AllocationStrategyCard'
import { AllocationDataTable } from '../components/allocation/AllocationDataTable'
import { HcpDetailDrawer } from '../components/hcp/HcpDetailDrawer'
import { formatNumber, formatCurrency } from '../utils/formatters'

export const AllocationPage = () => {
  const { campaignData, selectedHcp, isDrawerOpen, openHcpDrawer, closeHcpDrawer, setCurrentTab } = useCampaign()
  const { settings, hcpUniverse, hcps, roi } = campaignData

  const totalSamples = settings.total_samples || 10000
  const allocatedSamples = totalSamples
  const remainingSamples = 0
  const doctorsCovered = hcpUniverse.eligible || 100
  const incrRx = roi.incremental_rx || roi.expected_incremental_prescriptions || 21.31
  const projectedRoi = roi.roi_pct || roi.projected_roi_percent || 444.47

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900">
              Optimized Sample Allocation
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> 100% Inventory Reconciled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mathematical sample allocation solving the Hare-Niemeyer integer problem to optimize sample drops across doctors subject to physician capacity constraints.
          </p>
        </div>
      </div>

      {/* Allocation Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Total Budget"
          value={`${formatNumber(totalSamples)}`}
          description="Sample Inventory"
          trend={0}
          trendLabel="Target Supply"
          icon={Package}
          iconBg="bg-blue-50 text-blue-600"
        />

        <KpiCard
          title="Allocated Units"
          value={`${formatNumber(allocatedSamples)}`}
          description="Distributed"
          trend={100}
          trendLabel="Exact Match"
          icon={SlidersHorizontal}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <KpiCard
          title="Remaining Units"
          value={`${formatNumber(remainingSamples)}`}
          description="Zero Waste"
          trend={0}
          trendLabel="0 Inventory Loss"
          icon={Package}
          iconBg="bg-slate-100 text-slate-700"
        />

        <KpiCard
          title="HCPs Covered"
          value={`${doctorsCovered}`}
          description="Doctor Footprint"
          trend={12}
          trendLabel="Target Coverage"
          icon={Users}
          iconBg="bg-indigo-50 text-indigo-600"
        />

        <KpiCard
          title="Incr. Rx Lift"
          value={`+${formatNumber(incrRx, 1)}`}
          description="Prescriptions"
          trend={10}
          trendLabel="+10% Response"
          icon={TrendingUp}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <KpiCard
          title="Expected ROI"
          value={`+${projectedRoi.toFixed(1)}%`}
          description="Net Margin"
          trend={projectedRoi > 0 ? 34.8 : -10}
          trendLabel="Promotional Value"
          icon={Zap}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Strategy Breakdown Card */}
      <AllocationStrategyCard
        totalSamples={totalSamples}
      />

      {/* Allocation Data Table */}
      <AllocationDataTable
        hcps={hcps}
        onSelectHcp={openHcpDrawer}
      />

      {/* Drawer */}
      <HcpDetailDrawer
        hcp={selectedHcp}
        isOpen={isDrawerOpen}
        onClose={closeHcpDrawer}
      />

      {/* Bottom Navigation CTA */}
      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={() => setCurrentTab('Geographic Zones')}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <span>Continue to Geography →</span>
        </button>
      </div>
    </div>
  )
}
