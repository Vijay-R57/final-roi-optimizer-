import React from 'react'
import { GitCompare, Sparkles, CheckCircle2 } from 'lucide-react'
import { useCampaign } from '../context/CampaignContext'
import { SelectedAnalogCard } from '../components/analog/SelectedAnalogCard'
import { SimilarityRadar } from '../components/analog/SimilarityRadar'
import { AnalogComparisonTable } from '../components/analog/AnalogComparisonTable'

export const AnalogAnalysisPage = () => {
  const { campaignData, setCampaignData, setCurrentTab } = useCampaign()
  const { target, analog, analogCandidates } = campaignData

  const handleSelectAnalog = (candidate) => {
    setCampaignData((prev) => ({
      ...prev,
      analog: {
        ...prev.analog,
        medicine_id: candidate.medicine_id,
        generic_name: candidate.generic_name,
        brand_name: candidate.brand_name,
        dosage_form: candidate.dosage_form,
        strength: candidate.strength,
        therapeutic_class: candidate.therapeutic_class,
        score: candidate.final_analog_score,
        profile: candidate.profile_similarity,
        behavior: candidate.behavior_similarity,
        data_quality: candidate.data_quality,
        historical_events: candidate.historical_events,
        active_hcps: candidate.active_hcps,
        historical_months: candidate.historical_months,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900">
              Historical Analog Analysis & Similarity Engine
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Surrogate Match
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Identify the historical benchmark medicine exhibiting the strongest prescribing affinity, clinical form compatibility, and transaction depth to guide demand forecasting.
          </p>
        </div>
      </div>

      {/* Selected Analog Hero Comparison Card */}
      <SelectedAnalogCard
        target={target}
        analog={analog}
      />

      {/* Similarity Radar & Breakdown */}
      <SimilarityRadar
        analog={analog}
      />

      {/* Candidate Analogs Comparison Table */}
      <AnalogComparisonTable
        candidates={analogCandidates || []}
        selectedId={analog.medicine_id}
        onSelectAnalog={handleSelectAnalog}
      />

      {/* Bottom Navigation CTA */}
      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={() => setCurrentTab('HCP Intelligence')}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <span>Continue to HCP Intelligence →</span>
        </button>
      </div>
    </div>
  )
}
