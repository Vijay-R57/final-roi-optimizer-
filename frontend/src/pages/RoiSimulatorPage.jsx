import React from 'react'
import { TrendingUp, Calculator, Sparkles, AlertCircle } from 'lucide-react'
import { useCampaign } from '../context/CampaignContext'
import { RoiSummaryCard } from '../components/roi/RoiSummaryCard'
import { RoiSliders } from '../components/roi/RoiSliders'
import { BreakEvenChart } from '../components/roi/BreakEvenChart'
import { RoiSensitivityHeatmap } from '../components/roi/RoiSensitivityHeatmap'
import { DEFAULT_CAMPAIGN_DATA } from '../mock/defaultCampaignData'

export const RoiSimulatorPage = () => {
  const {
    roiParams,
    setRoiParams,
    liveRoiResults,
    liveSensitivityMatrix,
    campaignData,
    setCurrentTab,
  } = useCampaign()

  const handleResetSliders = () => {
    setRoiParams({
      lift: DEFAULT_CAMPAIGN_DATA.settings.expected_sample_lift,
      price: DEFAULT_CAMPAIGN_DATA.target.medicine_price,
      totalSamples: DEFAULT_CAMPAIGN_DATA.settings.total_samples,
      unitsPerRx: DEFAULT_CAMPAIGN_DATA.settings.average_units_per_prescription,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900">
              Financial Impact & ROI Simulator
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> Interactive Sensitivity Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Explore how varying sample lift percentages, medicine prices, pack sizes, and total sample inventory dynamically shift commercial profitability and break-even thresholds.
          </p>
        </div>
      </div>

      {/* Main Large ROI Card */}
      <RoiSummaryCard
        roiResults={liveRoiResults}
        currentPrice={roiParams.price}
        currentLift={roiParams.lift}
      />

      {/* Interactive Controls Sliders */}
      <RoiSliders
        params={roiParams}
        onChange={setRoiParams}
        onReset={handleResetSliders}
      />

      {/* Break-Even Profitability Curve Chart */}
      <BreakEvenChart
        roiResults={liveRoiResults}
        currentPrice={roiParams.price}
      />

      {/* Multi-Scenario ROI Sensitivity Heatmap */}
      <RoiSensitivityHeatmap
        sensitivityData={liveSensitivityMatrix}
      />

      {/* Financial Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Commercial Planning Notice:</strong> {campaignData.roi?.disclaimer || 'Projected ROI is computed from empirical analog response curves and economic margin assumptions. Actual market performance may vary with competitive dynamics and field force execution.'}
        </p>
      </div>

      {/* Bottom Navigation CTA */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentTab('Medicine Input')}
          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ← Review Setup
        </button>
        <button
          type="button"
          onClick={() => setCurrentTab('Dashboard')}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <span>View Executive Dashboard →</span>
        </button>
      </div>
    </div>
  )
}
