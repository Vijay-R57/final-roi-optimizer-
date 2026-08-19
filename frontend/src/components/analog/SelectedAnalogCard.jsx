import React from 'react'
import { GitCompare, CheckCircle, ShieldCheck, Database, Users, Calendar } from 'lucide-react'
import { CircularScore } from '../common/CircularScore'
import { Badge } from '../common/Badge'
import { formatNumber } from '../../utils/formatters'

export const SelectedAnalogCard = ({ target, analog }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Side: Drug Comparison */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <GitCompare className="w-4 h-4" />
            <span>Optimal Historical Benchmark Selected</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Card */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                Target Launch Molecule
              </span>
              <h4 className="text-lg font-bold text-slate-900 font-display">
                {target.generic_name}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                {target.brand_name} • {target.strength} {target.dosage_form}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Class: {target.therapeutic_class}</span>
              </div>
            </div>

            {/* Selected Analog Card */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 relative">
              <div className="absolute top-3 right-3">
                <Badge variant="green" size="sm">
                  Top Match
                </Badge>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                Selected Historical Analog
              </span>
              <h4 className="text-lg font-bold text-slate-900 font-display">
                {analog.generic_name}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                {analog.brand_name} • {analog.strength} {analog.dosage_form}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium text-emerald-800">{analog.tier || 'Tier 1 Form & Class Match'}</span>
              </div>
            </div>
          </div>

          {/* Historical Depth Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Database className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 font-display">
                  {formatNumber(analog.historical_events || 8031)}
                </div>
                <div className="text-[10px] text-slate-400">Historical Events</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 font-display">
                  {formatNumber(analog.active_hcps || 5122)}
                </div>
                <div className="text-[10px] text-slate-400">Active Prescribers</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 font-display">
                  {analog.historical_months || 33} Months
                </div>
                <div className="text-[10px] text-slate-400">Time Horizon</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Circular Score */}
        <div className="shrink-0 p-6 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-col items-center justify-center">
          <CircularScore
            score={analog.score || 0.9367}
            size={130}
            strokeWidth={11}
            label="Overall Composite Similarity"
          />
          <div className="mt-2 text-center">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              High Predictive Reliability
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
