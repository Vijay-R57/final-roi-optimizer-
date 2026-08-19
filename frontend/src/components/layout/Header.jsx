import React from 'react'
import { Sparkles, Bell, HelpCircle, User, Activity, RefreshCw } from 'lucide-react'
import { useCampaign } from '../../context/CampaignContext'
import { Badge } from '../common/Badge'

export const Header = () => {
  const { loading, loadingStage, lastUpdated, isDemoMode, runOptimization } = useCampaign()

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
      <div className="px-6 py-3.5 flex items-center justify-between">
        {/* Left: Product Logo & Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 font-display tracking-tight">
                Sample Drop Optimization
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md uppercase tracking-wider">
                Enterprise AI
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              AI-Powered HCP Targeting & Sample Allocation
            </p>
          </div>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-4">
          {/* Real-time status indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="font-medium text-blue-700 max-w-xs truncate">
                  {loadingStage || 'Processing ML Pipeline...'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-700">Model Ready</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">{lastUpdated}</span>
              </>
            )}
          </div>

          {/* Demo Mode Pill (subtle) */}
          {isDemoMode && (
            <Badge variant="amber" size="sm">
              DEMO MODE
            </Badge>
          )}

          {/* Action Icons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              title="Documentation & Guide"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              title="Notifications"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center ring-2 ring-slate-100">
                VP
              </div>
              <div className="hidden lg:block text-left text-xs">
                <p className="font-semibold text-slate-800 leading-tight">Pharma Commercial</p>
                <p className="text-[11px] text-slate-400">Strategy & Ops</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
