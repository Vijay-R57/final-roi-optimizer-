import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Edit3, ArrowLeft } from 'lucide-react'
import { useCampaign } from '../../context/CampaignContext'

export const ErrorBanner = () => {
  const { error, setError, runOptimization, setCurrentTab } = useCampaign()
  const [showDetails, setShowDetails] = useState(false)

  if (!error) return null

  const handleDismiss = () => {
    setError(null)
    setCurrentTab('Medicine Input')
  }

  return (
    <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50/90 p-5 text-slate-800 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5 border border-rose-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-rose-950 font-display">
              Optimization could not be completed
            </h4>
            <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
              {error.message || 'The optimization engine encountered an issue while processing this campaign.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => runOptimization()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Optimization</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('Medicine Input')}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-rose-200 text-rose-800 hover:bg-rose-100/70 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Review Inputs</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-rose-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Campaign</span>
          </button>
        </div>
      </div>

      {error.technical && (
        <div className="mt-3.5 pt-3 border-t border-rose-200">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1"
          >
            <span>Show technical details</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 bg-rose-950 text-rose-100 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {error.technical}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
