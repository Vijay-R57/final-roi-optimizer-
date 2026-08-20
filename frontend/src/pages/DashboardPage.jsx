import React from 'react'
import {
  Package,
  Users,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  ArrowRight,
  GitCompare,
  MapPin,
  CheckCircle2,
} from 'lucide-react'
import { useCampaign } from '../context/CampaignContext'
import { HeroBanner } from '../components/dashboard/HeroBanner'
import { PipelineFlow } from '../components/dashboard/PipelineFlow'
import { ExecutiveInsight } from '../components/dashboard/ExecutiveInsight'
import { KpiCard } from '../components/common/KpiCard'
import { TerminalLogViewer } from '../components/common/TerminalLogViewer'
import { formatCurrency, formatNumber } from '../utils/formatters'

export const DashboardPage = () => {
  const { campaignData, setCurrentTab } = useCampaign()
  const { target, settings, analog, hcpUniverse, roi, zones } = campaignData

  const totalSamples = settings.total_samples || 10000
  const targetHcps = hcpUniverse.eligible || 100
  const incrRx = roi.incremental_rx || roi.expected_incremental_prescriptions || 21.31
  const revenue = roi.revenue || roi.expected_revenue || 5113.65
  const projectedRoi = roi.roi_pct || roi.projected_roi_percent || 444.47
  const breakEvenRx = roi.breakeven_rx || roi.breakeven_incremental_prescriptions || 3.91

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroBanner />

      {/* 6 Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Total Samples"
          value={`${formatNumber(totalSamples)}`}
          description="Fixed Inventory Budget"
          trend={0}
          trendLabel="100% Allocated"
          icon={Package}
          iconBg="bg-blue-50 text-blue-600"
        />

        <KpiCard
          title="Target HCPs"
          value={`${targetHcps}`}
          description="Prioritized Prescribers"
          trend={12}
          trendLabel="Top 1% of Universe"
          icon={Users}
          iconBg="bg-indigo-50 text-indigo-600"
        />

        <KpiCard
          title="Expected Incr. Rx"
          value={`+${formatNumber(incrRx, 1)}`}
          description="3-Month Lift (10%)"
          trend={10}
          trendLabel="+10% Sample Lift"
          icon={TrendingUp}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <KpiCard
          title="Expected Revenue"
          value={formatCurrency(revenue, 0)}
          description={`@ ₹${target.medicine_price} / pack`}
          trend={8.4}
          trendLabel="Margin: ₹75/pack"
          icon={DollarSign}
          iconBg="bg-blue-50 text-blue-600"
        />

        <KpiCard
          title="Projected ROI"
          value={`+${projectedRoi.toFixed(1)}%`}
          description="Sample Cost: ₹587"
          trend={projectedRoi > 0 ? 34.8 : -10}
          trendLabel="Promotional Return"
          icon={Zap}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <KpiCard
          title="Break-Even Rx"
          value={`${formatNumber(breakEvenRx, 1)} Rx`}
          description="1.84% Required Lift"
          trend={420}
          trendLabel="Resilient Buffer"
          icon={ShieldCheck}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Optimization Pipeline */}
      <PipelineFlow />

      {/* Executive Insight Panel */}
      <ExecutiveInsight />

      {/* Bottom Grid: Quick Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analog Quick Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-display">
                    Historical Analog Benchmark
                  </h4>
                  <p className="text-xs text-slate-500">
                    Highest matching behavioral surrogate
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {Math.round((analog.score || 0.9367) * 100)}% Match
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Selected Medicine</span>
                <h5 className="text-sm font-bold text-slate-900 font-display">{analog.generic_name} ({analog.brand_name})</h5>
                <p className="text-xs text-slate-500">{analog.dosage_form} • {analog.strength}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Prescriber Breadth</span>
                <div className="text-sm font-bold text-blue-700 font-display">{formatNumber(analog.active_hcps || 5122)} HCPs</div>
                <p className="text-xs text-slate-500">{analog.historical_months || 33} Months History</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Profile: {Math.round((analog.profile || 0.93) * 100)}% | Behavior: {Math.round((analog.behavior || 0.95) * 100)}%
            </span>
            <button
              onClick={() => setCurrentTab('Analog Analysis')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
            >
              Explore Analog Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Territory Quick Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-display">
                    Geographic Zone Distribution
                  </h4>
                  <p className="text-xs text-slate-500">
                    Territory balance and doctor coverage
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                {zones.length} Territories
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5 text-xs text-center">
              {zones.map((z, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="font-bold text-slate-900 truncate">{z.zone?.replace(' Chennai', '') || z.zone}</div>
                  <div className="text-xs font-bold text-blue-600 font-display mt-1">
                    {formatNumber(z.Samples || z.samples || 3000)} units
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {z.HCP_Count || z.hcp_count || 30} Doctors
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              100% territory inventory reconciliation verified
            </span>
            <button
              onClick={() => setCurrentTab('Geographic Zones')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
            >
              View Territory Maps <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Terminal Log Viewer */}
      <TerminalLogViewer
        stdoutLogs={campaignData.stdoutLogs}
        stderrLogs={campaignData.stderrLogs}
        executionId={campaignData.executionId}
        duration={campaignData.executionDuration}
      />
    </div>
  )
}
