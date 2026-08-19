import React from 'react'
import { Lightbulb, TrendingUp, ShieldCheck, Target, ArrowRight } from 'lucide-react'
import { useCampaign } from '../../context/CampaignContext'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export const ExecutiveInsight = () => {
  const { campaignData, setCurrentTab } = useCampaign()
  const roi = campaignData.roi
  const analog = campaignData.analog

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 shadow-elevated border border-blue-800/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white">
              AI Optimization Insight
            </h3>
            <p className="text-xs text-blue-200">
              Commercial executive takeaways based on ML hurdle modeling
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentTab('ROI Simulator')}
          className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-300 hover:text-white transition-colors"
        >
          Simulate Scenarios <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Insight 1 */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-blue-300 font-semibold mb-1.5">
            <Target className="w-4 h-4" />
            <span>Targeting Concentration</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            The mathematical allocation concentrates samples in the top 25% highest-velocity prescribers (e.g. Cardiology & Diabetology specialists), capturing over 65% of expected incremental prescriptions while preserving broad geographic presence.
          </p>
        </div>

        {/* Insight 2 */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>High Return Resilience</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            With a baseline demand of {formatNumber(roi.baseline_demand || 213.07, 1)} units and drug price of {formatCurrency(campaignData.target.medicine_price)}, the campaign achieves an exceptional projected ROI of {roi.projected_roi_percent ? `+${roi.projected_roi_percent.toFixed(1)}%` : '+444.5%'} at the target 10% lift assumption.
          </p>
        </div>

        {/* Insight 3 */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Low Break-Even Threshold</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Break-even requires only {(roi.breakeven_lift ? roi.breakeven_lift * 100 : 1.84).toFixed(2)}% prescription lift ({formatNumber(roi.breakeven_rx || 3.91, 1)} Rx), providing strong downside commercial risk protection against soft market uptake.
          </p>
        </div>
      </div>
    </div>
  )
}
