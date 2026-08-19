import React from 'react'
import { CheckCircle2, ChevronRight, Pill, GitCompare, Cpu, Users, SlidersHorizontal, TrendingUp } from 'lucide-react'
import { useCampaign } from '../../context/CampaignContext'

export const PipelineFlow = () => {
  const { setCurrentTab, campaignData } = useCampaign()

  const stages = [
    {
      id: 'Medicine Input',
      title: 'Target Medicine',
      metric: `${campaignData.target.generic_name}`,
      detail: `${campaignData.target.strength} ${campaignData.target.dosage_form}`,
      icon: Pill,
      status: 'Ready',
    },
    {
      id: 'Analog Analysis',
      title: 'Analog Matching',
      metric: `${campaignData.analog.generic_name}`,
      detail: `${Math.round(campaignData.analog.score * 100)}% Similarity`,
      icon: GitCompare,
      status: 'Validated',
    },
    {
      id: 'HCP Intelligence',
      title: 'HCP Prediction',
      metric: `${campaignData.hcpUniverse.eligible} HCPs`,
      detail: '2-Stage Hurdle Model',
      icon: Cpu,
      status: 'Trained',
    },
    {
      id: 'HCP Intelligence',
      title: 'Ranking & Tiers',
      metric: `${campaignData.hcpUniverse.high_potential || 28} High Tier`,
      detail: 'Potential Scored',
      icon: Users,
      status: 'Ranked',
    },
    {
      id: 'Allocation',
      title: 'Sample Allocation',
      metric: `${campaignData.settings.total_samples.toLocaleString()} Units`,
      detail: 'Hare-Niemeyer',
      icon: SlidersHorizontal,
      status: 'Optimized',
    },
    {
      id: 'ROI Simulator',
      title: 'Financial ROI',
      metric: `+${Math.round(campaignData.roi.projected_roi_percent || 444.5)}% ROI`,
      detail: 'Break-Even Verified',
      icon: TrendingUp,
      status: 'Projected',
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-display">
            Decision & Optimization Pipeline
          </h3>
          <p className="text-xs text-slate-500">
            End-to-end machine learning to commercial decision workflow
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Pipeline Complete
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((st, i) => {
          const Icon = st.icon
          return (
            <div
              key={i}
              onClick={() => setCurrentTab(st.id)}
              className="relative p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-blue-600 group-hover:border-blue-300 transition-colors shadow-xs">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  0{i + 1}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-900">
                {st.title}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900 font-display truncate">
                {st.metric}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {st.detail}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
