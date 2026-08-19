import React from 'react'
import {
  LayoutDashboard,
  Pill,
  GitCompare,
  Users,
  SlidersHorizontal,
  MapPin,
  TrendingUp,
  Cpu,
  ChevronRight,
} from 'lucide-react'
import { useCampaign } from '../../context/CampaignContext'

export const NAVIGATION_ITEMS = [
  {
    id: 'Dashboard',
    label: 'Dashboard',
    description: 'Executive Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'Medicine Input',
    label: 'Medicine Input',
    description: 'Target & Campaign Setup',
    icon: Pill,
  },
  {
    id: 'Analog Analysis',
    label: 'Analog Analysis',
    description: 'Historical Similarity',
    icon: GitCompare,
  },
  {
    id: 'HCP Intelligence',
    label: 'HCP Intelligence',
    description: 'Physician Potential & Tiers',
    icon: Users,
  },
  {
    id: 'Allocation',
    label: 'Allocation',
    description: 'Optimized Distribution',
    icon: SlidersHorizontal,
  },
  {
    id: 'Geographic Zones',
    label: 'Geographic Zones',
    description: 'Territory Analytics',
    icon: MapPin,
  },
  {
    id: 'ROI Simulator',
    label: 'ROI Simulator',
    description: 'Financial Sensitivity',
    icon: TrendingUp,
  },
]

export const Sidebar = () => {
  const { currentTab, setCurrentTab, campaignData, isOptimized, optimizationId } = useCampaign()

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-[calc(100vh-65px)]">
      {/* Active Medicine Sub-Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Current Target
          </span>
          {isOptimized && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
              {optimizationId || 'OPT-ACTIVE'}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div className="truncate">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {campaignData.target.generic_name}
            </h4>
            <p className="text-xs text-slate-500 truncate">
              {campaignData.target.brand_name} • {campaignData.target.strength}
            </p>
          </div>
          <span className="shrink-0 text-xs px-2 py-0.5 font-medium bg-blue-100 text-blue-800 rounded">
            {campaignData.target.therapeutic_class?.split(' ')[0] || 'Lipid'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                  }`}
                />
                <div className="truncate">
                  <div className="text-xs tracking-tight truncate">
                    {item.label}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isActive ? 'text-white/80 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          )
        })}
      </nav>

      {/* Engine Status Info Card */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>Optimization Engine</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Two-stage zero-inflated hurdle models with Hare-Niemeyer allocation.
          </p>
        </div>
      </div>
    </aside>
  )
}
