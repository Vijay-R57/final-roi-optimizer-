import React from 'react'
import { Sparkles, ArrowRight, Play, FileText, CheckCircle2 } from 'lucide-react'
import { useCampaign } from '../../context/CampaignContext'

export const HeroBanner = () => {
  const { setCurrentTab, campaignData } = useCampaign()

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-7 shadow-elevated border border-slate-800">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Active Campaign • {campaignData.target.generic_name} ({campaignData.target.brand_name})</span>
        </div>

        <h2 className="text-2xl lg:text-3xl font-extrabold font-display tracking-tight text-white leading-tight">
          Sample Drop Optimization
        </h2>

        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
          Optimize pharmaceutical sample distribution using AI-driven HCP targeting, two-stage demand hurdle models, and mathematical sample allocation to maximize incremental prescription volume and commercial ROI.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setCurrentTab('Medicine Input')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start New Optimization
          </button>

          <button
            onClick={() => setCurrentTab('Analog Analysis')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold backdrop-blur-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            View Analog Insights
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
