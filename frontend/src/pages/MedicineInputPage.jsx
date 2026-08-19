import React, { useState } from 'react'
import { Pill, Sparkles, CheckCircle2 } from 'lucide-react'
import { useCampaign } from '../context/CampaignContext'
import { TargetMedicineForm } from '../components/medicine/TargetMedicineForm'
import { CampaignConfigForm } from '../components/medicine/CampaignConfigForm'
import { LiveEstimateSummary } from '../components/medicine/LiveEstimateSummary'
import { DEFAULT_CAMPAIGN_DATA } from '../mock/defaultCampaignData'

export const MedicineInputPage = () => {
  const { targetMedicine, campaignSettings, runOptimization, isOptimized, setCurrentTab } = useCampaign()

  const [formMedicine, setFormMedicine] = useState(targetMedicine)
  const [formSettings, setFormSettings] = useState(campaignSettings)

  const handleReset = () => {
    setFormMedicine(DEFAULT_CAMPAIGN_DATA.target)
    setFormSettings(DEFAULT_CAMPAIGN_DATA.settings)
  }

  const handleRun = () => {
    runOptimization(formMedicine, formSettings)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900">
              Target Medicine & Campaign Setup
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Configuration Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure the drug specifications, sample inventory, and economic parameters used by the ML optimization pipeline.
          </p>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Form Cards */}
        <div className="lg:col-span-8 space-y-6">
          <TargetMedicineForm
            medicine={formMedicine}
            onChange={setFormMedicine}
          />

          <CampaignConfigForm
            settings={formSettings}
            onChange={setFormSettings}
          />

          {isOptimized && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 block font-display">
                  Optimization Complete
                </span>
                <span className="text-xs text-blue-700">
                  Target medicine specs locked into active campaign.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentTab('Analog Analysis')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all"
              >
                Proceed to Analog Analysis →
              </button>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Live Estimate Summary Sticky Card */}
        <div className="lg:col-span-4">
          <LiveEstimateSummary
            medicine={formMedicine}
            settings={formSettings}
            onRun={handleRun}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  )
}
