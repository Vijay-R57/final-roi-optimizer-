import React from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { useCampaign } from '../../context/CampaignContext'

export const RESULTS_STEPS = [
  { id: 'Medicine Input', stepNum: '01', title: 'Medicine' },
  { id: 'Analog Analysis', stepNum: '02', title: 'Analog' },
  { id: 'HCP Intelligence', stepNum: '03', title: 'HCP Intelligence' },
  { id: 'Allocation', stepNum: '04', title: 'Allocation' },
  { id: 'Geographic Zones', stepNum: '05', title: 'Geography' },
  { id: 'ROI Simulator', stepNum: '06', title: 'ROI' },
]

export const StepNavigationHeader = () => {
  const { currentTab, setCurrentTab, isOptimized } = useCampaign()

  const currentIdx = RESULTS_STEPS.findIndex((s) => s.id === currentTab)

  // Don't render step header on Dashboard or Processing screen
  if (currentTab === 'Dashboard' || currentTab === 'Optimization Processing') {
    return null
  }

  return (
    <div className="mb-6 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-sm">
      <div className="flex items-center justify-between overflow-x-auto gap-2 text-xs scrollbar-none">
        {RESULTS_STEPS.map((step, idx) => {
          const isActive = currentTab === step.id
          const isCompleted = isOptimized && currentIdx > idx
          const isAccessible = isOptimized || idx <= (currentIdx > -1 ? currentIdx : 0)

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && setCurrentTab(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-display shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100/80 cursor-pointer border border-emerald-200/60'
                    : isAccessible
                    ? 'text-slate-600 hover:bg-slate-100 font-medium cursor-pointer'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.stepNum}
                </span>
                <span className="whitespace-nowrap">{step.title}</span>
              </button>

              {idx < RESULTS_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
