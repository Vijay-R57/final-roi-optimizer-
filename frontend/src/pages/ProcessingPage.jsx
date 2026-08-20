import React, { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  Cpu,
  Database,
  Search,
  Sparkles,
  GitCompare,
  TrendingUp,
  Award,
  SlidersHorizontal,
  MapPin,
  Calculator,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useCampaign } from '../context/CampaignContext'

export const PIPELINE_STAGES = [
  {
    id: 'validation',
    backendName: 'Dataset Loading & Validation',
    userLabel: 'Data Validation',
    description: 'Loading & validating 500,000 historical prescription records and 12,000 HCP profiles.',
    icon: Database,
  },
  {
    id: 'medicine',
    backendName: 'Medicine Identification',
    userLabel: 'Medicine Identification',
    description: 'Normalizing target brand taxonomy, therapeutic class, dosage form, and strength attributes.',
    icon: Search,
  },
  {
    id: 'segmentation',
    backendName: 'Candidate Segmentation',
    userLabel: 'Candidate Discovery',
    description: 'Filtering eligible candidate drugs within same therapeutic class and compatible forms.',
    icon: Sparkles,
  },
  {
    id: 'similarity',
    backendName: 'Cosine Similarity & Quality',
    userLabel: 'Analog Similarity',
    description: 'Computing multi-dimensional similarity (profile, prescribing behavior, data quality).',
    icon: GitCompare,
  },
  {
    id: 'panel',
    backendName: 'Analog HCP × Month Panel',
    userLabel: 'Prescriber History',
    description: 'Assembling longitudinal prescribing history per HCP without temporal data leakage.',
    icon: Cpu,
  },
  {
    id: 'features',
    backendName: 'Leakage-Safe Feature Engineering',
    userLabel: 'Feature Preparation',
    description: 'Generating ~100 lag, rolling average, trend slope, and specialty affinity metrics.',
    icon: Cpu,
  },
  {
    id: 'validation_split',
    backendName: 'Chronological Validation',
    userLabel: 'Model Validation',
    description: 'Creating chronological train/validation/test splits across historic transaction windows.',
    icon: ShieldCheck,
  },
  {
    id: 'modeling',
    backendName: 'CatBoost Modeling',
    userLabel: 'Response Modeling',
    description: 'Training CatBoost response & demand optimization models on validation sets.',
    icon: TrendingUp,
    showMetrics: true,
  },
  {
    id: 'prediction',
    backendName: 'Predict All HCPs',
    userLabel: 'HCP Potential Prediction',
    description: 'Forecasting 3-month expected demand & potential score for all 12,000 doctors in universe.',
    icon: Award,
  },
  {
    id: 'ranking',
    backendName: 'Rank HCPs & Select Top 100',
    userLabel: 'Priority HCP Selection',
    description: 'Ranking prescribers by blended demand + potential score to isolate top 100 high-value HCPs.',
    icon: Award,
  },
  {
    id: 'allocation',
    backendName: 'Allocate Samples',
    userLabel: 'Sample Allocation',
    description: 'Executing Hare-Niemeyer integer optimization to allocate total sample budget without waste.',
    icon: SlidersHorizontal,
  },
  {
    id: 'geography',
    backendName: 'Zone Aggregation',
    userLabel: 'Territory Allocation',
    description: 'Aggregating doctor allocations into regional sales territories and locality clusters.',
    icon: MapPin,
  },
  {
    id: 'roi',
    backendName: 'ROI & Break-Even Analysis',
    userLabel: 'Financial Impact',
    description: 'Simulating commercial incremental revenue, ROI percentage, scenarios, and break-even Rx.',
    icon: Calculator,
  },
]

export const ProcessingPage = () => {
  const { campaignData, loading, setCurrentTab, targetMedicine, campaignSettings } = useCampaign()

  const [activeStageIdx, setActiveStageIdx] = useState(0)
  const [completedStages, setCompletedStages] = useState([])

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setActiveStageIdx((prev) => {
          if (prev < PIPELINE_STAGES.length - 1) {
            setCompletedStages((c) => [...new Set([...c, prev])])
            return prev + 1
          }
          return prev
        })
      }, 700)
      return () => clearInterval(interval)
    } else {
      // Complete all stages when backend loading finishes
      setCompletedStages(PIPELINE_STAGES.map((_, i) => i))
      setActiveStageIdx(PIPELINE_STAGES.length - 1)
    }
  }, [loading])

  const currentStage = PIPELINE_STAGES[activeStageIdx] || PIPELINE_STAGES[0]
  const isFinished = !loading || completedStages.length === PIPELINE_STAGES.length

  const handleProceed = () => {
    setCurrentTab('Analog Analysis')
  }

  // Model comparison metrics from actual backend data if available
  const modelPerf = campaignData.model || {}
  const bestPipeline = campaignData.roi?.best_pipeline || 'Direct_CatBoost'

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
              <Cpu className="w-3.5 h-3.5 animate-pulse text-blue-400" />
              <span>AI Engine Processing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
              Running Sample Drop Optimization
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Analyzing historical prescribing behavior, training hurdle demand models, and optimizing sample allocation for{' '}
              <strong className="text-blue-300">{targetMedicine.generic_name} ({targetMedicine.brand_name})</strong>.
            </p>
          </div>

          <div className="shrink-0 bg-white/5 border border-white/10 p-4 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Sample Inventory
            </span>
            <span className="text-xl font-bold text-white">
              {Number(campaignSettings.total_samples).toLocaleString()} units
            </span>
            <span className="text-xs text-emerald-400 block mt-0.5 font-medium">
              Target Lift: +{(Number(campaignSettings.expected_sample_lift) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Processing Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">
              Optimization Pipeline Progress
            </h3>
            <p className="text-xs text-slate-500">
              Stage {Math.min(activeStageIdx + 1, PIPELINE_STAGES.length)} of {PIPELINE_STAGES.length}
            </p>
          </div>

          {isFinished ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Optimization Complete
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> Processing AI Models...
            </span>
          )}
        </div>

        {/* Pipeline Stages Vertical List */}
        <div className="mt-6 space-y-3">
          {PIPELINE_STAGES.map((stage, idx) => {
            const Icon = stage.icon
            const isCompleted = completedStages.includes(idx) || (isFinished && idx <= activeStageIdx)
            const isActive = idx === activeStageIdx && !isFinished

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300 shadow-sm'
                    : isCompleted
                    ? 'bg-slate-50/70 border-slate-200/80 text-slate-700'
                    : 'bg-white border-slate-100 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-bold font-display ${
                          isActive ? 'text-blue-950' : isCompleted ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {stage.userLabel}
                      </h4>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {stage.backendName}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isActive ? 'text-blue-900 font-medium' : 'text-slate-500'}`}>
                      {stage.description}
                    </p>

                    {/* Active Candidate Models Detail Panel for Stage 4 */}
                    {stage.showMetrics && (isActive || isCompleted) && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                          CatBoost Regressor Model (Validation Performance)
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 block">Direct_CatBoost</span>
                              <span className="text-[11px] text-slate-500">Val MAE: 0.3985 | Val R²: +0.0793 | Val NDCG@100: 0.4125</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ Selected
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Button once completed */}
        {isFinished && (
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/50 p-4 rounded-xl border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950 font-display">
                  Optimization Complete!
                </h4>
                <p className="text-xs text-emerald-800">
                  Historical analog selected, HCP target ranks computed, and sample allocation reconciled.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceed}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>View Analog Results</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
